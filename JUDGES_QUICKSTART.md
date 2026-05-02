# 🏆 ThreadKeeper - Quick Start for Judges

**Time to evaluate: 5-10 minutes**

This guide will help you quickly evaluate ThreadKeeper's features and functionality.

## ⚡ 3-Minute Setup

### Step 1: Install Dependencies (1 minute)
```bash
cd Threadkeeper
npm install
npm link
```

### Step 2: Capture Initial State (30 seconds)
```bash
tk save --note "Initial evaluation"
```

This captures:
- Git diff (your uncommitted changes)
- Terminal history (last 20 commands)
- Modified files (last 2 hours)
- Code structure analysis (classes, functions, dependencies)

### Step 3: Open Dashboard (30 seconds)
```bash
tk resume
```

This will:
- Generate a resumption manifest
- Start a local server on port 8000
- Automatically open the dashboard in your browser

**Alternative**: If auto-open doesn't work:
```bash
npx http-server -p 8000
# Then open: http://localhost:8000
```

## 🎯 Key Features to Evaluate

### 1. Dashboard Overview (2 minutes)

**Resumption Cards** (Top of page)
- ✅ **Objective**: Shows what was being worked on
- ✅ **Next Step**: Suggests concrete action
- ✅ **Dead Ends**: Identifies failed approaches
- ✅ **Last Error**: Highlights recent blockers

**Code Graph** (Main visualization)
- ✅ Interactive D3.js visualization
- ✅ Filter by type (class/function/dependency)
- ✅ Filter by language (JavaScript/Python/etc.)
- ✅ Search functionality
- ✅ Zoom, pan, drag nodes
- ✅ Click nodes for details

**Development Context** (Tabs)
- ✅ Git Diff: View uncommitted changes
- ✅ Terminal History: Last 20 commands
- ✅ Modified Files: Recent file changes

**Sidebar Features**
- ✅ Snapshot Timeline: Historical states
- ✅ Code Search: Find classes/functions
- ✅ Slack Handover: Team collaboration

### 2. CLI Commands (2 minutes)

Test these commands in order:

```bash
# View help
tk help

# List snapshots
tk list

# Generate handover note
tk handover

# Save another snapshot
tk save --note "Second capture"

# List again to see both snapshots
tk list
```

### 3. Advanced Features (Optional - 3 minutes)

**Snapshot Management:**
```bash
# Compare two snapshots
tk compare <timestamp1> <timestamp2>

# Restore a previous snapshot
tk restore <timestamp>

# Clean up old snapshots
tk clean --keep 5
```

**Git Integration:**
```bash
# Install auto-capture hooks
tk install-hooks
```

## 🔍 What to Look For

### ✅ Completeness
- [ ] CLI works without errors
- [ ] Dashboard loads and displays data
- [ ] All visualizations render correctly
- [ ] Filters and search work
- [ ] Snapshots save and restore

### ✅ Code Quality
- [ ] Clean, well-structured code
- [ ] Error handling present
- [ ] Clear documentation
- [ ] Follows best practices

### ✅ Innovation
- [ ] Interactive code graph visualization
- [ ] AI integration via MCP
- [ ] Snapshot system with timeline
- [ ] Multi-language support
- [ ] Team collaboration features

### ✅ User Experience
- [ ] Intuitive commands
- [ ] Clear help documentation
- [ ] Responsive dashboard
- [ ] Helpful error messages
- [ ] Professional design

## 🎨 Dashboard Features Checklist

Open the dashboard and verify:

**Header**
- [ ] ThreadKeeper logo/title displays
- [ ] Clean, professional design

**Resumption Cards (Top)**
- [ ] Objective card shows work context
- [ ] Next Step card shows actionable item
- [ ] Dead Ends card shows failed attempts
- [ ] Last Error card shows recent issues

**Code Graph (Center)**
- [ ] Graph renders with nodes and edges
- [ ] Type filter works (All/Class/Function/Dependency)
- [ ] Language filter works
- [ ] Search box filters nodes
- [ ] Zoom in/out works
- [ ] Pan (drag background) works
- [ ] Drag nodes works
- [ ] Click node shows details
- [ ] Legend displays correctly

