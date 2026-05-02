#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs').promises;
const path = require('path');
const { captureState } = require('./capture');

/**
 * ThreadKeeper MCP Server
 * Exposes captured development state to IBM Bob via MCP protocol
 */
class ThreadKeeperServer {
  constructor() {
    this.server = new Server(
      {
        name: 'threadkeeper',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.threadFilePath = path.join(process.cwd(), 'data', 'thread.json');
    this.graphFilePath = path.join(process.cwd(), 'data', 'graph.json');
    this.setupHandlers();
  }

  /**
   * Read the graph.json file
   */
  async readGraphData() {
    try {
      const data = await fs.readFile(this.graphFilePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('No graph data found. Run "tk analyze" first to generate the code graph.');
      }
      throw new Error(`Failed to read graph data: ${error.message}`);
    }
  }

  /**
   * Fuzzy match a search term against a string
   * Returns a score (0-1) indicating match quality
   */
  fuzzyMatch(search, target) {
    if (!search || !target) return 0;
    
    search = search.toLowerCase();
    target = target.toLowerCase();
    
    // Exact match
    if (target === search) return 1.0;
    
    // Contains match
    if (target.includes(search)) return 0.8;
    
    // Fuzzy character matching
    let searchIndex = 0;
    let matches = 0;
    
    for (let i = 0; i < target.length && searchIndex < search.length; i++) {
      if (target[i] === search[searchIndex]) {
        matches++;
        searchIndex++;
      }
    }
    
    if (searchIndex === search.length) {
      return 0.5 * (matches / target.length);
    }
    
    return 0;
  }

  /**
   * Read the thread.json file
   */
  async readThreadData() {
    try {
      const data = await fs.readFile(this.threadFilePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('No thread data found. Run "tk save" first to capture state.');
      }
      throw new Error(`Failed to read thread data: ${error.message}`);
    }
  }

  /**
   * Setup MCP protocol handlers
   */
  setupHandlers() {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'thread://current',
            name: 'Current Thread State',
            description: 'The most recent captured development state including git diff, terminal history, and modified files',
            mimeType: 'application/json',
          },
        ],
      };
    });

    // Read resource content
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      if (uri === 'thread://current') {
        const threadData = await this.readThreadData();
        
        return {
          contents: [
            {
              uri: 'thread://current',
              mimeType: 'application/json',
              text: JSON.stringify(threadData, null, 2),
            },
          ],
        };
      }

      throw new Error(`Unknown resource: ${uri}`);
    });

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'save_thread',
            description: 'Capture the current development state and save to thread.json. Includes git diff, terminal history (last 20 commands), and files modified in the last 2 hours.',
            inputSchema: {
              type: 'object',
              properties: {
                note: {
                  type: 'string',
                  description: 'Optional note to include with this capture (e.g., "heading to lunch", "switching to bug fix")',
                },
              },
            },
          },
          {
            name: 'get_manifest',
            description: 'Get the Resumption Manifest - a structured summary to help the developer resume work. Returns the raw thread data for Bob to reason across and synthesize insights about: what they were working on (Objective), what error they hit (Last Error), what didn\'t work (Dead Ends), and what to do next (Next Step).',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'write_manifest',
            description: 'Write the synthesized manifest data to data/manifest.json for the dashboard to display. Call this after analyzing thread data with get_manifest to save the four key fields: objective, lastError, deadEnds, and nextStep.',
            inputSchema: {
              type: 'object',
              properties: {
                objective: {
                  type: 'string',
                  description: 'What the developer was working on when they paused',
                },
                lastError: {
                  type: 'string',
                  description: 'The most recent blocker or error encountered',
                },
                deadEnds: {
                  type: 'string',
                  description: 'Approaches that were tried but didn\'t work',
                },
                nextStep: {
                  type: 'string',
                  description: 'Concrete action to take next',
                },
              },
              required: ['objective', 'lastError', 'deadEnds', 'nextStep'],
            },
          },
          {
            name: 'get_handover',
            description: 'Get a handover note formatted for Slack. Returns the raw thread data for Bob to synthesize into a teammate-friendly message explaining the context, current blocker, and next steps.',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'query_graph_nodes',
            description: 'Search for code items (classes, functions, packages) in the code graph by name, type, or file. Supports fuzzy matching. Example: search for "CodeAnalyzer" to find the class, or "*.js" to find all JavaScript files.',
            inputSchema: {
              type: 'object',
              properties: {
                search: {
                  type: 'string',
                  description: 'Search term (node name, partial name, or file pattern)',
                },
                type: {
                  type: 'string',
                  description: 'Filter by node type: "class", "function", or "dependency"',
                },
                file: {
                  type: 'string',
                  description: 'Filter by file path (supports partial matching)',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results to return (default: 20)',
                },
              },
            },
          },
          {
            name: 'find_callers',
            description: 'Find all functions/classes that call a specific function. Useful for understanding where a function is used. Example: find what calls "captureState" to see its usage points.',
            inputSchema: {
              type: 'object',
              properties: {
                nodeName: {
                  type: 'string',
                  description: 'Name of the function/class to find callers for',
                },
              },
              required: ['nodeName'],
            },
          },
          {
            name: 'find_callees',
            description: 'Find all functions called by a specific function. Useful for understanding what a function does. Example: find what "setupHandlers" calls to see its dependencies.',
            inputSchema: {
              type: 'object',
              properties: {
                nodeName: {
                  type: 'string',
                  description: 'Name of the function/class to find callees for',
                },
              },
              required: ['nodeName'],
            },
          },
          {
            name: 'find_dependencies',
            description: 'Find all dependencies (imports/requires) of a class or function. Shows external packages and internal modules used. Example: find dependencies of "ThreadKeeperServer" to see what it imports.',
            inputSchema: {
              type: 'object',
              properties: {
                nodeName: {
                  type: 'string',
                  description: 'Name of the class/function to find dependencies for',
                },
              },
              required: ['nodeName'],
            },
          },
          {
            name: 'analyze_node',
            description: 'Get detailed information about a specific node including its type, file location, and all relationships (callers, callees, dependencies). Example: analyze "CodeAnalyzer" to see its complete structure.',
            inputSchema: {
              type: 'object',
              properties: {
                nodeName: {
                  type: 'string',
                  description: 'Name of the node to analyze',
                },
              },
              required: ['nodeName'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'save_thread': {
          const note = args?.note || '';
          
          try {
            const state = await captureState(note);
            
            return {
              content: [
                {
                  type: 'text',
                  text: `Thread state captured successfully!\n\nTimestamp: ${state.timestamp}\nNote: ${state.note || 'None'}\nGit diff: ${state.gitDiff.length} characters\nTerminal commands: ${state.terminalLog.length} entries\nRecent files: ${state.openFiles.length} modified\n\nSaved to: data/thread.json`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error capturing thread state: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        }

        case 'get_manifest': {
          const threadData = await this.readThreadData();
          
          // Format the data clearly for Bob to reason across
          const manifestData = {
            timestamp: threadData.timestamp,
            note: threadData.note,
            gitDiff: threadData.gitDiff,
            terminalLog: threadData.terminalLog,
            openFiles: threadData.openFiles,
            instructions: {
              objective: 'Analyze the git diff, terminal commands, and modified files to deduce what the developer was working on. Be specific about the feature, bug, or task.',
              lastError: 'Look for error messages in terminal history, failed commands, or error-related code changes in the git diff. Identify the most recent blocker.',
              deadEnds: 'Identify approaches that were tried but abandoned based on reverted changes, commented-out code, or multiple attempts at the same problem in terminal history.',
              nextStep: 'Based on the current state, suggest one concrete action the developer should take to move forward. Be specific and actionable.',
            },
          };

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(manifestData, null, 2),
              },
            ],
          };
        }

        case 'write_manifest': {
          const { objective, lastError, deadEnds, nextStep } = args;
          
          // Validate required fields
          if (!objective || !lastError || !deadEnds || !nextStep) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Error: All four fields (objective, lastError, deadEnds, nextStep) are required',
                },
              ],
              isError: true,
            };
          }

          const manifest = {
            objective,
            lastError,
            deadEnds,
            nextStep,
          };

          try {
            // Ensure data directory exists
            const dataDir = path.join(process.cwd(), 'data');
            await fs.mkdir(dataDir, { recursive: true });

            // Write manifest file
            const manifestPath = path.join(dataDir, 'manifest.json');
            await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

            return {
              content: [
                {
                  type: 'text',
                  text: `Manifest saved successfully to ${manifestPath}\n\nContent:\n${JSON.stringify(manifest, null, 2)}`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error writing manifest: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        }

        case 'get_handover': {
          const threadData = await this.readThreadData();
          
          // Format the data clearly for Bob to synthesize into a handover note
          const handoverData = {
            timestamp: threadData.timestamp,
            note: threadData.note,
            gitDiff: threadData.gitDiff,
            terminalLog: threadData.terminalLog,
            openFiles: threadData.openFiles,
            instructions: {
              format: 'Generate a Slack-ready handover message that a teammate can understand',
              sections: [
                'Context: What was being worked on (from git diff and file changes)',
                'Current blocker: The main issue or error encountered',
                'Next steps: Concrete actions for the next person',
                'Key files: List the most important files to look at',
                'Recent commands: Show relevant terminal commands for context',
              ],
              tone: 'Professional but friendly, clear and concise',
            },
          };

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(handoverData, null, 2),
              },
            ],
          };
        }

        case 'query_graph_nodes': {
          try {
            const graphData = await this.readGraphData();
            const { search, type, file, limit = 20 } = args || {};
            
            let results = graphData.nodes;
            
            // Filter by type if specified
            if (type) {
              results = results.filter(node => node.type === type);
            }
            
            // Filter by file if specified
            if (file) {
              results = results.filter(node =>
                node.file && node.file.toLowerCase().includes(file.toLowerCase())
              );
            }
            
            // Search by name if specified
            if (search) {
              results = results.map(node => ({
                ...node,
                score: this.fuzzyMatch(search, node.name) ||
                       (node.file ? this.fuzzyMatch(search, node.file) * 0.5 : 0)
              }))
              .filter(node => node.score > 0)
              .sort((a, b) => b.score - a.score);
            }
            
            // Apply limit
            results = results.slice(0, limit);
            
            // Format results
            const formattedResults = results.map(node => ({
              id: node.id,
              name: node.name,
              type: node.type,
              file: node.file || 'N/A',
              language: node.language || 'N/A',
              ...(node.score && { matchScore: node.score.toFixed(2) })
            }));
            
            return {
              content: [
                {
                  type: 'text',
                  text: `Found ${formattedResults.length} node(s):\n\n${JSON.stringify(formattedResults, null, 2)}`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error querying graph: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        }

        case 'find_callers': {
          try {
            const graphData = await this.readGraphData();
            const { nodeName } = args;
            
            if (!nodeName) {
              throw new Error('nodeName is required');
            }
            
            // Find the target node(s) by name
            const targetNodes = graphData.nodes.filter(node =>
              node.name.toLowerCase() === nodeName.toLowerCase()
            );
            
            if (targetNodes.length === 0) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `No node found with name "${nodeName}"`,
                  },
                ],
              };
            }
            
            // Find all connections that point to these code items
            const callers = [];
            for (const targetNode of targetNodes) {
              const incomingEdges = graphData.edges.filter(edge =>
                edge.target === targetNode.id && edge.type === 'calls'
              );
              
              for (const edge of incomingEdges) {
                const callerNode = graphData.nodes.find(n => n.id === edge.source);
                if (callerNode) {
                  callers.push({
                    caller: callerNode.name,
                    callerType: callerNode.type,
                    callerFile: callerNode.file || 'N/A',
                    target: targetNode.name,
                    targetFile: targetNode.file || 'N/A',
                  });
                }
              }
            }
            
            return {
              content: [
                {
                  type: 'text',
                  text: `Found ${callers.length} caller(s) for "${nodeName}":\n\n${JSON.stringify(callers, null, 2)}`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error finding callers: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        }

        case 'find_callees': {
          try {
            const graphData = await this.readGraphData();
            const { nodeName } = args;
            
            if (!nodeName) {
              throw new Error('nodeName is required');
            }
            
            // Find the source node(s) by name
            const sourceNodes = graphData.nodes.filter(node =>
              node.name.toLowerCase() === nodeName.toLowerCase()
            );
            
            if (sourceNodes.length === 0) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `No node found with name "${nodeName}"`,
                  },
                ],
              };
            }
            
            // Find all connections that originate from these code items
            const callees = [];
            for (const sourceNode of sourceNodes) {
              const outgoingEdges = graphData.edges.filter(edge =>
                edge.source === sourceNode.id && edge.type === 'calls'
              );
              
              for (const edge of outgoingEdges) {
                const calleeNode = graphData.nodes.find(n => n.id === edge.target);
                if (calleeNode) {
                  callees.push({
                    source: sourceNode.name,
                    sourceFile: sourceNode.file || 'N/A',
                    callee: calleeNode.name,
                    calleeType: calleeNode.type,
                    calleeFile: calleeNode.file || 'N/A',
                  });
                }
              }
            }
            
            return {
              content: [
                {
                  type: 'text',
                  text: `Found ${callees.length} callee(s) for "${nodeName}":\n\n${JSON.stringify(callees, null, 2)}`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error finding callees: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        }

        case 'find_dependencies': {
          try {
            const graphData = await this.readGraphData();
            const { nodeName } = args;
            
            if (!nodeName) {
              throw new Error('nodeName is required');
            }
            
            // Find the source node(s) by name
            const sourceNodes = graphData.nodes.filter(node =>
              node.name.toLowerCase() === nodeName.toLowerCase()
            );
            
            if (sourceNodes.length === 0) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `No node found with name "${nodeName}"`,
                  },
                ],
              };
            }
            
            // Find all dependency items connected to these code items
            const dependencies = [];
            for (const sourceNode of sourceNodes) {
              const outgoingEdges = graphData.edges.filter(edge =>
                edge.source === sourceNode.id
              );
              
              for (const edge of outgoingEdges) {
                const depNode = graphData.nodes.find(n => n.id === edge.target);
                if (depNode && depNode.type === 'dependency') {
                  dependencies.push({
                    source: sourceNode.name,
                    sourceFile: sourceNode.file || 'N/A',
                    dependency: depNode.name,
                    dependencyType: edge.type,
                  });
                }
              }
            }
            
            return {
              content: [
                {
                  type: 'text',
                  text: `Found ${dependencies.length} dependenc(ies) for "${nodeName}":\n\n${JSON.stringify(dependencies, null, 2)}`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error finding dependencies: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        }

        case 'analyze_node': {
          try {
            const graphData = await this.readGraphData();
            const { nodeName } = args;
            
            if (!nodeName) {
              throw new Error('nodeName is required');
            }
            
            // Find the target node(s) by name
            const targetNodes = graphData.nodes.filter(node =>
              node.name.toLowerCase() === nodeName.toLowerCase()
            );
            
            if (targetNodes.length === 0) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `No node found with name "${nodeName}"`,
                  },
                ],
              };
            }
            
            const analyses = [];
            
            for (const targetNode of targetNodes) {
              // Find callers (incoming call connections)
              const callers = graphData.edges
                .filter(edge => edge.target === targetNode.id && edge.type === 'calls')
                .map(edge => {
                  const caller = graphData.nodes.find(n => n.id === edge.source);
                  return caller ? { name: caller.name, file: caller.file } : null;
                })
                .filter(Boolean);
              
              // Find callees (outgoing call connections)
              const callees = graphData.edges
                .filter(edge => edge.source === targetNode.id && edge.type === 'calls')
                .map(edge => {
                  const callee = graphData.nodes.find(n => n.id === edge.target);
                  return callee ? { name: callee.name, type: callee.type, file: callee.file } : null;
                })
                .filter(Boolean);
              
              // Find dependencies (outgoing connections to dependency items)
              const dependencies = graphData.edges
                .filter(edge => edge.source === targetNode.id)
                .map(edge => {
                  const dep = graphData.nodes.find(n => n.id === edge.target);
                  return dep && dep.type === 'dependency' ? { name: dep.name } : null;
                })
                .filter(Boolean);
              
              // Find relationships (extends, implements, etc.)
              const relationships = graphData.edges
                .filter(edge =>
                  (edge.source === targetNode.id || edge.target === targetNode.id) &&
                  edge.type !== 'calls'
                )
                .map(edge => ({
                  type: edge.type,
                  direction: edge.source === targetNode.id ? 'outgoing' : 'incoming',
                  relatedNode: edge.source === targetNode.id ? edge.target : edge.source,
                }));
              
              analyses.push({
                node: {
                  id: targetNode.id,
                  name: targetNode.name,
                  type: targetNode.type,
                  file: targetNode.file || 'N/A',
                  language: targetNode.language || 'N/A',
                },
                callers: callers,
                callees: callees,
                dependencies: dependencies,
                relationships: relationships,
                summary: {
                  totalCallers: callers.length,
                  totalCallees: callees.length,
                  totalDependencies: dependencies.length,
                  totalRelationships: relationships.length,
                }
              });
            }
            
            return {
              content: [
                {
                  type: 'text',
                  text: `Analysis for "${nodeName}":\n\n${JSON.stringify(analyses, null, 2)}`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error analyzing node: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  /**
   * Start the MCP server
   */
  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('ThreadKeeper MCP server running on stdio');
  }
}

// Start the server
const server = new ThreadKeeperServer();
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Made with Bob
