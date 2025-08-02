const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Initialize data files if they don't exist
async function initializeDataFiles() {
  await ensureDataDir();
  
  for (let level = 1; level <= 4; level++) {
    const filePath = path.join(DATA_DIR, `level_${level}.json`);
    try {
      await fs.access(filePath);
    } catch {
      // File doesn't exist, create with default data
      const defaultData = { level, cards: [], lastUpdated: new Date().toISOString() };
      await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
    }
  }
}

// API Routes
app.get('/api/cards/:level', async (req, res) => {
  try {
    const level = parseInt(req.params.level);
    const filePath = path.join(DATA_DIR, `level_${level}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read cards data' });
  }
});

app.post('/api/cards/:level', async (req, res) => {
  try {
    const level = parseInt(req.params.level);
    const { cards } = req.body;
    const filePath = path.join(DATA_DIR, `level_${level}.json`);
    
    const data = {
      level,
      cards,
      lastUpdated: new Date().toISOString(),
      totalCards: cards.length
    };
    
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    res.json({ success: true, message: `Saved ${cards.length} cards for level ${level}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save cards data' });
  }
});

app.post('/api/cards/:level/upload', async (req, res) => {
  try {
    const level = parseInt(req.params.level);
    const { cards } = req.body;
    const filePath = path.join(DATA_DIR, `level_${level}.json`);
    
    // Read existing data
    let existingData = { level, cards: [] };
    try {
      const data = await fs.readFile(filePath, 'utf8');
      existingData = JSON.parse(data);
    } catch {
      // File doesn't exist, use default
    }
    
    // Add new cards with unique IDs
    const newCards = cards.map((card, index) => ({
      ...card,
      id: Date.now() + index,
      level
    }));
    
    existingData.cards.push(...newCards);
    existingData.lastUpdated = new Date().toISOString();
    existingData.totalCards = existingData.cards.length;
    
    await fs.writeFile(filePath, JSON.stringify(existingData, null, 2));
    res.json({ 
      success: true, 
      message: `Added ${newCards.length} cards to level ${level}`,
      totalCards: existingData.cards.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload cards' });
  }
});

app.delete('/api/cards/:level/:cardId', async (req, res) => {
  try {
    const level = parseInt(req.params.level);
    const cardId = parseInt(req.params.cardId);
    const filePath = path.join(DATA_DIR, `level_${level}.json`);
    
    const data = await fs.readFile(filePath, 'utf8');
    const levelData = JSON.parse(data);
    
    levelData.cards = levelData.cards.filter(card => card.id !== cardId);
    levelData.lastUpdated = new Date().toISOString();
    levelData.totalCards = levelData.cards.length;
    
    await fs.writeFile(filePath, JSON.stringify(levelData, null, 2));
    res.json({ success: true, message: 'Card deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete card' });
  }
});

// Backup endpoint
app.get('/api/backup', async (req, res) => {
  try {
    const backup = {};
    for (let level = 1; level <= 4; level++) {
      const filePath = path.join(DATA_DIR, `level_${level}.json`);
      try {
        const data = await fs.readFile(filePath, 'utf8');
        backup[`level_${level}`] = JSON.parse(data);
      } catch {
        backup[`level_${level}`] = { level, cards: [] };
      }
    }
    
    backup.backupDate = new Date().toISOString();
    res.json(backup);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Initialize and start server
async function startServer() {
  await initializeDataFiles();
  app.listen(PORT, () => {
    console.log(`Thai Learning Cards Server running on port ${PORT}`);
    console.log(`Data directory: ${DATA_DIR}`);
  });
}

startServer().catch(console.error);