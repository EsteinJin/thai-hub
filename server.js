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

// Audio storage endpoint with MP3 download
app.post('/api/audio/store', async (req, res) => {
  try {
    const { cardId, audioType, audioUrl, text } = req.body;
    const audioDir = path.join(DATA_DIR, 'audio');
    await fs.mkdir(audioDir, { recursive: true });
    
    // Download MP3 file to server
    let localFilePath = null;
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(audioUrl);
      if (response.ok) {
        const buffer = await response.buffer();
        const filename = `${cardId}_${audioType}.mp3`;
        localFilePath = path.join(audioDir, filename);
        await fs.writeFile(localFilePath, buffer);
        console.log(`Audio file saved: ${filename}`);
      }
    } catch (downloadError) {
      console.warn('Failed to download MP3 file:', downloadError);
    }
    
    const audioData = {
      cardId,
      audioType,
      audioUrl,
      localFile: localFilePath ? path.basename(localFilePath) : null,
      text,
      createdAt: new Date().toISOString()
    };
    
    const metaFilename = `${cardId}_${audioType}.json`;
    const metaFilePath = path.join(audioDir, metaFilename);
    await fs.writeFile(metaFilePath, JSON.stringify(audioData, null, 2));
    
    res.json({ 
      success: true, 
      message: localFilePath ? 'Audio file downloaded and stored' : 'Audio URL stored',
      hasLocalFile: !!localFilePath
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to store audio' });
  }
});

// Get stored audio data
app.get('/api/audio/:cardId/:audioType', async (req, res) => {
  try {
    const { cardId, audioType } = req.params;
    const audioDir = path.join(DATA_DIR, 'audio');
    const metaFile = `${cardId}_${audioType}.json`;
    const metaPath = path.join(audioDir, metaFile);
    
    const data = await fs.readFile(metaPath, 'utf8');
    const audioData = JSON.parse(data);
    
    // If local file exists, provide local URL
    if (audioData.localFile) {
      audioData.localUrl = `/api/audio/file/${audioData.localFile}`;
    }
    
    res.json(audioData);
  } catch (error) {
    res.status(404).json({ error: 'Audio data not found' });
  }
});

// Serve audio files
app.get('/api/audio/file/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const audioDir = path.join(DATA_DIR, 'audio');
    const filePath = path.join(audioDir, filename);
    
    await fs.access(filePath);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    res.status(404).json({ error: 'Audio file not found' });
  }
});

// Bulk audio generation endpoint
app.post('/api/audio/generate-bulk', async (req, res) => {
  try {
    const { cards } = req.body;
    let successCount = 0;
    let failCount = 0;
    
    for (const card of cards) {
      try {
        // Generate word audio
        const wordResponse = await generateAndStoreAudio(card.thai, `${card.id}_word`, 'word');
        if (wordResponse.success) successCount++;
        else failCount++;
        
        // Generate example audio
        const exampleResponse = await generateAndStoreAudio(card.example, `${card.id}_example`, 'example');
        if (exampleResponse.success) successCount++;
        else failCount++;
        
        // Small delay to avoid overwhelming API
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error generating audio for card ${card.id}:`, error);
        failCount += 2;
      }
    }
    
    res.json({
      success: true,
      message: `Generated ${successCount} audio files, ${failCount} failed`,
      successCount,
      failCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Bulk audio generation failed' });
  }
});

// Helper function to generate and store audio
async function generateAndStoreAudio(text, cardId, audioType) {
  try {
    const fetch = (await import('node-fetch')).default;
    
    // Generate audio using SoundOfText API
    const generateResponse = await fetch('https://api.soundoftext.com/sounds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        engine: 'Google',
        data: { text: text, voice: 'th-TH' }
      })
    });
    
    if (!generateResponse.ok) {
      throw new Error('Audio generation failed');
    }
    
    const result = await generateResponse.json();
    if (!result.success || !result.id) {
      throw new Error('Invalid generation response');
    }
    
    // Poll for audio completion
    let audioUrl = null;
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pollResponse = await fetch(`https://api.soundoftext.com/sounds/${result.id}`);
      if (pollResponse.ok) {
        const pollResult = await pollResponse.json();
        if (pollResult.status === 'Done' && pollResult.location) {
          audioUrl = pollResult.location;
          break;
        }
        if (pollResult.status === 'Error') {
          throw new Error('Audio generation error');
        }
      }
    }
    
    if (!audioUrl) {
      throw new Error('Audio generation timeout');
    }
    
    // Store audio with local download
    const audioDir = path.join(DATA_DIR, 'audio');
    await fs.mkdir(audioDir, { recursive: true });
    
    // Download MP3 file
    const audioResponse = await fetch(audioUrl);
    if (audioResponse.ok) {
      const buffer = await audioResponse.buffer();
      const filename = `${cardId}.mp3`;
      const localFilePath = path.join(audioDir, filename);
      await fs.writeFile(localFilePath, buffer);
      
      // Store metadata
      const audioData = {
        cardId,
        audioType,
        audioUrl,
        localFile: filename,
        text,
        createdAt: new Date().toISOString()
      };
      
      const metaFilename = `${cardId}.json`;
      const metaFilePath = path.join(audioDir, metaFilename);
      await fs.writeFile(metaFilePath, JSON.stringify(audioData, null, 2));
      
      return { success: true, localFile: filename };
    } else {
      throw new Error('Failed to download audio file');
    }
  } catch (error) {
    console.error('Generate and store audio error:', error);
    return { success: false, error: error.message };
  }
}

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