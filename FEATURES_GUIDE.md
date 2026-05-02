# 🧵 Threadkeeper - Complete Features Guide

## 📍 Where Everything Is

### 🌐 Dashboard (http://127.0.0.1:8000)

**Visible Features:**
1. **Main Cards** - Shows current state
   - 🎯 Objective
   - ⚠️ Last Error
   - 🚫 Dead Ends
   - ✅ Next Step

2. **📝 Recent Changes** - Git diff viewer with filtering

3. **💻 Terminal Commands** - Last 20 commands with search

4. **📁 Modified Files** - Files changed in last 2 hours

5. **🕸️ Codebase Graph** - Interactive visualization
   - 42 nodes (classes, functions, dependencies)
   - 28 relationship edges
   - Drag, zoom, pan, filter, search
   - Color-coded by type

6. **💬 Handover Note** - Slack-ready team message


## 💻 CLI Commands

### Basic Commands
```bash
# Capture current state with note
tk save --note "your message here"

# View resumption manifest
tk resume

# Generate handover note
tk handover

# Install git hooks for auto-capture
tk install-hooks
```

### 🕰️ Time-Travel Debugging (NEW!)
```bash
# List all snapshots
tk list

# Compare two snapshots
tk compare 2026-05-01T21:45:55.096Z 2026-05-01T21:49:59.456Z

# Restore a previous snapshot
tk restore 2026-05-01T21:45:55.096Z

# Clean up old snapshots (keep last 10)
tk clean --keep 10
```

**Current Snapshots:**
- 2 snapshots saved
- Located in: `data/snapshots/`
- Index file: `data/snapshots/index.json`
- Each snapshot contains: `thread.json` and `graph.json`

---

## 🤖 MCP Tools for Bob

These tools are available through the MCP server for Bob to query the codebase:

### 1. **query_graph_nodes**
Search for nodes by name, type, or file
```javascript
// Bob can use this to find specific classes/functions
{
  "name": "CodeAnalyzer",  // fuzzy matching
  "type": "class",         // class, function, dependency
  "file": "analyzer.js",   // file path filter
  "limit": 20              // max results
}
```

### 2. **find_callers**
Find all functions/classes that call a specific function
```javascript
// Bob can ask: "What calls the captureState function?"
{
  "nodeName": "captureState"
}
```

### 3. **find_callees**
Find all functions called by a specific function
```javascript
// Bob can ask: "What does captureState call?"
{
  "nodeName": "captureState"
}
```

### 4. **find_dependencies**
Find all external dependencies
```javascript
// Bob can ask: "What packages does this use?"
{
  "nodeName": "CodeAnalyzer"
}
```

### 5. **analyze_node**
Get comprehensive information about a node
```javascript
// Bob can ask: "Tell me everything about CodeAnalyzer"
{
  "nodeName": "CodeAnalyzer"
}
```

**How Bob Uses These:**
- Bob connects to the MCP server via the `.bob/mcp.json` config
- Bob can query the graph to understand code structure
- Bob doesn't need to read every file - just queries the graph
- Enables intelligent navigation and debugging

---

## 📂 File Structure

```
Threadkeeper/
├── data/
│   ├── thread.json          # Current state (latest snapshot)
│   ├── graph.json           # Current graph (latest snapshot)
│   ├── manifest.json        # Dashboard data
│   └── snapshots/           # Time-travel snapshots
│       ├── index.json       # Snapshot metadata
│       ├── 2026-05-01T21-45-55.096Z/
│       │   ├── thread.json
│       │   └── graph.json
│       └── 2026-05-01T21-49-59.456Z/
│           ├── thread.json
│           └── graph.json
├── src/
│   ├── analyzer.js          # Code structure analyzer
│   ├── capture.js           # State capture + snapshots
│   ├── cli.js               # CLI commands
│   └── mcp-server.js        # MCP server with graph tools
├── index.html               # Dashboard UI
└── .bob/
    └── mcp.json             # MCP server config for Bob
```

---

## 🎯 Use Cases

### For Developers:
1. **Before leaving work:** `tk save --note "heading home"`
2. **When returning:** Open dashboard to see where you left off
3. **View history:** `tk list` to see all snapshots
4. **Compare changes:** `tk compare <time1> <time2>`
5. **Restore state:** `tk restore <timestamp>` if needed

### For Bob (AI Assistant):
1. **Understand codebase:** Use `query_graph_nodes` to find classes/functions
2. **Trace dependencies:** Use `find_callers` and `find_callees`
3. **Analyze structure:** Use `analyze_node` for detailed info
4. **Navigate efficiently:** Query graph instead of reading all files
5. **Debug intelligently:** Understand relationships without full context

### For Teams:
1. **Handoffs:** Use `tk handover` to generate Slack message
2. **Code reviews:** View dashboard to understand recent changes
3. **Architecture:** Use graph visualization to see structure
4. **History:** Compare snapshots to track evolution

---

## 🚀 What's Working Now

✅ **Dashboard** - All sections visible and interactive
✅ **Graph Visualization** - 42 nodes, 28 edges, fully interactive
✅ **Time-Travel** - 2 snapshots, compare/restore working
✅ **MCP Tools** - 5 graph querying tools for Bob
✅ **CLI Commands** - All commands functional
✅ **Auto-capture** - Saves snapshots with timestamps
✅ **Backward Compatible** - Old commands still work

---

## 📝 Next Steps (Optional)

**To add snapshot timeline to dashboard:**
- Add a timeline UI component showing all snapshots
- Click to view/restore previous snapshots
- Visual diff between snapshots

**To add MCP query UI:**
- Add a search box to query the graph
- Show query results in the dashboard
- Interactive exploration of relationships

**Current Status:**
- Snapshots: ✅ Working (CLI only)
- MCP Tools: ✅ Working (Bob can use them)
- Dashboard: ✅ Shows current state + graph
- Missing: UI for snapshots and MCP queries (optional enhancement)

---

## 🎉 Summary

**What You Have:**
- Complete working system with all core features
- Time-travel debugging via CLI
- Graph querying for Bob via MCP
- Interactive dashboard with visualization
- 2 snapshots already captured

**Where to See It:**
- Dashboard: http://127.0.0.1:8000
- Snapshots: `tk list` command
- MCP Tools: Bob uses them automatically
- Graph: Visible in dashboard (scroll down)

**The snapshot timeline and MCP querying work perfectly - they're just CLI/MCP features, not dashboard features (yet). You can add them to the UI as an optional enhancement!**