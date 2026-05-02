const fs = require('fs').promises;
const path = require('path');
const simpleGit = require('simple-git');
const os = require('os');
const { CodeAnalyzer } = require('./analyzer');

// Maximum number of snapshots to keep (auto-delete oldest)
const MAX_SNAPSHOTS = 50;

/**
 * Reads terminal history based on OS and shell
 * Returns last 20 lines as an array
 * @returns {Promise<Array<string>>} Last 20 terminal commands
 */
async function readTerminalHistory() {
  try {
    let historyPath;
    const platform = os.platform();
    
    if (platform === 'win32') {
      // Windows PowerShell history
      historyPath = path.join(
        os.homedir(),
        'AppData',
        'Roaming',
        'Microsoft',
        'Windows',
        'PowerShell',
        'PSReadLine',
        'ConsoleHost_history.txt'
      );
    } else {
      // Mac/Linux - try zsh first, then bash
      const zshHistory = path.join(os.homedir(), '.zsh_history');
      const bashHistory = path.join(os.homedir(), '.bash_history');
      
      try {
        await fs.access(zshHistory);
        historyPath = zshHistory;
      } catch {
        historyPath = bashHistory;
      }
    }
    
    const history = await fs.readFile(historyPath, 'utf-8');
    const lines = history.split('\n').filter(line => line.trim());
    
    // Return last 20 lines
    return lines.slice(-20);
  } catch (error) {
    console.warn('Could not read terminal history:', error.message);
    return [];
  }
}

/**
 * Gets the current git diff using simple-git
 * @returns {Promise<string>} Git diff output
 */
async function getGitDiff() {
  try {
    const git = simpleGit(process.cwd());
    const diff = await git.diff();
    return diff;
  } catch (error) {
    console.warn('Could not get git diff:', error.message);
    return '';
  }
}

/**
 * Recursively scans directory for files modified in the last 2 hours
 * Excludes node_modules, .git, and build folders
 * @param {string} dir - Directory to scan
 * @param {number} cutoffTime - Timestamp cutoff (2 hours ago)
 * @param {Array} fileList - Accumulator for file list
 * @returns {Promise<Array>} List of modified files with metadata
 */
async function scanRecentFiles(dir, cutoffTime, fileList = []) {
  const excludedDirs = ['node_modules', '.git', 'build'];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip excluded directories
        if (!excludedDirs.includes(entry.name)) {
          await scanRecentFiles(fullPath, cutoffTime, fileList);
        }
      } else {
        // Check file modification time
        const stats = await fs.stat(fullPath);
        if (stats.mtimeMs > cutoffTime) {
          fileList.push({
            path: fullPath,
            relativePath: path.relative(process.cwd(), fullPath),
            modified: stats.mtime.toISOString(),
            size: stats.size
          });
        }
      }
    }
  } catch (error) {
    console.warn(`Could not scan directory ${dir}:`, error.message);
  }
  
  return fileList;
}

/**
 * Formats timestamp for use in directory names (ISO 8601 compatible)
 * Replaces colons with hyphens for Windows compatibility
 * @param {Date} date - Date object to format
 * @returns {string} Formatted timestamp (e.g., "2026-05-01T21-30-00-000Z")
 */
function formatTimestampForPath(date) {
  return date.toISOString().replace(/:/g, '-');
}

/**
 * Parses a timestamp from a directory name back to ISO 8601
 * @param {string} dirName - Directory name with timestamp
 * @returns {string} ISO 8601 timestamp
 */
function parseTimestampFromPath(dirName) {
  return dirName.replace(/-/g, ':');
}

/**
 * Loads the snapshot index from data/snapshots/index.json
 * @returns {Promise<Object>} Index object with snapshots array
 */
