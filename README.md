# 🧵 ThreadKeeper

**ThreadKeeper** is an intelligent development context manager that captures your work state and helps you resume seamlessly. Built for IBM Bob integration via MCP (Model Context Protocol).

## 🎯 What It Does

ThreadKeeper solves the "context switching" problem developers face daily:
- **Captures** your development state (git diff, terminal history, modified files, code structure)
- **Analyzes** your codebase to create an interactive code graph
- **Generates** resumption manifests to help you pick up where you left off
- **Creates** handover notes for team collaboration
- **Integrates** with IBM Bob via MCP for AI-assisted development

## 🚀 Quick Start (For Judges)

### Prerequisites
- Node.js (v14 or higher)
- Git (for git diff capture)
- A code editor (VS Code recommended)

### Installation

1. **Clone or extract the project:**
```bash
cd Threadkeeper
```

2. **Install dependencies:**
```bash
npm install
```

3. **Make the CLI globally available:**
```bash
npm link
```

### Basic Usage

1. **Capture your current state:**
```bash
tk save --note "Starting feature X"
```

2. **View the dashboard:**
```bash
tk resume
```
This will:
- Generate a resumption manifest
- Start a local server
- Open the dashboard in your browser

3. **Generate a handover note:**
```bash
tk handover
```

## 📊 Dashboard Features

The dashboard (accessible at `http://localhost:8000`) provides:

### 1. **Resumption Cards**
Four key insights to help you resume work:
- **Objective**: What you were working on
- **Next Step**: Concrete action to take
- **Dead Ends**: Approaches that didn't work
- **Last Error**: Recent blockers

### 2. **Interactive Code Graph**
- Visual representation of your codebase structure
- Shows classes, functions, and dependencies
- Filter by type, language, or search term
- Zoom, pan, and drag nodes
- Click nodes for detailed information

### 3. **Development Context**
- **Git Diff**: Your uncommitted changes
- **Terminal History**: Last 20 commands
- **Modified Files**: Files changed in last 2 hours

### 4. **Snapshot Timeline**
- View all saved snapshots chronologically
- Restore previous states
- Track development progress

### 5. **Code Search**
- Search for classes, functions, and files
- See usage relationships
- Find dependencies quickly

### 6. **Slack Handover**
- Pre-formatted handover note
- Copy to clipboard
- Share context with teammates

## 🛠️ CLI Commands

### Core Commands

```bash
# Capture current state
tk save [--note "message"]

# Display resumption manifest and open dashboard
tk resume

# Generate Slack handover note
tk handover

# Show comprehensive help
tk help
```

### Snapshot Management

```bash
# List all snapshots
tk list

# Restore a specific snapshot
tk restore <timestamp>

# Compare two snapshots
tk compare <timestamp1> <timestamp2>

# Clean up old snapshots (keep 10 most recent)
tk clean [--keep <n>]
```

### Git Integration

```bash
# Install git hooks for auto-capture
tk install-hooks
```

## 🔌 IBM Bob Integration (MCP)

ThreadKeeper connects to IBM Bob via the Model Context Protocol, providing:

### Available MCP Tools

1. **save_thread**: Capture current development state
2. **get_manifest**: Get resumption manifest data
3. **write_manifest**: Save synthesized manifest
4. **get_handover**: Generate handover note
5. **query_graph_nodes**: Search code graph
6. **find_callers**: Find what calls a function
7. **find_callees**: Find what a function calls
8. **find_dependencies**: Find dependencies of a class/function
9. **analyze_node**: Get detailed node information

### MCP Resources

- **thread://current**: Access current thread state

### Setup for Bob

The MCP server configuration is in `.bob/mcp.json`:

```json
{
  "mcpServers": {
    "threadkeeper": {
      "command": "node",
      "args": ["C:\\Users\\ethans laptop\\Desktop\\Threadkeeper\\src\\mcp-server.js"]
    }
  }
}
```

## 📁 Project Structure

```
Threadkeeper/
├── src/
│   ├── cli.js           # CLI command implementation
│   ├── capture.js       # State capture logic
│   ├── analyzer.js      # Code analysis engine
│   └── mcp-server.js    # MCP server for Bob integration
├── data/                # Generated data (gitignored)
│   ├── thread.json      # Current state
│   ├── graph.json       # Code graph
│   ├── manifest.json    # Resumption manifest
│   ├── handover.json    # Handover note
│   └── snapshots/       # Historical snapshots
├── index.html           # Dashboard UI
├── package.json         # Dependencies
└── README.md           # This file
```

