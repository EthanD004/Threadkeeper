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
    this.setupHandlers();
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
            description: 'Capture the current development state and save to thread.json. Includes git diff, terminal history (last 50 commands), and files modified in the last 2 hours.',
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
            name: 'get_handover',
            description: 'Get a handover note formatted for Slack. Returns the raw thread data for Bob to synthesize into a teammate-friendly message explaining the context, current blocker, and next steps.',
            inputSchema: {
              type: 'object',
              properties: {},
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