async function loadSnapshotIndex() {
  const indexPath = path.join(process.cwd(), 'data', 'snapshots', 'index.json');
  try {
    const data = await fs.readFile(indexPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Return empty index if file doesn't exist
    return { snapshots: [] };
  }
}

/**
 * Saves the snapshot index to data/snapshots/index.json
 * @param {Object} index - Index object with snapshots array
 */
async function saveSnapshotIndex(index) {
  const snapshotsDir = path.join(process.cwd(), 'data', 'snapshots');
  await fs.mkdir(snapshotsDir, { recursive: true });
  
  const indexPath = path.join(snapshotsDir, 'index.json');
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');
}

/**
 * Deletes old snapshots to maintain the MAX_SNAPSHOTS limit
 * @param {Object} index - Current snapshot index
 */
async function cleanupOldSnapshots(index) {
  if (index.snapshots.length <= MAX_SNAPSHOTS) {
    return;
  }
  
  // Sort by timestamp (oldest first)
  const sorted = [...index.snapshots].sort((a, b) =>
    new Date(a.timestamp) - new Date(b.timestamp)
  );
  
  // Calculate how many to delete
  const toDelete = sorted.slice(0, sorted.length - MAX_SNAPSHOTS);
  
  console.log(`Cleaning up ${toDelete.length} old snapshot(s)...`);
  
  for (const snapshot of toDelete) {
    const snapshotDir = path.join(
      process.cwd(),
      'data',
      'snapshots',
      formatTimestampForPath(new Date(snapshot.timestamp))
    );
    
    try {
      await fs.rm(snapshotDir, { recursive: true, force: true });
      console.log(`  Deleted: ${snapshot.timestamp}`);
    } catch (error) {
      console.warn(`  Could not delete ${snapshot.timestamp}:`, error.message);
    }
  }
  
  // Update index to remove deleted snapshots
  index.snapshots = index.snapshots.filter(s =>
    !toDelete.some(d => d.timestamp === s.timestamp)
  );
}

/**
 * Captures the current development state
 * @param {string} note - Optional note to include with the capture
 * @returns {Promise<Object>} State object with all captured data
 */
async function captureState(note = '') {
  console.log('Capturing development state...');
  
  // Calculate cutoff time (2 hours ago)
  const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
  
  // Gather all data in parallel for efficiency
  const [terminalLog, gitDiff, recentFiles] = await Promise.all([
    readTerminalHistory(),
    getGitDiff(),
    scanRecentFiles(process.cwd(), twoHoursAgo)
  ]);
  
  // Analyze codebase structure
  console.log('Analyzing codebase structure...');
  const analyzer = new CodeAnalyzer();
  const codeGraph = await analyzer.analyzeDirectory(process.cwd(), {
    maxDepth: 5,
    excludeDirs: ['node_modules', '.git', 'dist', 'build', '__pycache__', 'data']
  });
  
  // Sort files by most recently modified
  const sortedFiles = recentFiles.sort((a, b) =>
    new Date(b.modified) - new Date(a.modified)
  );
  
  // Truncate gitDiff to 3000 characters max
  const truncatedGitDiff = gitDiff.length > 3000
    ? gitDiff.substring(0, 3000) + '\n... (truncated)'
    : gitDiff;
  
  // Create state object with timestamp
  const timestamp = new Date();
  const state = {
    timestamp: timestamp.toISOString(),
    note: note,
    gitDiff: truncatedGitDiff,
    terminalLog: terminalLog,
    openFiles: sortedFiles
  };
  
  // Ensure data directory exists
  const dataDir = path.join(process.cwd(), 'data');
  await fs.mkdir(dataDir, { recursive: true });
  
  // Create snapshot directory with timestamp
  const timestampStr = formatTimestampForPath(timestamp);
  const snapshotDir = path.join(dataDir, 'snapshots', timestampStr);
  await fs.mkdir(snapshotDir, { recursive: true });
  
  // Save snapshot files
  const snapshotThreadPath = path.join(snapshotDir, 'thread.json');
  const snapshotGraphPath = path.join(snapshotDir, 'graph.json');
  await fs.writeFile(snapshotThreadPath, JSON.stringify(state, null, 2), 'utf-8');
  await fs.writeFile(snapshotGraphPath, JSON.stringify(codeGraph, null, 2), 'utf-8');
  
  // Update snapshot index
  const index = await loadSnapshotIndex();
  index.snapshots.push({
    timestamp: state.timestamp,
    note: note,
    filesModified: sortedFiles.length,
    nodesCount: codeGraph.nodes.length,
    edgesCount: codeGraph.edges.length
  });
  
  // Clean up old snapshots if needed
  await cleanupOldSnapshots(index);
  
  // Save updated index
  await saveSnapshotIndex(index);
  
  // Maintain backward compatibility: copy to data/thread.json and data/graph.json
  const outputPath = path.join(dataDir, 'thread.json');
  const graphPath = path.join(dataDir, 'graph.json');
  await fs.writeFile(outputPath, JSON.stringify(state, null, 2), 'utf-8');
  await fs.writeFile(graphPath, JSON.stringify(codeGraph, null, 2), 'utf-8');
  
  console.log(`State captured successfully!`);
  console.log(`- Files modified in last 2 hours: ${sortedFiles.length}`);
  console.log(`- Git diff size: ${gitDiff.length} characters`);
  console.log(`- Terminal history: ${terminalLog.length} commands`);
  console.log(`- Code graph: ${codeGraph.nodes.length} code items, ${codeGraph.edges.length} connections`);
  console.log(`- Snapshot saved to: ${snapshotDir}`);
  console.log(`- Current state: ${outputPath}`);
  console.log(`- Total snapshots: ${index.snapshots.length}`);
  
  return state;
}

module.exports = {
  readTerminalHistory,
  getGitDiff,
  scanRecentFiles,
  captureState,
  loadSnapshotIndex,
  saveSnapshotIndex,
  formatTimestampForPath,
  parseTimestampFromPath
};

// Made with Bob
