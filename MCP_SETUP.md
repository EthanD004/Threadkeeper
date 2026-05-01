# ThreadKeeper MCP Server Setup for IBM Bob

## Overview
ThreadKeeper exposes your captured development state through the Model Context Protocol (MCP), allowing IBM Bob to access your git diff, terminal history, and recently modified files as context during conversations.

## How IBM Bob Uses MCP
IBM Bob supports MCP through VS Code integration (Roo Cline extension). When configured, the MCP server exposes ThreadKeeper's captured state as context that IBM Bob can automatically access and use to understand your development workflow.

## Installation

The MCP server is already installed with ThreadKeeper. Make sure you've run:
```bash
npm install
```

## Configuration for IBM Bob

IBM Bob uses a project-level MCP configuration file. The configuration has already been created at `.bob/mcp.json` in your project directory.

**To verify the setup:**

1. Check that `.bob/mcp.json` exists in your project root
2. Reload VS Code window (Ctrl+Shift+P > "Developer: Reload Window")
3. Open the IBM Bob sidebar and click on "MCP Servers" to see if ThreadKeeper is connected

The MCP server will automatically start when IBM Bob needs to access your thread context!


## Usage

### 1. Capture Your Development State
Before using the MCP server, capture your current state:
```bash
tk save --note "Working on feature X"
```

### 2. Access in IBM Bob

Once configured, IBM Bob will have access to:

#### Resources:
- **thread://current** - Full captured state as JSON

#### Tools:
- **get_thread_summary** - Get overview of captured state
- **get_git_diff** - Get only the git diff
- **get_terminal_history** - Get only terminal history
- **get_recent_files** - Get list of recently modified files

### Example Prompts for IBM Bob:

- "What changes have I made in my git diff?"
- "Show me my recent terminal commands"
- "What files have I been working on?"
- "Summarize my current development context"
- "Read my thread context and help me continue where I left off"

## How It Works

1. **Capture**: `tk save` captures your state to `data/thread.json`
2. **Expose**: MCP server reads `data/thread.json` and exposes it via MCP protocol
3. **Access**: IBM Bob reads and queries this data through the MCP protocol

## Troubleshooting

### Server Not Appearing in IBM Bob
- Verify the paths in VS Code settings.json are correct (use absolute paths)
- Reload VS Code window (Ctrl+Shift+P > "Developer: Reload Window")
- Check that `data/thread.json` exists (run `tk save` first)
- Check VS Code Output panel for MCP server errors


### "No thread data found" Error
- Run `tk save` to capture your current state first
- Verify `data/thread.json` exists in your project

### Permission Issues
- Ensure Node.js has permission to read the project directory
- On Windows, run Claude Desktop as administrator if needed

## Development

To test the MCP server directly:
```bash
npm run mcp
```

The server communicates via stdio, so you'll need an MCP client to interact with it properly.