#!/usr/bin/env node

const { Command } = require('commander');
const {
  captureState,
  loadSnapshotIndex,
  saveSnapshotIndex,
  formatTimestampForPath,
  parseTimestampFromPath
} = require('./capture');
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
  .command('resume')
  .description('Display the Resumption Manifest to get back into context')
  .action(async () => {
    try {
      const threadPath = path.join(process.cwd(), 'data', 'thread.json');
      const data = await fs.readFile(threadPath, 'utf-8');
      const thread = JSON.parse(data);
      
      console.log('\n=== RESUMPTION MANIFEST ===\n');
      console.log(`📅 Captured: ${new Date(thread.timestamp).toLocaleString()}`);
      if (thread.note) {
        console.log(`📝 Note: ${thread.note}`);
      }
      console.log('');
      
      // Display the 4 key fields
      console.log('🎯 OBJECTIVE:');
      console.log('   What you were working on when you paused');
      console.log('');
      
      console.log('❌ LAST ERROR:');
      console.log('   Most recent blocker or error encountered');
      console.log('');
      
      console.log('🚫 DEAD ENDS:');
      console.log('   Approaches that didn\'t work');
      console.log('');
      
      console.log('➡️  NEXT STEP:');
      console.log('   Concrete action to take next');
      console.log('');
      
      // Show context summary
      console.log('📊 CONTEXT SUMMARY:');
      console.log(`   - Git changes: ${thread.gitDiff ? thread.gitDiff.length : 0} characters`);
      console.log(`   - Terminal commands: ${thread.terminalLog ? thread.terminalLog.length : 0} entries`);
      console.log(`   - Recent files: ${thread.openFiles ? thread.openFiles.length : 0} modified`);
      console.log('');
      
      if (thread.openFiles && thread.openFiles.length > 0) {
        console.log('📁 RECENTLY MODIFIED FILES:');
        thread.openFiles.slice(0, 5).forEach(file => {
          console.log(`   - ${file.relativePath}`);
        });
        if (thread.openFiles.length > 5) {
          console.log(`   ... and ${thread.openFiles.length - 5} more`);
        }
        console.log('');
      }
      
      if (thread.terminalLog && thread.terminalLog.length > 0) {
        console.log('💻 RECENT TERMINAL COMMANDS:');
        thread.terminalLog.slice(-5).forEach(cmd => {
          console.log(`   $ ${cmd}`);
        });
        console.log('');
      }
      
      // Create manifest object with the 4 key fields
      const manifest = {
        objective: 'What you were working on when you paused',
        lastError: 'Most recent blocker or error encountered',
        deadEnds: 'Approaches that didn\'t work',
        nextStep: 'Concrete action to take next'
      };
      
      // Save manifest to data/manifest.json
      const manifestPath = path.join(process.cwd(), 'data', 'manifest.json');
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
      console.log(`💾 Manifest saved to: ${manifestPath}`);
      console.log('');
      
      process.exit(0);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.error('No thread data found. Run "tk save" first to capture state.');
      } else {
        console.error('Error reading thread data:', error.message);
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
      
      console.log('\n=== HANDOVER NOTE (Copy to Slack) ===\n');
      console.log('---');
      console.log('');
      
      console.log('👋 *Handing off work*');
      console.log('');
      
      console.log(`📅 *Last worked:* ${new Date(thread.timestamp).toLocaleString()}`);
      if (thread.note) {
        console.log(`📝 *Note:* ${thread.note}`);
      }
      console.log('');
      
      console.log('🎯 *What I was working on:*');
      console.log('   [Context from git diff and recent activity]');
      console.log('');
      
      console.log('🚧 *Current blocker:*');
      console.log('   [Most recent error or issue]');
      console.log('');
      
      console.log('➡️  *Next steps:*');
      console.log('   [Concrete actions to take]');
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
          console.log(cmd);
        });
        console.log('```');
        console.log('');
      }
      
      console.log('---');
      console.log('');
      
      process.exit(0);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.error('No thread data found. Run "tk save" first to capture state.');
      } else {
        console.error('Error reading thread data:', error.message);
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
        console.log(`  📊 ${snapshot.filesModified} files, ${snapshot.nodesCount} nodes, ${snapshot.edgesCount} edges`);
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
      console.log(`  Nodes: ${snapshot1.nodesCount}`);
      console.log(`  Edges: ${snapshot1.edgesCount}`);
      
      console.log(`\nSnapshot 2: ${new Date(timestamp2).toLocaleString()}`);
      if (snapshot2.note) console.log(`Note: ${snapshot2.note}`);
      console.log(`  Files: ${snapshot2.filesModified}`);
      console.log(`  Nodes: ${snapshot2.nodesCount}`);
      console.log(`  Edges: ${snapshot2.edgesCount}`);
      
      console.log('\n📈 CHANGES:');
      const filesDiff = snapshot2.filesModified - snapshot1.filesModified;
      const nodesDiff = snapshot2.nodesCount - snapshot1.nodesCount;
      const edgesDiff = snapshot2.edgesCount - snapshot1.edgesCount;
      
      console.log(`  Files: ${filesDiff >= 0 ? '+' : ''}${filesDiff}`);
      console.log(`  Nodes: ${nodesDiff >= 0 ? '+' : ''}${nodesDiff}`);
      console.log(`  Edges: ${edgesDiff >= 0 ? '+' : ''}${edgesDiff}`);
      
      // Find new and removed nodes
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
