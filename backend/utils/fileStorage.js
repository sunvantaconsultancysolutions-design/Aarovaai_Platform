const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Read JSON file safely. Returns default value if file doesn't exist.
 */
function readJSON(filename, defaultValue = []) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filePath)) {
      writeJSON(filename, defaultValue);
      return defaultValue;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[FileStorage] Error reading ${filename}:`, err.message);
    return defaultValue;
  }
}

/**
 * Write JSON file safely (atomic write via temp file).
 */
function writeJSON(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  const tmpPath = filePath + '.tmp';
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    console.error(`[FileStorage] Error writing ${filename}:`, err.message);
    throw err;
  }
}

/**
 * Read a nested JSON file (e.g. aptitude/arithmetic.json)
 */
function readNestedJSON(subDir, filename, defaultValue = []) {
  const filePath = path.join(DATA_DIR, subDir, filename);
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[FileStorage] Error reading ${subDir}/${filename}:`, err.message);
    return defaultValue;
  }
}

module.exports = { readJSON, writeJSON, readNestedJSON };
