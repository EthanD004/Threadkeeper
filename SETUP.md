# 🚀 ThreadKeeper Setup Guide

**Complete setup instructions for judges and users**

## ⚡ Quick Start (3 Minutes)

### Prerequisites
- Node.js v14 or higher
- Git (for git diff features)
- A terminal/command prompt

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/EthanD004/Threadkeeper.git
cd Threadkeeper
```

2. **Install dependencies:**
```bash
npm install
```

3. **Verify installation:**
```bash
node verify-setup.js
```

You should see all checks pass (28/28).

4. **Test the application:**
```bash
# Capture your first state
node src/cli.js save --note "First test"

# Open the dashboard
node src/cli.js resume
```

The dashboard will open at http://localhost:8000

## 🎯 For Hackathon Judges

### Without IBM Bob (Standalone Mode)

ThreadKeeper works completely standalone. All features are functional:

**Test these commands:**
```bash
# View help
node src/cli.js help

# Capture state
node src/cli.js save --note "Demo for judges"

# List snapshots
node src/cli.js list

# Open dashboard
node src/cli.js resume

# Generate handover note
node src/cli.js handover
```

**Dashboard Features (http://localhost:8000):**
- ✅ Interactive D3.js code graph
- ✅ Resumption cards (Objective, Next Step, Dead Ends, Last Error)
- ✅ Git diff viewer
- ✅ Terminal history
- ✅ Modified files list
- ✅ Snapshot timeline
- ✅ Code search

### With IBM Bob (Full AI Experience)

To see the complete AI-powered experience:

**1. Configure Bob's MCP Connection:**

Edit `.bob/mcp.json` and update the path:
```json
{
  "mcpServers": {
    "threadkeeper": {
      "command": "node",
      "args": ["YOUR_PATH_HERE/Threadkeeper/src/mcp-server.js"]
    }
  }
}
```

**2. Restart IBM Bob**

**3. Capture some state:**
```bash
node src/cli.js save --note "Working on authentication"
```

**4. Ask Bob to help:**

In Bob's chat, try these commands:

```
"Use ThreadKeeper to show me what I was working on"

"Find all functions that call captureState"

"Generate a resumption manifest for my current work"

"Create a handover note for my teammate"

"Show me the dependencies of ThreadKeeperServer class"
```

**Bob's MCP Tools:**
- `save_thread` - Capture development state
- `get_manifest` - Get thread data for AI analysis
- `write_manifest` - Save AI-generated insights
- `get_handover` - Generate team handover notes
- `query_graph_nodes` - Search code graph
- `find_callers` - Find function callers
- `find_callees` - Find function callees
- `find_dependencies` - Find class dependencies
- `analyze_node` - Get detailed node info

## 📋 Available Commands

### Core Commands

```bash
# Capture current development state
node src/cli.js save [--note "message"]

# Display resumption manifest and open dashboard
node src/cli.js resume

# Generate Slack-ready handover note
node src/cli.js handover

# Show comprehensive help
node src/cli.js help
```

### Snapshot Management

```bash
# List all saved snapshots
node src/cli.js list

# Restore a specific snapshot
node src/cli.js restore <timestamp>

# Compare two snapshots
node src/cli.js compare <timestamp1> <timestamp2>

# Clean up old snapshots (keep 10 most recent)
node src/cli.js clean [--keep <n>]
```

### Git Integration

```bash
# Install git hooks for auto-capture
node src/cli.js install-hooks
```

## 🔧 Troubleshooting

### Dashboard won't load
```bash
# Manually start server
npx http-server -p 8000
# Then open: http://localhost:8000
```

### No data showing
```bash
# Ensure you ran save first
node src/cli.js save --note "test"

# Check data directory exists
ls data/
```

### CLI command not found
```bash
# Use node directly
node src/cli.js <command>

# Or install globally
npm link
tk <command>
```

### Port 8000 in use
```bash
# Use different port
npx http-server -p 8001
```

### Bob not connecting
1. Verify path in `.bob/mcp.json` is correct
2. Restart IBM Bob
3. Check Bob's MCP configuration panel
4. Look for ThreadKeeper in Bob's available tools

## 📊 What Gets Captured

When you run `tk save`, ThreadKeeper captures:

1. **Git Diff** - Your uncommitted changes (truncated to 3000 chars)
2. **Terminal History** - Last 20 commands from your shell
3. **Modified Files** - Files changed in the last 2 hours
4. **Code Structure** - Classes, functions, dependencies from your codebase

All data is saved to:
- `data/thread.json` - Current state
- `data/graph.json` - Code structure graph
- `data/snapshots/` - Historical snapshots

## 🎨 Dashboard Features

### Resumption Cards
- **Objective**: What you were working on (from git diff)
- **Next Step**: Suggested action (from recent files)
- **Dead Ends**: Failed approaches (from code patterns)
- **Last Error**: Recent blockers (from terminal history)

### Code Graph
- Interactive D3.js visualization
- Filter by type (class/function/dependency)
- Filter by language
- Search functionality
- Zoom, pan, drag nodes
- Click for details

### Context Tabs
- **Git Diff**: View uncommitted changes
- **Terminal History**: Last 20 commands
- **Modified Files**: Recent file changes

### Sidebar
- **Snapshot Timeline**: Historical states
- **Code Search**: Find classes/functions
- **Slack Handover**: Team collaboration notes

## 🏗️ Project Structure

```
Threadkeeper/
├── src/
│   ├── cli.js           # CLI commands
│   ├── capture.js       # State capture logic
│   ├── analyzer.js      # Code analysis engine
│   └── mcp-server.js    # MCP server for Bob
├── bob-sessions/        # Bob task logs and screenshots
├── data/                # Generated data (gitignored)
├── index.html           # Dashboard UI
├── verify-setup.js      # Setup verification script
├── package.json         # Dependencies
├── README.md           # Project overview
└── SETUP.md            # This file
```

## 🔍 Supported Languages

The code analyzer supports:
- JavaScript (.js, .jsx)
- TypeScript (.ts, .tsx)
- Python (.py)
- Java (.java)
- C# (.cs)
- Go (.go)

## 💡 Tips

- Run `tk save` before taking breaks or switching tasks
- Use `tk resume` when returning to work
- Add notes to captures for better context
- Install git hooks for automatic state capture
- Use the dashboard to visualize your codebase structure
- Generate handover notes when passing work to teammates

## 🤝 For Team Use

**Handover Workflow:**
1. Developer A: `tk save --note "Heading out"`
2. Developer A: `tk handover` (copy to Slack)
3. Developer B: Reads handover note
4. Developer B: `tk resume` (sees full context)

## 📚 Additional Documentation

- **README.md** - Project overview and features
- **JUDGES_QUICKSTART.md** - Quick evaluation guide (5-10 min)
- **bob-sessions/** - Bob integration examples and screenshots
- **verify-setup.js** - Automated setup verification

## 🏆 Key Features

**For Developers:**
- Context preservation across task switches
- Visual code structure exploration
- Team collaboration via handover notes
- Historical state tracking

**For Teams:**
- Seamless handovers between developers
- Shared understanding of codebase
- Reduced onboarding time
- Better collaboration

**With IBM Bob:**
- AI-powered insights
- Natural language code queries
- Intelligent manifest generation
- Context-aware assistance

## ❓ Need Help?

1. Run `node src/cli.js help` for command reference
2. Run `node verify-setup.js` to check installation
3. Check `bob-sessions/` for Bob integration examples
4. Review README.md for detailed documentation

---

**Ready to start?** Run `node src/cli.js save --note "Getting started"` and then `node src/cli.js resume` to see ThreadKeeper in action!