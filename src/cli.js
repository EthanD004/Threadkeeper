#!/usr/bin/env node

const { Command } = require('commander');
const { exec } = require('child_process');
const { promisify } = require('util');
const {
  captureState,
  loadSnapshotIndex,
  saveSnapshotIndex,
  formatTimestampForPath,
  parseTimestampFromPath
} = require('./capture');

const execAsync = promisify(exec);
const fs = require('fs').promises;
const path = require('path');

const program = new Command();

program
  .name('tk')
  .description('ThreadKeeper - Capture your development context for IBM Bob')
  .version('1.0.0');

program
  .command('save')
  .description('Capture current development state (git diff, terminal history, recent files)')
  .option('-n, --note <note>', 'Add a note to this capture')
  .action(async (options) => {
    try {
      const note = options.note || '';
      await captureState(note);
      process.exit(0);
    } catch (error) {
      console.error('Error capturing state:', error.message);
      process.exit(1);
    }
  });

program
  .command('help')
  .description('Show comprehensive usage guide and available commands')
  .action(async () => {
    try {
      console.log('\n╔════════════════════════════════════════════════════════════════╗');
      console.log('║                    📚 THREADKEEPER GUIDE 📚                    ║');
      console.log('╚════════════════════════════════════════════════════════════════╝\n');
      
      console.log('🔧 AVAILABLE COMMANDS:\n');
      
      console.log('  tk save [--note "message"]');
      console.log('    💾 Capture current development state');
      console.log('    📸 Saves: git diff, terminal history, modified files, code graph');
      console.log('    Example: tk save --note "before refactoring auth"\n');
      
      console.log('  tk resume');
      console.log('    🔄 Display resumption manifest and open dashboard');
      console.log('    🌐 Auto-starts server and opens browser');
      console.log('    📊 Shows: objective, errors, dead ends, next steps\n');
      
      console.log('  tk handover');
      console.log('    👋 Generate Slack-ready handover note');
      console.log('    📋 Copy and paste to share context with teammates');
      console.log('    💬 Includes: work context, blockers, next steps\n');
      
      console.log('  tk list');
      console.log('    📜 List all saved snapshots with timestamps');
      console.log('    🕐 Shows: date, note, file count, code metrics\n');
      
      console.log('  tk restore <timestamp>');
      console.log('    ⏮️  Restore a previous snapshot');
      console.log('    🔙 Replaces current state with selected snapshot');
      console.log('    Example: tk restore 2026-05-02T18-00-00-000Z\n');
      
      console.log('  tk compare <timestamp1> <timestamp2>');
      console.log('    🔍 Compare two snapshots');
      console.log('    📈 Shows: changes in files, code items, connections\n');
      
      console.log('  tk clean [--keep <n>]');
      console.log('    🧹 Clean up old snapshots');
      console.log('    💾 Keeps most recent N snapshots (default: 10)');
      console.log('    Example: tk clean --keep 20\n');
      
      console.log('  tk install-hooks');
      console.log('    🪝 Install git hooks for auto-capture');
      console.log('    ⚡ Automatically saves state after each commit\n');
      
      console.log('🎨 DASHBOARD FEATURES:\n');
      
      console.log('  📊 Resumption Cards');
      console.log('    • Objective: What you were working on');
      console.log('    • Next Step: Concrete action to take');
      console.log('    • Dead Ends: Approaches that didn\'t work');
      console.log('    • Last Error: Recent blockers or issues\n');
      
      console.log('  🔍 Code Graph Visualization');
      console.log('    • Interactive D3.js graph of your codebase');
      console.log('    • Filter by: type, language, search term');
      console.log('    • Zoom, pan, and drag nodes');
      console.log('    • Hover for details on classes, functions, dependencies\n');
      
      console.log('  📝 Development Context');
      console.log('    • Git Diff: See your uncommitted changes');
      console.log('    • Terminal History: Last 20 commands');
      console.log('    • Modified Files: Files changed in last 2 hours\n');
      
      console.log('  🕐 Snapshot Timeline');
      console.log('    • View all saved snapshots chronologically');
      console.log('    • Restore previous states');
      console.log('    • Track development progress\n');
      
      console.log('  🔎 Code Search');
      console.log('    • Search classes, functions, and files');
      console.log('    • See usage relationships');
      console.log('    • Find dependencies quickly\n');
      
      console.log('  💬 Slack Handover');
      console.log('    • Pre-formatted handover note');
      console.log('    • Copy to clipboard');
      console.log('    • Share context with teammates\n');
      
      console.log('💡 TIPS:\n');
      
      console.log('  • Run "tk save" before taking breaks or switching tasks');
      console.log('  • Use "tk resume" when returning to work');
      console.log('  • Add notes to captures for better context');
      console.log('  • Install git hooks for automatic state capture');
      console.log('  • Use the dashboard to visualize your codebase structure');
      console.log('  • Generate handover notes when passing work to teammates\n');
      
      console.log('🔗 INTEGRATION WITH IBM BOB:\n');
      
      console.log('  ThreadKeeper is connected to IBM Bob via MCP (Model Context Protocol)');
      console.log('  Bob can access your development state and help you:');
      console.log('    • Understand what you were working on');
      console.log('    • Analyze code relationships');
      console.log('    • Generate resumption manifests');
      console.log('    • Create handover notes');
      console.log('    • Query your code graph\n');
      
      console.log('📖 For more information, see:');
      console.log('   - README.md: Project overview');
      console.log('   - USAGE_GUIDE.md: Detailed usage guide');
      console.log('   - FEATURES_GUIDE.md: Feature documentation');
      console.log('   - SIMPLE_GUIDE.md: Quick start guide\n');
      
      console.log('═══════════════════════════════════════════════════════════════════\n');
      
      process.exit(0);
    } catch (error) {
      console.error('\n❌ Error displaying help:', error.message, '\n');
      process.exit(1);
    }
  });

