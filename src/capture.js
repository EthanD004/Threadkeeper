const fs = require('fs').promises;
const path = require('path');
const simpleGit = require('simple-git');
const os = require('os');

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
  
  // Sort files by most recently modified
  const sortedFiles = recentFiles.sort((a, b) =>
    new Date(b.modified) - new Date(a.modified)
  );
  
  // Truncate gitDiff to 3000 characters max
  const truncatedGitDiff = gitDiff.length > 3000
    ? gitDiff.substring(0, 3000) + '\n... (truncated)'
    : gitDiff;
  
  // Create state object
  const state = {
    timestamp: new Date().toISOString(),
    note: note,
    gitDiff: truncatedGitDiff,
    terminalLog: terminalLog,
    openFiles: sortedFiles
  };
  
  // Ensure data directory exists
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    // Directory might already exist, ignore error
  }
  
  // Save to data/thread.json
  const outputPath = path.join(dataDir, 'thread.json');
  await fs.writeFile(outputPath, JSON.stringify(state, null, 2), 'utf-8');
  
  console.log(`State captured successfully!`);
  console.log(`- Files modified in last 2 hours: ${sortedFiles.length}`);
  console.log(`- Git diff size: ${gitDiff.length} characters`);
  console.log(`- Terminal history: ${terminalLog.length} commands`);
  console.log(`- Saved to: ${outputPath}`);
  
  return state;
}

module.exports = { 
  readTerminalHistory,
  getGitDiff,
  scanRecentFiles,
  captureState 
};

// Made with Bob
