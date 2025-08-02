const fs = require('fs').promises;
const path = require('path');

async function createBackup() {
  try {
    const dataDir = path.join(__dirname, '..', 'data');
    const backupDir = path.join(__dirname, '..', 'backups');
    
    // Ensure backup directory exists
    await fs.mkdir(backupDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup_${timestamp}.json`);
    
    const backup = {
      timestamp: new Date().toISOString(),
      data: {}
    };
    
    // Read all level files
    for (let level = 1; level <= 4; level++) {
      const filePath = path.join(dataDir, `level_${level}.json`);
      try {
        const data = await fs.readFile(filePath, 'utf8');
        backup.data[`level_${level}`] = JSON.parse(data);
      } catch (error) {
        console.warn(`No data file for level ${level}`);
        backup.data[`level_${level}`] = { level, cards: [] };
      }
    }
    
    await fs.writeFile(backupFile, JSON.stringify(backup, null, 2));
    console.log(`Backup created: ${backupFile}`);
    
    // Clean old backups (keep only last 10)
    const backupFiles = await fs.readdir(backupDir);
    const backupFilesSorted = backupFiles
      .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
      .sort()
      .reverse();
    
    if (backupFilesSorted.length > 10) {
      const filesToDelete = backupFilesSorted.slice(10);
      for (const file of filesToDelete) {
        await fs.unlink(path.join(backupDir, file));
        console.log(`Deleted old backup: ${file}`);
      }
    }
    
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  createBackup();
}

module.exports = createBackup;