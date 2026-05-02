# 🧵 Threadkeeper - Simple Guide

## What is Threadkeeper?

Threadkeeper helps you remember what you were working on when you take a break. It's like taking a snapshot of your work so you can pick up right where you left off.

---

## 📊 Dashboard (http://127.0.0.1:8000)

### Main Cards at the Top

1. **🎯 Objective** - What you were trying to do
2. **⚠️ Last Error** - What problem you hit
3. **🚫 Dead Ends** - Things you tried that didn't work
4. **✅ Next Step** - What to do when you come back

### Recent Changes
Shows what code you changed (like a "before and after" view)

### Terminal Commands
Shows the last 20 commands you ran in your terminal

### Modified Files
Shows which files you edited recently

### ⏰ Saved Snapshots (NEW!)
- Shows all the times you saved your work
- Each snapshot shows:
  - **When** you saved it
  - **Your note** (like "heading to lunch")
  - **How many files** you changed
  - **How many code items** you have
  - **How many connections** between them
- Click **View** to see that snapshot
- Click **Restore** to go back to that point in time

### 🔍 Search Your Code (NEW!)
- Type anything to search your code
- Finds:
  - **Classes** - Blueprints for objects (like "Car" or "User")
  - **Functions** - Actions your code can do (like "saveFile" or "sendEmail")
  - **Packages** - External tools you're using (like "express" or "react")
- Shows:
  - Where it's located (which file)
  - What uses it
  - What it uses

### 🕸️ Code Map (NEW!)
- Visual map of your code
- **Blue circles** = Classes (blueprints)
- **Green circles** = Functions (actions)
- **Purple circles** = Packages (external tools)
- **Lines** = How they connect to each other
- You can:
  - **Drag** circles around
  - **Zoom** in/out with mouse wheel
  - **Hover** over circles to see details
  - **Filter** to show only certain types
  - **Search** for specific items

---

## 💻 Commands You Can Run

### Save Your Work
```bash
tk save --note "going to lunch"
```
Takes a snapshot of everything you're working on

### See All Your Snapshots
```bash
tk list
```
Shows all the times you saved your work

### Compare Two Snapshots
```bash
tk compare <time1> <time2>
```
Shows what changed between two saves

### Go Back in Time
```bash
tk restore <timestamp>
```
Brings back an old snapshot

### Clean Up Old Snapshots
```bash
tk clean --keep 10
```
Keeps only your last 10 snapshots, deletes older ones

---

## 🤖 What Bob Can Do

Bob (your AI assistant) can now search your code without reading every file:

- **"Find the saveFile function"** - Bob searches and finds it
- **"What calls the User class?"** - Bob shows what uses it
- **"What packages does this use?"** - Bob lists external tools
- **"Show me all the functions"** - Bob lists them all

This makes Bob much faster at helping you!

---

## 📖 Simple Explanations

### What are "Code Items"?
These are the building blocks of your code:
- **Classes** - Templates for creating things (like a "Car" template)
- **Functions** - Actions your code can do (like "start engine")
- **Packages** - Tools made by other people that you use

### What are "Connections"?
These show how your code pieces work together:
- "Function A calls Function B" = A uses B to do something
- "Class X extends Class Y" = X is based on Y
- "File imports Package Z" = File uses an external tool

### Why is this useful?
1. **Remember where you left off** - No more "what was I doing?"
2. **See your code structure** - Understand how everything connects
3. **Go back in time** - Undo mistakes by restoring old snapshots
4. **Help Bob help you** - Bob can navigate your code faster
5. **Track your progress** - See how your code evolved

---

## 🎯 Quick Start

1. **Make some changes** to your code
2. **Save a snapshot**: `tk save --note "added login feature"`
3. **Open dashboard**: http://127.0.0.1:8000
4. **See everything**:
   - Your snapshots in the timeline
   - Search for any code
   - Visual map of your code
5. **Take a break** knowing you can pick up exactly where you left off!

---

## 💡 Tips

- Save snapshots before taking breaks
- Use clear notes like "fixed bug" or "added feature"
- Use search to find code quickly
- Use the code map to understand how things connect
- Compare snapshots to see what changed
- Restore snapshots if you need to undo changes

---

## ❓ Common Questions

**Q: What's the difference between "Code Items" and "Connections"?**
A: Code items are the pieces (classes, functions). Connections are how they work together (who calls who).

**Q: Why do I need snapshots?**
A: So you can remember what you were doing and go back if needed.

**Q: What does Bob use this for?**
A: Bob can search your code structure without reading every file, making him much faster at helping you.

**Q: Can I delete old snapshots?**
A: Yes! Use `tk clean --keep 10` to keep only your last 10.

**Q: What if I want to go back to yesterday's code?**
A: Use `tk list` to find yesterday's snapshot, then `tk restore <timestamp>`.

---

## 🎉 You're All Set!

Refresh your dashboard at http://127.0.0.1:8000 to see:
- ⏰ Your saved snapshots
- 🔍 Code search
- 🕸️ Visual code map
Everything uses simple language now - no more confusing "nodes" and "edges"!