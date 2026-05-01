const fs = require('fs').promises;
const path = require('path');

/**
 * Code Analyzer - Extracts classes, functions, and relationships from source files
 * Supports: JavaScript, TypeScript, Python, Java, C#, Go
 */

class CodeAnalyzer {
  constructor() {
    this.nodes = new Map(); // id -> node
    this.edges = [];
    this.fileExtensions = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cs': 'csharp',
      '.go': 'go'
    };
  }

  /**
   * Analyze a directory and extract code structure
   */
  async analyzeDirectory(dirPath, options = {}) {
    const { maxDepth = 5, excludeDirs = ['node_modules', '.git', 'dist', 'build', '__pycache__'] } = options;
    
    await this.scanDirectory(dirPath, dirPath, 0, maxDepth, excludeDirs);
    
    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
      metadata: {
        totalNodes: this.nodes.size,
        totalEdges: this.edges.length,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Recursively scan directory for source files
   */
  async scanDirectory(basePath, currentPath, depth, maxDepth, excludeDirs) {
    if (depth >= maxDepth) return;

    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const relativePath = path.relative(basePath, fullPath);

        if (entry.isDirectory()) {
          if (!excludeDirs.includes(entry.name)) {
            await this.scanDirectory(basePath, fullPath, depth + 1, maxDepth, excludeDirs);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (this.fileExtensions[ext]) {
            await this.analyzeFile(fullPath, relativePath, this.fileExtensions[ext]);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning ${currentPath}:`, error.message);
    }
  }

  /**
   * Analyze a single file
   */
  async analyzeFile(filePath, relativePath, language) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      switch (language) {
        case 'javascript':
        case 'typescript':
          this.analyzeJavaScript(content, relativePath);
          break;
        case 'python':
          this.analyzePython(content, relativePath);
          break;
        case 'java':
          this.analyzeJava(content, relativePath);
          break;
        case 'csharp':
          this.analyzeCSharp(content, relativePath);
          break;
        case 'go':
          this.analyzeGo(content, relativePath);
          break;
      }
    } catch (error) {
      console.error(`Error analyzing ${filePath}:`, error.message);
    }
  }

  /**
   * Analyze JavaScript/TypeScript code
   */
  analyzeJavaScript(content, filePath) {
    // Extract classes
    const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?/g;
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      const parentClass = match[2];
      const nodeId = `${filePath}:${className}`;
      
      this.addNode({
        id: nodeId,
        name: className,
        type: 'class',
        file: filePath,
        language: 'javascript'
      });

      if (parentClass) {
        this.addEdge(nodeId, `${filePath}:${parentClass}`, 'extends');
      }
    }

    // Extract functions (including arrow functions and methods)
    const functionRegex = /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(|(\w+)\s*:\s*(?:async\s*)?\(|(\w+)\s*\([^)]*\)\s*{)/g;
    while ((match = functionRegex.exec(content)) !== null) {
      const funcName = match[1] || match[2] || match[3] || match[4];
      if (funcName && !['if', 'for', 'while', 'switch', 'catch'].includes(funcName)) {
        const nodeId = `${filePath}:${funcName}`;
        
        this.addNode({
          id: nodeId,
          name: funcName,
          type: 'function',
          file: filePath,
          language: 'javascript'
        });
      }
    }

    // Extract imports/requires
    const importRegex = /(?:import\s+.*?\s+from\s+['"](.+?)['"]|require\s*\(['"](.+?)['"]\))/g;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1] || match[2];
      if (importPath && !importPath.startsWith('.')) {
        // External dependency
        const depId = `dep:${importPath}`;
        this.addNode({
          id: depId,
          name: importPath,
          type: 'dependency',
          file: null,
          language: 'javascript'
        });
      }
    }

    // Extract function calls (simplified)
    const callRegex = /(\w+)\s*\(/g;
    const calls = new Set();
    while ((match = callRegex.exec(content)) !== null) {
      const calledFunc = match[1];
      if (calledFunc && !['if', 'for', 'while', 'switch', 'catch', 'return'].includes(calledFunc)) {
        calls.add(calledFunc);
      }
    }

    // Create call edges
    calls.forEach(calledFunc => {
      const targetId = `${filePath}:${calledFunc}`;
      if (this.nodes.has(targetId)) {
        // Add edge from file to called function
        this.addEdge(`file:${filePath}`, targetId, 'calls');
      }
    });
  }

  /**
   * Analyze Python code
   */
  analyzePython(content, filePath) {
    // Extract classes
    const classRegex = /class\s+(\w+)(?:\(([^)]+)\))?:/g;
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      const parents = match[2];
      const nodeId = `${filePath}:${className}`;
      
      this.addNode({
        id: nodeId,
        name: className,
        type: 'class',
        file: filePath,
        language: 'python'
      });

      if (parents) {
        parents.split(',').forEach(parent => {
          const parentName = parent.trim();
          if (parentName && parentName !== 'object') {
            this.addEdge(nodeId, `${filePath}:${parentName}`, 'extends');
          }
        });
      }
    }

    // Extract functions
    const functionRegex = /def\s+(\w+)\s*\(/g;
    while ((match = functionRegex.exec(content)) !== null) {
      const funcName = match[1];
      const nodeId = `${filePath}:${funcName}`;
      
      this.addNode({
        id: nodeId,
        name: funcName,
        type: 'function',
        file: filePath,
        language: 'python'
      });
    }

    // Extract imports
    const importRegex = /(?:from\s+(\S+)\s+import|import\s+(\S+))/g;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1] || match[2];
      if (importPath && !importPath.startsWith('.')) {
        const depId = `dep:${importPath}`;
        this.addNode({
          id: depId,
          name: importPath,
          type: 'dependency',
          file: null,
          language: 'python'
        });
      }
    }
  }

  /**
   * Analyze Java code
   */
  analyzeJava(content, filePath) {
    // Extract classes
    const classRegex = /(?:public\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?/g;
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      const parentClass = match[2];
      const nodeId = `${filePath}:${className}`;
      
      this.addNode({
        id: nodeId,
        name: className,
        type: 'class',
        file: filePath,
        language: 'java'
      });

      if (parentClass) {
        this.addEdge(nodeId, `${filePath}:${parentClass}`, 'extends');
      }
    }

    // Extract methods
    const methodRegex = /(?:public|private|protected)\s+(?:static\s+)?(?:\w+(?:<[^>]+>)?)\s+(\w+)\s*\(/g;
    while ((match = methodRegex.exec(content)) !== null) {
      const methodName = match[1];
      const nodeId = `${filePath}:${methodName}`;
      
      this.addNode({
        id: nodeId,
        name: methodName,
        type: 'function',
        file: filePath,
        language: 'java'
      });
    }
  }

  /**
   * Analyze C# code
   */
  analyzeCSharp(content, filePath) {
    // Extract classes
    const classRegex = /(?:public\s+)?class\s+(\w+)(?:\s*:\s*(\w+))?/g;
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      const parentClass = match[2];
      const nodeId = `${filePath}:${className}`;
      
      this.addNode({
        id: nodeId,
        name: className,
        type: 'class',
        file: filePath,
        language: 'csharp'
      });

      if (parentClass) {
        this.addEdge(nodeId, `${filePath}:${parentClass}`, 'extends');
      }
    }

    // Extract methods
    const methodRegex = /(?:public|private|protected)\s+(?:static\s+)?(?:\w+(?:<[^>]+>)?)\s+(\w+)\s*\(/g;
    while ((match = methodRegex.exec(content)) !== null) {
      const methodName = match[1];
      const nodeId = `${filePath}:${methodName}`;
      
      this.addNode({
        id: nodeId,
        name: methodName,
        type: 'function',
        file: filePath,
        language: 'csharp'
      });
    }
  }

  /**
   * Analyze Go code
   */
  analyzeGo(content, filePath) {
    // Extract structs (Go's equivalent of classes)
    const structRegex = /type\s+(\w+)\s+struct/g;
    let match;
    while ((match = structRegex.exec(content)) !== null) {
      const structName = match[1];
      const nodeId = `${filePath}:${structName}`;
      
      this.addNode({
        id: nodeId,
        name: structName,
        type: 'class',
        file: filePath,
        language: 'go'
      });
    }

    // Extract functions
    const functionRegex = /func\s+(?:\([^)]+\)\s+)?(\w+)\s*\(/g;
    while ((match = functionRegex.exec(content)) !== null) {
      const funcName = match[1];
      const nodeId = `${filePath}:${funcName}`;
      
      this.addNode({
        id: nodeId,
        name: funcName,
        type: 'function',
        file: filePath,
        language: 'go'
      });
    }
  }

  /**
   * Add a node to the graph
   */
  addNode(node) {
    if (!this.nodes.has(node.id)) {
      this.nodes.set(node.id, node);
    }
  }

  /**
   * Add an edge to the graph
   */
  addEdge(sourceId, targetId, type) {
    // Avoid duplicate edges
    const edgeExists = this.edges.some(
      e => e.source === sourceId && e.target === targetId && e.type === type
    );
    
    if (!edgeExists) {
      this.edges.push({
        source: sourceId,
        target: targetId,
        type
      });
    }
  }
}

module.exports = { CodeAnalyzer };

// Made with Bob
