#!/usr/bin/env node

/**
 * ThreadKeeper Setup Verification Script
 * Run this to verify everything is working correctly
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

let passCount = 0;
let failCount = 0;
let warnCount = 0;

function pass(message) {
  console.log(`${GREEN}✓${RESET} ${message}`);
  passCount++;
}

function fail(message) {
  console.log(`${RED}✗${RESET} ${message}`);
  failCount++;
}

function warn(message) {
  console.log(`${YELLOW}⚠${RESET} ${message}`);
  warnCount++;
}

function info(message) {
  console.log(`${BLUE}ℹ${RESET} ${message}`);
}

function section(title) {
  console.log(`\n${BLUE}═══ ${title} ═══${RESET}\n`);
}

async function checkFile(filePath, description) {
  try {
    await fs.access(filePath);
    pass(`${description} exists`);
    return true;
  } catch {
    fail(`${description} not found: ${filePath}`);
    return false;
  }
}

async function checkDirectory(dirPath, description) {
  try {
    const stats = await fs.stat(dirPath);
    if (stats.isDirectory()) {
      pass(`${description} exists`);
      return true;
    } else {
      fail(`${description} is not a directory: ${dirPath}`);
      return false;
    }
  } catch {
    fail(`${description} not found: ${dirPath}`);
    return false;
  }
}

async function checkNodeModules() {
  const modulesToCheck = [
    '@modelcontextprotocol/sdk',
    'commander',
    'dotenv',
    'simple-git'
  ];

  for (const module of modulesToCheck) {
    const modulePath = path.join(process.cwd(), 'node_modules', module);
    try {
      await fs.access(modulePath);
      pass(`Dependency installed: ${module}`);
    } catch {
      fail(`Dependency missing: ${module}`);
    }
  }
}

async function checkCLI() {
  try {
    const { stdout } = await execAsync('node src/cli.js --version');
    pass('CLI executable works');
    return true;
  } catch (error) {
    fail('CLI not executable');
    return false;
  }
}

async function checkDataFiles() {
  const dataDir = path.join(process.cwd(), 'data');
  
  try {
    await fs.access(dataDir);
    pass('Data directory exists');
    
    // Check for current state files
    const files = ['thread.json', 'graph.json', 'manifest.json', 'handover.json'];
    for (const file of files) {
      const filePath = path.join(dataDir, file);
      try {
        await fs.access(filePath);
        pass(`Data file exists: ${file}`);
      } catch {
        warn(`Data file not found: ${file} (will be created on first save)`);
      }
    }
    
    // Check snapshots
    const snapshotsDir = path.join(dataDir, 'snapshots');
    try {
      await fs.access(snapshotsDir);
      pass('Snapshots directory exists');
      
      const indexPath = path.join(snapshotsDir, 'index.json');
      try {
        await fs.access(indexPath);
        const indexData = await fs.readFile(indexPath, 'utf-8');
        const index = JSON.parse(indexData);
        info(`Found ${index.snapshots.length} snapshot(s)`);
      } catch {
        warn('Snapshot index not found (will be created on first save)');
      }
    } catch {
      warn('Snapshots directory not found (will be created on first save)');
    }
  } catch {
    warn('Data directory not found (will be created on first save)');
  }
}

async function checkMCPConfig() {
  const mcpConfigPath = path.join(process.cwd(), '.bob', 'mcp.json');
  try {
    await fs.access(mcpConfigPath);
    pass('MCP configuration exists');
    
    const configData = await fs.readFile(mcpConfigPath, 'utf-8');
    const config = JSON.parse(configData);
    
    if (config.mcpServers && config.mcpServers.threadkeeper) {
      pass('ThreadKeeper MCP server configured');
      
      const serverPath = config.mcpServers.threadkeeper.args[0];
      try {
        await fs.access(serverPath);
        pass('MCP server file exists');
      } catch {
        fail(`MCP server file not found: ${serverPath}`);
      }
    } else {
      fail('ThreadKeeper not configured in MCP');
    }
  } catch {
    warn('MCP configuration not found (.bob/mcp.json)');
    info('This is optional - only needed for IBM Bob integration');
  }
}

async function checkGitRepo() {
  try {
    await fs.access(path.join(process.cwd(), '.git'));
    pass('Git repository initialized');
    return true;
  } catch {
    warn('Not a git repository (git features will be limited)');
    return false;
  }
}

async function checkDocumentation() {
  const docs = [
    'README.md',
    'JUDGES_QUICKSTART.md',
    'USAGE_GUIDE.md',
    'FEATURES_GUIDE.md',
    'SIMPLE_GUIDE.md',
    'MCP_SETUP.md'
  ];
  
  for (const doc of docs) {
    await checkFile(doc, `Documentation: ${doc}`);
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║          🧵 THREADKEEPER SETUP VERIFICATION 🧵                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Check core files
  section('Core Files');
  await checkFile('package.json', 'Package configuration');
  await checkFile('index.html', 'Dashboard HTML');
  await checkFile('src/cli.js', 'CLI script');
  await checkFile('src/capture.js', 'Capture module');
  await checkFile('src/analyzer.js', 'Analyzer module');
  await checkFile('src/mcp-server.js', 'MCP server');

  // Check dependencies
  section('Dependencies');
  await checkDirectory('node_modules', 'Node modules directory');
  await checkNodeModules();

  // Check CLI
  section('CLI Functionality');
  await checkCLI();

  // Check data directory
  section('Data Directory');
  await checkDataFiles();

  // Check MCP configuration
  section('MCP Integration');
  await checkMCPConfig();

  // Check git
  section('Git Integration');
  await checkGitRepo();

  // Check documentation
  section('Documentation');
  await checkDocumentation();

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                         SUMMARY                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log(`${GREEN}Passed:${RESET}  ${passCount}`);
  console.log(`${RED}Failed:${RESET}  ${failCount}`);
  console.log(`${YELLOW}Warnings:${RESET} ${warnCount}`);

  if (failCount === 0) {
    console.log(`\n${GREEN}✓ All critical checks passed!${RESET}`);
    console.log('\n📋 Next steps:');
    console.log('   1. Run: node src/cli.js save --note "test"');
    console.log('   2. Run: node src/cli.js resume');
    console.log('   3. Open: http://localhost:8000\n');
    process.exit(0);
  } else {
    console.log(`\n${RED}✗ Some checks failed. Please fix the issues above.${RESET}\n`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(`\n${RED}Error running verification:${RESET}`, error.message);
  process.exit(1);
});

// Made with Bob
