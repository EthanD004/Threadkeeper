# Testing ThreadKeeper MCP Server with IBM Bob - Step by Step

Follow these exact steps to verify the MCP server is working:

## Step 1: Capture Your Current State
Open PowerShell in your ThreadKeeper directory and run:
```powershell
tk save --note "Testing MCP connection"
```

**Expected output:**
```
Capturing development state...
State captured successfully!
- Files modified in last 2 hours: X
- Git diff size: X characters
- Terminal history size: X characters
- Saved to: C:\Users\ethans laptop\Desktop\Threadkeeper\data\thread.json
```

## Step 2: Verify thread.json Exists
Check that the file was created:
```powershell
Get-Content data/thread.json | Select-Object -First 10
```

**Expected output:** You should see JSON with timestamp, note, gitDiff, terminalLog, and openFiles fields.

## Step 3: Verify MCP Configuration
1. Check that `.bob/mcp.json` exists in your project root
2. The file should contain:
```json
{
  "mcpServers": {
    "threadkeeper": {
      "command": "node",
      "args": [
        "src/mcp-server.js"
      ]
    }
  }
}
```
3. This file has already been created for you!

## Step 4: Reload VS Code
1. Press `Ctrl+Shift+P`
2. Type "Developer: Reload Window" and select it
3. Wait for VS Code to reload

## Step 5: Check MCP Server Status
1. Open the IBM Bob sidebar in VS Code
2. Click on "MCP Servers" button at the top
3. Look for "threadkeeper" in the list of servers
4. It should show as "Connected" with a green indicator

**If you don't see it:**
- Reload VS Code window (Ctrl+Shift+P > "Developer: Reload Window")
- Check the Output panel (View > Output) and select "IBM Bob" from the dropdown

## Step 6: Test with IBM Bob
Ask me (IBM Bob) one of these test questions:

**Test Question 1:**
"Can you read my thread context? Use the get_thread_summary tool."

**Test Question 2:**
"What's in my current thread state? Read the thread://current resource."

**Test Question 3:**
"Show me my recent git changes using the get_git_diff tool."

## What Should Happen:
- I (IBM Bob) should be able to call the MCP tools
- I should see your captured state from thread.json
- I should be able to tell you about your git diff, terminal history, and recent files

## Troubleshooting:

### If I can't see the MCP server:
1. Check VS Code Output panel for errors
2. Verify the paths in settings.json are correct (use absolute paths)
3. Make sure Node.js is in your PATH: `node --version`
4. Try reloading VS Code again

### If thread.json is empty or missing:
1. Run `tk save` again
2. Check that you're in the ThreadKeeper directory
3. Verify data/thread.json exists: `Test-Path data/thread.json`

### If MCP server crashes:
1. Check the Output panel for error messages
2. Test the server manually: `npm run mcp`
3. Check that all dependencies are installed: `npm install`

## Ready to Test?
Once you've completed steps 1-5, ask me to read your thread context and I'll verify the MCP connection is working!