program
  .command('resume')
  .description('Display the Resumption Manifest and open the dashboard')
  .action(async () => {
    try {
      const threadPath = path.join(process.cwd(), 'data', 'thread.json');
      const data = await fs.readFile(threadPath, 'utf-8');
      const thread = JSON.parse(data);
      
      console.log('\n╔════════════════════════════════════════════════════════════════╗');
      console.log('║           🧵 THREADKEEPER - RESUMPTION MANIFEST 🧵            ║');
      console.log('╚════════════════════════════════════════════════════════════════╝\n');
      
      console.log(`📅 Captured: ${new Date(thread.timestamp).toLocaleString()}`);
      if (thread.note) {
        console.log(`📝 Note: ${thread.note}`);
      }
      console.log('');
      
      // Analyze thread data to generate manifest
      console.log('🔍 Analyzing your development context...\n');
      
      // Generate objective from git diff and files
      let objective = 'Resuming development work';
      if (thread.gitDiff && thread.gitDiff.length > 0) {
        const diffLines = thread.gitDiff.split('\n');
        const modifiedFiles = diffLines.filter(l => l.startsWith('diff --git')).length;
        if (modifiedFiles > 0) {
          objective = `Working on changes across ${modifiedFiles} file${modifiedFiles > 1 ? 's' : ''}`;
          // Try to extract file names
          const fileMatches = thread.gitDiff.match(/diff --git a\/(.*?) b\//g);
          if (fileMatches && fileMatches.length > 0) {
            const files = fileMatches.map(m => m.match(/a\/(.*?) b\//)[1]).slice(0, 3);
            objective += `: ${files.join(', ')}`;
          }
        }
      }
      
      // Generate last error from terminal history
      let lastError = 'No recent errors detected';
      if (thread.terminalLog && thread.terminalLog.length > 0) {
        const errorKeywords = ['error', 'failed', 'exception', 'fatal', 'cannot', 'unable'];
        const recentCommands = thread.terminalLog.slice(-10);
        for (let i = recentCommands.length - 1; i >= 0; i--) {
          const cmd = recentCommands[i].toLowerCase();
          if (errorKeywords.some(kw => cmd.includes(kw))) {
            lastError = `Recent command issue: ${recentCommands[i].substring(0, 100)}`;
            break;
          }
        }
      }
      
      // Generate dead ends from git diff patterns
      let deadEnds = 'No abandoned approaches detected';
      if (thread.gitDiff && thread.gitDiff.includes('//') && thread.gitDiff.includes('TODO')) {
        deadEnds = 'Found commented code and TODO markers in changes - may indicate exploratory work';
      }
      
      // Generate next step
      let nextStep = 'Review the dashboard for detailed context and continue development';
      if (thread.openFiles && thread.openFiles.length > 0) {
        const mostRecent = thread.openFiles[0];
        nextStep = `Continue working on ${mostRecent.relativePath} (last modified: ${new Date(mostRecent.modified).toLocaleString()})`;
      }
      
      // Create manifest with analyzed data
      const manifest = {
        objective,
        lastError,
        deadEnds,
        nextStep,
        timestamp: thread.timestamp,
        filesModified: thread.openFiles ? thread.openFiles.length : 0
      };
      
      // Display the 4 key fields
      console.log('🎯 OBJECTIVE:');
      console.log(`   ${manifest.objective}`);
      console.log('');
      
      console.log('❌ LAST ERROR:');
      console.log(`   ${manifest.lastError}`);
      console.log('');
      
      console.log('🚫 DEAD ENDS:');
      console.log(`   ${manifest.deadEnds}`);
      console.log('');
      
      console.log('➡️  NEXT STEP:');
      console.log(`   ${manifest.nextStep}`);
      console.log('');
      
      // Save manifest to data/manifest.json
      const manifestPath = path.join(process.cwd(), 'data', 'manifest.json');
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
      
      // Create handover.json for Slack notes
      const handoverPath = path.join(process.cwd(), 'data', 'handover.json');
      const handoverData = {
        username: process.env.USER || process.env.USERNAME || 'Developer',
        timestamp: new Date().toISOString(),
        message: `👋 Handing off work\n\n🎯 Working on: ${manifest.objective}\n\n🚧 Current blocker: ${manifest.lastError}\n\n➡️ Next steps: ${manifest.nextStep}\n\n📁 Key files: ${thread.openFiles ? thread.openFiles.slice(0, 3).map(f => f.relativePath).join(', ') : 'None'}`
      };
      await fs.writeFile(handoverPath, JSON.stringify(handoverData, null, 2), 'utf-8');
      
      // Start HTTP server
      console.log('🚀 Starting dashboard server...');
      const serverPort = 8000;
      const dashboardUrl = `http://127.0.0.1:${serverPort}`;
      
      try {
        const { spawn } = require('child_process');
        const platform = process.platform;
        
        // Use appropriate command for Windows vs Unix
        let serverProcess;
        if (platform === 'win32') {
          serverProcess = spawn('cmd', ['/c', 'npx', 'http-server', '-p', serverPort.toString(), '-c-1', '--silent'], {
            cwd: process.cwd(),
            detached: true,
            stdio: 'ignore',
            shell: true
          });
        } else {
          serverProcess = spawn('npx', ['http-server', '-p', serverPort.toString(), '-c-1', '--silent'], {
            cwd: process.cwd(),
            detached: true,
            stdio: 'ignore'
          });
        }
        
        serverProcess.unref();
        
        // Wait a moment for server to start
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log(`✅ Server started at ${dashboardUrl}`);
        console.log('');
        
        // Auto-open dashboard in browser
        console.log('🌐 Opening dashboard in browser...');
        
        let command;
        if (platform === 'win32') {
          command = `start ${dashboardUrl}`;
        } else if (platform === 'darwin') {
          command = `open ${dashboardUrl}`;
        } else {
          command = `xdg-open ${dashboardUrl}`;
        }
        
        await execAsync(command);
        console.log(`✅ Dashboard opened at ${dashboardUrl}`);
        console.log('');
        console.log('💡 Tip: Run "tk help" to see all available commands\n');
        
      } catch (error) {
        console.log(`⚠️  Could not start server automatically: ${error.message}`);
        console.log(`   Please manually run: npx http-server -p ${serverPort}`);
        console.log(`   Then open: ${dashboardUrl}`);
        console.log('');
      }
      
      process.exit(0);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.error('\n❌ No thread data found. Run "tk save" first to capture state.\n');
      } else {
        console.error('\n❌ Error reading thread data:', error.message, '\n');
      }
      process.exit(1);
    }
  });

program
  .command('handover')
  .description('Generate a Slack-ready handover note for your teammate')
  .action(async () => {
    try {
      const threadPath = path.join(process.cwd(), 'data', 'thread.json');
      const data = await fs.readFile(threadPath, 'utf-8');
      const thread = JSON.parse(data);
      
      // Analyze thread data to generate handover content
      let workContext = 'Development work in progress';
      if (thread.gitDiff && thread.gitDiff.length > 0) {
        const diffLines = thread.gitDiff.split('\n');
        const modifiedFiles = diffLines.filter(l => l.startsWith('diff --git')).length;
        if (modifiedFiles > 0) {
          workContext = `Working on changes across ${modifiedFiles} file${modifiedFiles > 1 ? 's' : ''}`;
          const fileMatches = thread.gitDiff.match(/diff --git a\/(.*?) b\//g);
          if (fileMatches && fileMatches.length > 0) {
            const files = fileMatches.map(m => m.match(/a\/(.*?) b\//)[1]).slice(0, 3);
            workContext += `: ${files.join(', ')}`;
          }
        }
      }
      
      let currentBlocker = 'No blockers - work progressing smoothly';
      if (thread.terminalLog && thread.terminalLog.length > 0) {
        const errorKeywords = ['error', 'failed', 'exception', 'fatal', 'cannot', 'unable'];
        const recentCommands = thread.terminalLog.slice(-10);
        for (let i = recentCommands.length - 1; i >= 0; i--) {
          const cmd = recentCommands[i].toLowerCase();
          if (errorKeywords.some(kw => cmd.includes(kw))) {
            currentBlocker = `Hit an issue with: ${recentCommands[i].substring(0, 80)}`;
            break;
          }
        }
      }
      
      let nextSteps = 'Continue development work';
      if (thread.openFiles && thread.openFiles.length > 0) {
        const mostRecent = thread.openFiles[0];
        nextSteps = `Continue working on ${mostRecent.relativePath}`;
      }
      
      console.log('\n╔════════════════════════════════════════════════════════════════╗');
      console.log('║              📋 SLACK HANDOVER NOTE 📋                        ║');
      console.log('╚════════════════════════════════════════════════════════════════╝\n');
      console.log('Copy the text below and paste into Slack:\n');
      console.log('─────────────────────────────────────────────────────────────────\n');
      
      console.log('👋 *Handing off work*\n');
      
      console.log(`📅 *Last worked:* ${new Date(thread.timestamp).toLocaleString()}`);
      if (thread.note) {
        console.log(`📝 *Note:* ${thread.note}`);
      }
      console.log('');
      
      console.log('🎯 *What I was working on:*');
      console.log(`   ${workContext}`);
      console.log('');
      
      console.log('🚧 *Current blocker:*');
      console.log(`   ${currentBlocker}`);
      console.log('');
      
      console.log('➡️  *Next steps:*');
      console.log(`   ${nextSteps}`);
      console.log('');
      
      if (thread.openFiles && thread.openFiles.length > 0) {
        console.log('📁 *Key files to look at:*');
        thread.openFiles.slice(0, 5).forEach(file => {
          console.log(`   • \`${file.relativePath}\``);
        });
        console.log('');
      }
      
      if (thread.terminalLog && thread.terminalLog.length > 0) {
        console.log('💻 *Recent commands:*');
        console.log('```');
        thread.terminalLog.slice(-5).forEach(cmd => {
          console.log(cmd.replace(/\r?\n/g, ''));
        });
        console.log('```');
        console.log('');
      }
      
      console.log('─────────────────────────────────────────────────────────────────\n');
      
      // Save to handover.json for dashboard
      const handoverPath = path.join(process.cwd(), 'data', 'handover.json');
      const handoverData = {
        username: process.env.USER || process.env.USERNAME || 'Developer',
        timestamp: thread.timestamp,
        message: `👋 Handing off work\n\n🎯 Working on: ${workContext}\n\n🚧 Current blocker: ${currentBlocker}\n\n➡️ Next steps: ${nextSteps}\n\n📁 Key files: ${thread.openFiles ? thread.openFiles.slice(0, 3).map(f => f.relativePath).join(', ') : 'None'}`
      };
      await fs.writeFile(handoverPath, JSON.stringify(handoverData, null, 2), 'utf-8');
      
      console.log(`💾 Handover note saved to: ${handoverPath}`);
      console.log('📊 View in dashboard at: http://127.0.0.1:8000\n');
      
      process.exit(0);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.error('\n❌ No thread data found. Run "tk save" first to capture state.\n');
      } else {
        console.error('\n❌ Error reading thread data:', error.message, '\n');
      }
      process.exit(1);
    }
  });

program
  .command('install-hooks')
  .description('Install git hooks for automatic state capture')
  .action(async () => {
    try {
      const hooksDir = path.join(process.cwd(), '.git', 'hooks');
      const postCommitPath = path.join(hooksDir, 'post-commit');
      
      // Check if .git directory exists
      try {
        await fs.access(path.join(process.cwd(), '.git'));
      } catch {
        console.error('Error: Not a git repository. Initialize git first with "git init"');
        process.exit(1);
      }
      
      // Create hooks directory if it doesn't exist
      await fs.mkdir(hooksDir, { recursive: true });
      
      // Create post-commit hook
      const hookContent = `#!/bin/sh
# ThreadKeeper auto-save hook
tk save "auto git commit"
`;
      
      await fs.writeFile(postCommitPath, hookContent, { mode: 0o755 });
      
      console.log('✅ Git hooks installed successfully!');
      console.log(`   Post-commit hook created at: ${postCommitPath}`);
      console.log('   ThreadKeeper will now auto-save after each commit.');
      
      process.exit(0);
    } catch (error) {
      console.error('Error installing hooks:', error.message);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all available snapshots with timestamps and notes')
  .action(async () => {
    try {
      const index = await loadSnapshotIndex();
      
      if (index.snapshots.length === 0) {
        console.log('No snapshots found. Run "tk save" to create your first snapshot.');
        process.exit(0);
      }
      
      console.log('\n=== SNAPSHOT HISTORY ===\n');
      console.log(`Total snapshots: ${index.snapshots.length}\n`);
      
      // Sort by timestamp (newest first)
      const sorted = [...index.snapshots].sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      sorted.forEach((snapshot, index) => {
        const date = new Date(snapshot.timestamp);
        const isLatest = index === 0;
        
        console.log(`${isLatest ? '→ ' : '  '}${snapshot.timestamp}`);
        console.log(`  📅 ${date.toLocaleString()}`);
        if (snapshot.note) {
          console.log(`  📝 ${snapshot.note}`);
        }
        console.log(`  📊 ${snapshot.filesModified} files, ${snapshot.nodesCount} code items, ${snapshot.edgesCount} connections`);
        if (isLatest) {
          console.log('  ⭐ LATEST');
        }
        console.log('');
      });
      
      process.exit(0);
    } catch (error) {
      console.error('Error listing snapshots:', error.message);
      process.exit(1);
    }
  });

program
  .command('restore <timestamp>')
  .description('Restore a specific snapshot to current state')
  .action(async (timestamp) => {
    try {
      const index = await loadSnapshotIndex();
      
      // Find the snapshot
      const snapshot = index.snapshots.find(s => s.timestamp === timestamp);
      if (!snapshot) {
        console.error(`Snapshot not found: ${timestamp}`);
        console.log('\nAvailable snapshots:');
        index.snapshots.forEach(s => console.log(`  - ${s.timestamp}`));
        process.exit(1);
      }
      
      console.log(`\nRestoring snapshot from ${new Date(timestamp).toLocaleString()}...`);
      
      // Build snapshot directory path
      const snapshotDir = path.join(
        process.cwd(),
        'data',
        'snapshots',
        formatTimestampForPath(new Date(timestamp))
      );
      
      // Check if snapshot files exist
      const snapshotThreadPath = path.join(snapshotDir, 'thread.json');
      const snapshotGraphPath = path.join(snapshotDir, 'graph.json');
      
      try {
        await fs.access(snapshotThreadPath);
        await fs.access(snapshotGraphPath);
      } catch {
        console.error(`Error: Snapshot files not found in ${snapshotDir}`);
        process.exit(1);
      }
      
      // Read snapshot data
      const threadData = await fs.readFile(snapshotThreadPath, 'utf-8');
      const graphData = await fs.readFile(snapshotGraphPath, 'utf-8');
      
      // Write to current state files
      const dataDir = path.join(process.cwd(), 'data');
      const currentThreadPath = path.join(dataDir, 'thread.json');
      const currentGraphPath = path.join(dataDir, 'graph.json');
      
      await fs.writeFile(currentThreadPath, threadData, 'utf-8');
      await fs.writeFile(currentGraphPath, graphData, 'utf-8');
      
      console.log('✅ Snapshot restored successfully!');
      console.log(`  - ${currentThreadPath}`);
      console.log(`  - ${currentGraphPath}`);
      if (snapshot.note) {
        console.log(`  📝 Note: ${snapshot.note}`);
      }
      console.log('');
      
      process.exit(0);
    } catch (error) {
      console.error('Error restoring snapshot:', error.message);
      process.exit(1);
    }
  });

program
  .command('compare <timestamp1> <timestamp2>')
  .description('Show differences between two snapshots')
  .action(async (timestamp1, timestamp2) => {
    try {
      const index = await loadSnapshotIndex();
      
      // Find both snapshots
      const snapshot1 = index.snapshots.find(s => s.timestamp === timestamp1);
      const snapshot2 = index.snapshots.find(s => s.timestamp === timestamp2);
      
      if (!snapshot1) {
        console.error(`Snapshot not found: ${timestamp1}`);
        process.exit(1);
      }
      if (!snapshot2) {
        console.error(`Snapshot not found: ${timestamp2}`);
        process.exit(1);
      }
      
      console.log('\n=== SNAPSHOT COMPARISON ===\n');
      
      // Load both graph files to compare nodes
      const dir1 = path.join(process.cwd(), 'data', 'snapshots', formatTimestampForPath(new Date(timestamp1)));
      const dir2 = path.join(process.cwd(), 'data', 'snapshots', formatTimestampForPath(new Date(timestamp2)));
      
      const graph1Data = await fs.readFile(path.join(dir1, 'graph.json'), 'utf-8');
      const graph2Data = await fs.readFile(path.join(dir2, 'graph.json'), 'utf-8');
      
      const graph1 = JSON.parse(graph1Data);
      const graph2 = JSON.parse(graph2Data);
      
      // Compare basic stats
      console.log('📊 STATISTICS:');
      console.log(`\nSnapshot 1: ${new Date(timestamp1).toLocaleString()}`);
      if (snapshot1.note) console.log(`Note: ${snapshot1.note}`);
      console.log(`  Files: ${snapshot1.filesModified}`);
      console.log(`  Code Items: ${snapshot1.nodesCount}`);
      console.log(`  Connections: ${snapshot1.edgesCount}`);
      
      console.log(`\nSnapshot 2: ${new Date(timestamp2).toLocaleString()}`);
      if (snapshot2.note) console.log(`Note: ${snapshot2.note}`);
      console.log(`  Files: ${snapshot2.filesModified}`);
      console.log(`  Code Items: ${snapshot2.nodesCount}`);
      console.log(`  Connections: ${snapshot2.edgesCount}`);
      
      console.log('\n📈 CHANGES:');
      const filesDiff = snapshot2.filesModified - snapshot1.filesModified;
      const nodesDiff = snapshot2.nodesCount - snapshot1.nodesCount;
      const edgesDiff = snapshot2.edgesCount - snapshot1.edgesCount;
      
      console.log(`  Files: ${filesDiff >= 0 ? '+' : ''}${filesDiff}`);
      console.log(`  Code Items: ${nodesDiff >= 0 ? '+' : ''}${nodesDiff}`);
      console.log(`  Connections: ${edgesDiff >= 0 ? '+' : ''}${edgesDiff}`);

      // Find new and removed code items
      const nodes1Set = new Set(graph1.nodes.map(n => n.id));
      const nodes2Set = new Set(graph2.nodes.map(n => n.id));
      
      const newNodes = graph2.nodes.filter(n => !nodes1Set.has(n.id));
      const removedNodes = graph1.nodes.filter(n => !nodes2Set.has(n.id));
      
      if (newNodes.length > 0) {
        console.log(`\n✅ NEW NODES (${newNodes.length}):`);
        newNodes.slice(0, 10).forEach(node => {
          console.log(`  + ${node.type}: ${node.name}`);
        });
        if (newNodes.length > 10) {
          console.log(`  ... and ${newNodes.length - 10} more`);
        }
      }
      
      if (removedNodes.length > 0) {
        console.log(`\n❌ REMOVED NODES (${removedNodes.length}):`);
        removedNodes.slice(0, 10).forEach(node => {
          console.log(`  - ${node.type}: ${node.name}`);
        });
        if (removedNodes.length > 10) {
          console.log(`  ... and ${removedNodes.length - 10} more`);
        }
      }
      
      if (newNodes.length === 0 && removedNodes.length === 0) {
        console.log('\n  No node changes detected');
      }
      
      console.log('');
      process.exit(0);
    } catch (error) {
      console.error('Error comparing snapshots:', error.message);
      process.exit(1);
    }
  });

program
  .command('clean')
  .description('Clean up old snapshots')
  .option('--keep <n>', 'Number of snapshots to keep', '10')
  .action(async (options) => {
    try {
      const keepCount = parseInt(options.keep, 10);
      
      if (isNaN(keepCount) || keepCount < 1) {
        console.error('Error: --keep must be a positive number');
        process.exit(1);
      }
      
      const index = await loadSnapshotIndex();
      
      if (index.snapshots.length <= keepCount) {
        console.log(`No cleanup needed. Current snapshots (${index.snapshots.length}) <= keep limit (${keepCount})`);
        process.exit(0);
      }
      
      console.log(`\nCleaning up snapshots (keeping ${keepCount} most recent)...`);
      
      // Sort by timestamp (oldest first)
      const sorted = [...index.snapshots].sort((a, b) =>
        new Date(a.timestamp) - new Date(b.timestamp)
      );
      
      // Calculate how many to delete
      const toDelete = sorted.slice(0, sorted.length - keepCount);
      
      console.log(`Deleting ${toDelete.length} old snapshot(s)...\n`);
      
      let deletedCount = 0;
      for (const snapshot of toDelete) {
        const snapshotDir = path.join(
          process.cwd(),
          'data',
          'snapshots',
          formatTimestampForPath(new Date(snapshot.timestamp))
        );
        
        try {
          await fs.rm(snapshotDir, { recursive: true, force: true });
          console.log(`  ✓ Deleted: ${new Date(snapshot.timestamp).toLocaleString()}`);
          deletedCount++;
        } catch (error) {
          console.warn(`  ✗ Could not delete ${snapshot.timestamp}:`, error.message);
        }
      }
      
      // Update index to remove deleted snapshots
      index.snapshots = index.snapshots.filter(s =>
        !toDelete.some(d => d.timestamp === s.timestamp)
      );
      
      await saveSnapshotIndex(index);
      
      console.log(`\n✅ Cleanup complete! Deleted ${deletedCount} snapshot(s).`);
      console.log(`   Remaining snapshots: ${index.snapshots.length}`);
      console.log('');
      
      process.exit(0);
    } catch (error) {
      console.error('Error cleaning snapshots:', error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

// Made with Bob