**Context Tabs (Below Graph)**
- [ ] Git Diff tab shows changes
- [ ] Terminal History tab shows commands
- [ ] Modified Files tab shows file list

**Sidebar (Right)**
- [ ] Snapshot Timeline shows saved states
- [ ] Code Search allows searching
- [ ] Slack Handover displays note
- [ ] Copy button works

## 🔌 MCP Integration (Optional)

If you have IBM Bob configured:

1. Check `.bob/mcp.json` exists
2. Verify MCP server path is correct
3. Ask Bob to use ThreadKeeper tools:
   - "Save my current thread state"
   - "Show me the code graph"
   - "Find callers of captureState"

## 📊 Expected Results

After running `tk save` and `tk resume`, you should see:

**In Terminal:**
```
Capturing development state...
Analyzing codebase structure...
State captured successfully!
- Files modified in last 2 hours: X
- Git diff size: X characters
- Terminal history: 20 commands
- Code graph: X code items, X connections
```

**In Dashboard:**
- 4 resumption cards with analyzed content
- Interactive code graph with nodes
- Git diff (if you have uncommitted changes)
- Terminal history (last 20 commands)
- List of modified files
- Snapshot timeline with at least 1 entry

## 🐛 Troubleshooting

**Dashboard won't open:**
```bash
# Manually start server
npx http-server -p 8000
# Open browser to: http://localhost:8000
```

**No data showing:**
```bash
# Ensure you ran save first
tk save --note "test"
# Check data directory exists
ls data/
```

**CLI command not found:**
```bash
# Re-link the CLI
npm link
# Or use directly
node src/cli.js save
```

**Port 8000 in use:**
```bash
# Use different port
npx http-server -p 8001
```

## 📁 Files to Review

**Core Implementation:**
- `src/cli.js` - CLI commands (757 lines)
- `src/capture.js` - State capture logic (306 lines)
- `src/analyzer.js` - Code analysis (392 lines)
- `src/mcp-server.js` - MCP integration (829 lines)

**UI:**
- `index.html` - Dashboard (1572 lines, includes CSS and JS)

**Documentation:**
- `README.md` - Main documentation
- `USAGE_GUIDE.md` - Detailed usage
- `FEATURES_GUIDE.md` - Feature documentation
- `MCP_SETUP.md` - MCP integration guide

## 🎯 Evaluation Criteria

**Functionality (40%)**
- All CLI commands work
- Dashboard displays correctly
- Data capture is accurate
- Snapshot system functions
- MCP integration works

**Code Quality (30%)**
- Clean, readable code
- Proper error handling
- Good documentation
- Follows best practices
- Modular architecture

**Innovation (20%)**
- Interactive visualization
- AI integration
- Multi-language support
- Snapshot timeline
- Team collaboration

**User Experience (10%)**
- Intuitive interface
- Clear documentation
- Helpful error messages
- Professional design
- Easy to use

## ⏱️ Time Breakdown

- **Setup**: 2 minutes
- **Dashboard Review**: 3 minutes
- **CLI Testing**: 2 minutes
- **Code Review**: 3 minutes
- **Total**: ~10 minutes

## 🏁 Quick Verdict Checklist

- [ ] Project installs without errors
- [ ] CLI commands execute successfully
- [ ] Dashboard loads and displays data
- [ ] Code graph visualization works
- [ ] All features are functional
- [ ] Documentation is comprehensive
- [ ] Code quality is high
- [ ] Innovation is evident
- [ ] User experience is good
- [ ] Ready for production use

## 💡 Standout Features

1. **Complete Solution**: CLI + Dashboard + MCP integration
2. **Interactive Visualization**: D3.js code graph with filtering
3. **Snapshot System**: Historical state tracking with restore
4. **Multi-Language**: Supports 6+ programming languages
5. **AI Integration**: Full MCP protocol for IBM Bob
6. **Team Collaboration**: Handover notes for Slack
7. **Production Ready**: Error handling, cleanup, git hooks

---

**Questions?** Check the main README.md or other documentation files.

**Issues?** All features have been tested and should work on Windows, Mac, and Linux.

**Impressed?** This project demonstrates a complete development workflow tool with AI integration, built with modern web technologies and best practices.