#!/usr/bin/env node

const { Command } = require('commander');
const { captureState } = require('./capture');
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

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

// Made with Bob