## 🎨 Supported Languages

The code analyzer supports:
- JavaScript (.js, .jsx)
- TypeScript (.ts, .tsx)
- Python (.py)
- Java (.java)
- C# (.cs)
- Go (.go)

## 🔍 How It Works

### 1. State Capture
When you run `tk save`:
- Captures git diff (uncommitted changes)
- Reads terminal history (last 20 commands)
- Scans for files modified in last 2 hours
- Analyzes codebase structure (classes, functions, dependencies)
- Saves snapshot with timestamp

### 2. Code Analysis
The analyzer:
- Recursively scans source files
- Extracts classes, functions, and imports
- Builds a graph of relationships
- Supports multiple programming languages

### 3. Manifest Generation
When you run `tk resume`:
- Analyzes captured state
- Identifies what you were working on
- Detects recent errors
- Suggests next steps
- Opens interactive dashboard

### 4. MCP Integration
Bob can:
- Access your development state
- Query the code graph
- Generate insights
- Help you resume work

## 💡 Use Cases

### For Individual Developers
- **Context Switching**: Save state before switching tasks
- **Break Time**: Capture state before lunch/end of day
- **Bug Hunting**: Track what you tried that didn't work
- **Code Review**: Visualize code structure

### For Teams
- **Handovers**: Generate notes when passing work
- **Onboarding**: Help new developers understand codebase
- **Documentation**: Auto-generate code structure docs
- **Collaboration**: Share context with teammates

### With IBM Bob
- **AI Assistance**: Bob understands your development context
- **Code Navigation**: Ask Bob about code relationships
- **Problem Solving**: Bob can analyze your dead ends
- **Resumption**: Bob helps you get back into flow

## 🧪 Testing the Project

### 1. Test CLI Commands
```bash
# Test save
tk save --note "test capture"

# Test list
tk list

# Test resume (opens dashboard)
tk resume

# Test handover
tk handover
```

### 2. Test Dashboard
1. Run `tk resume` or manually start server:
   ```bash
   npx http-server -p 8000
   ```
2. Open `http://localhost:8000`
3. Verify all sections load:
   - Resumption cards
   - Code graph visualization
   - Git diff display
   - Terminal history
   - Modified files
   - Snapshot timeline

### 3. Test MCP Integration
1. Ensure Bob is configured with the MCP server
2. Ask Bob to use ThreadKeeper tools
3. Verify Bob can access thread data

## 🐛 Troubleshooting

### Dashboard won't load
- Ensure server is running on port 8000
- Check if another process is using the port
- Try manually: `npx http-server -p 8000`

### No data showing
- Run `tk save` first to capture state
- Check if `data/` directory exists
- Verify `data/thread.json` and `data/graph.json` exist

### CLI command not found
- Run `npm link` to make `tk` globally available
- Or use `node src/cli.js` directly

### MCP server not connecting
- Verify path in `.bob/mcp.json` is correct
- Check Bob's MCP configuration
- Restart Bob after configuration changes

## 📚 Additional Documentation

- **USAGE_GUIDE.md**: Detailed usage instructions
- **FEATURES_GUIDE.md**: Complete feature documentation
- **SIMPLE_GUIDE.md**: Quick start guide
- **MCP_SETUP.md**: MCP integration setup
- **IMPLEMENTATION_SUMMARY.md**: Technical implementation details

## 🏆 Key Features for Judges

1. **Complete Solution**: CLI + Dashboard + MCP integration
2. **Multi-Language Support**: Works with 6+ programming languages
3. **Interactive Visualization**: D3.js code graph with filtering
4. **Snapshot System**: Historical state tracking with restore
5. **Team Collaboration**: Handover notes for Slack
6. **AI Integration**: Full MCP protocol implementation for Bob
7. **Production Ready**: Error handling, cleanup, git hooks
8. **User Friendly**: Comprehensive help, clear UI, intuitive commands

## 📝 License

ISC

## 👨‍💻 Author

Built by Ethan Doyle and Ayonete with IBM Bob

---

**For judges**: This project demonstrates a complete development workflow tool with AI integration. Run `tk save` to capture state, then `tk resume` to see the full dashboard experience. The MCP integration allows IBM Bob to understand and assist with your development context.
