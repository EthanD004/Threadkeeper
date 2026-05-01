# ThreadKeeper Usage Guide

## Overview

ThreadKeeper captures your development context and uses AI (IBM Bob) to synthesize meaningful insights for resuming work or handing off to teammates.

## Workflow

### 1. Capture Your State

Whenever you're about to pause work, capture your current state:

```bash
tk save --note "implementing user authentication"
```

This saves to `data/thread.json`:
- Git diff (last 3000 characters)
- Terminal history (last 20 commands)
- Recently modified files (last 2 hours)
- Timestamp and your note

### 2. Generate the Manifest

When you need to resume work or understand where you left off, ask Bob:

**In your editor (VS Code with Bob):**
```
"Update my manifest" or "What was I working on?"
```

**What Bob does:**
1. Calls `get_manifest` MCP tool to read your thread data
2. Analyzes the git diff, terminal commands, and file changes
3. Synthesizes four key insights:
   - **Objective**: What you were working on
   - **Last Error**: The blocker you hit
   - **Dead Ends**: What didn't work
   - **Next Step**: What to do next
4. Calls `write_manifest` to save these to `data/manifest.json`

### 3. View the Dashboard

Open `index.html` in your browser to see a beautiful dashboard displaying:
- Your objective
- Last error encountered
- Dead ends to avoid
- Next step to take

The dashboard auto-loads from `data/manifest.json`.

## Example Conversation with Bob

```
You: "I'm back from lunch, what was I working on?"

Bob: [Uses get_manifest tool]
Let me check your thread...

You were working on implementing user authentication. You hit an error 
with JWT token validation - the secret key wasn't being loaded from 
environment variables. You tried hardcoding it (dead end - security issue) 
and using a config file (dead end - not found in production).

Next step: Add the JWT_SECRET to your .env file and verify it loads 
correctly with a console.log in your auth middleware.

[Uses write_manifest tool to save this analysis]
✓ Manifest updated! Your dashboard now shows this context.
```

## Commands

### `tk save [--note "message"]`
Capture current development state
- Saves git diff, terminal history, recent files
- Optional note for context

### `tk resume`
Display resumption manifest in terminal
- Shows placeholder text (for now)
- Saves placeholder manifest.json

### `tk handover`
Generate handover note template
- Shows Slack-ready format
- Use with Bob for AI-generated content

### `tk install-hooks`
Install git hooks for auto-capture
- Automatically runs `tk save` after each commit

## MCP Tools (for Bob)

### `save_thread`
Capture state programmatically from Bob
```
Parameters: { note: "optional note" }
```

### `get_manifest`
Get thread data for analysis
```
Returns: Thread data with instructions for synthesis
```

### `write_manifest`
Save synthesized insights
```
Parameters: {
  objective: "what you were working on",
  lastError: "the blocker you hit",
  deadEnds: "what didn't work",
  nextStep: "what to do next"
}
```

### `get_handover`
Get thread data for handover note generation
```
Returns: Thread data formatted for Slack handover
```

## Tips

1. **Capture frequently**: Run `tk save` before breaks, context switches, or end of day
2. **Use descriptive notes**: Help Bob understand your intent
3. **Ask Bob naturally**: "What was I doing?" or "Update my manifest"
4. **Check the dashboard**: Keep `index.html` open for quick context
5. **Install git hooks**: Auto-capture after commits with `tk install-hooks`

## Troubleshooting

### "No thread data found"
Run `tk save` first to capture your state.

### Dashboard shows placeholder text
Ask Bob to "update my manifest" - the dashboard needs synthesized data from Bob.

### MCP tools not working
1. Check `.bob/mcp.json` exists
2. Verify Bob's settings include the ThreadKeeper MCP server
3. Restart Bob/VS Code

## File Structure

```
Threadkeeper/
├── data/
│   ├── thread.json      # Raw captured state
│   └── manifest.json    # AI-synthesized insights
├── src/
│   ├── capture.js       # State capture logic
│   ├── cli.js           # CLI commands
│   └── mcp-server.js    # MCP server for Bob
├── index.html           # Dashboard UI
└── package.json
```

## Advanced: Custom Synthesis

You can ask Bob to analyze your thread in different ways:

```
"Give me a technical deep-dive of what I was working on"
"Explain this to a junior developer"
"What are the security implications of my recent changes?"
"Create a commit message from my recent work"
```

Bob will use `get_manifest` to access your thread data and provide custom analysis.

---

**Made with Bob** 🤖