// Zip utility for creating compressed downloads
const ZipUtils = {
  // Create a zip archive using browser-compatible methods
  createZip: async () => {
    try {
      const zip = {
        files: new Map(),
        
        file: function(name, content) {
          this.files.set(name, content);
          return this;
        },
        
        folder: function(name) {
          return {
            file: (filename, content) => {
              zip.files.set(`${name}/${filename}`, content);
              return zip;
            }
          };
        },
        
        generateAsync: async function(options) {
          return await ZipUtils.createZipFile(this.files);
        }
      };
      
      return zip;
    } catch (error) {
      console.error('Error creating zip:', error);
      return null;
    }
  },

  // Create a simple archive as JSON instead of ZIP for reliability
  createZipFile: async (filesMap) => {
    try {
      console.log('Creating simple archive...');
      const archive = {
        type: 'thai-learning-package',
        version: '1.0',
        created: new Date().toISOString(),
        files: {}
      };

      for (const [filename, content] of filesMap) {
        if (typeof content === 'string') {
          archive.files[filename] = {
            type: 'text',
            content: content
          };
        } else if (content instanceof Blob) {
          // Convert blob to base64 for JSON storage
          const base64 = await ZipUtils.blobToBase64(content);
          archive.files[filename] = {
            type: 'blob',
            mimeType: content.type || 'application/octet-stream',
            content: base64,
            size: content.size
          };
        } else {
          archive.files[filename] = {
            type: 'text',
            content: String(content)
          };
        }
      }

      const jsonString = JSON.stringify(archive, null, 2);
      return new Blob([jsonString], { type: 'application/json' });
    } catch (error) {
      console.error('Error creating archive:', error);
      // Fallback to simple text file
      const fallbackContent = `泰语学习卡片下载包\n创建时间: ${new Date().toLocaleString()}\n\n文件列表:\n${Array.from(filesMap.keys()).join('\n')}`;
      return new Blob([fallbackContent], { type: 'text/plain' });
    }
  },

  // Helper functions for ZIP format
  uint16ToBytes: (value) => {
    return [value & 0xff, (value >> 8) & 0xff];
  },

  uint32ToBytes: (value) => {
    return [
      value & 0xff,
      (value >> 8) & 0xff,
      (value >> 16) & 0xff,
      (value >> 24) & 0xff
    ];
  },

  // Simple CRC32 implementation
  crc32: (data) => {
    const crcTable = ZipUtils.makeCrcTable();
    let crc = 0 ^ (-1);
    
    for (let i = 0; i < data.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xFF];
    }
    
    return (crc ^ (-1)) >>> 0;
  },

  makeCrcTable: () => {
    let c;
    const crcTable = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
      }
      crcTable[n] = c;
    }
    return crcTable;
  },

  // Convert blob to base64
  blobToBase64: (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },

  // Generate SVG card image with better formatting
  generateCardSVG: (card, index) => {
    const cardNumber = String(index + 1).padStart(3, '0');
    const filename = `card_${cardNumber}_${card.thai.replace(/[^\w\u0E00-\u0E7F]/g, '_')}.svg`;
    
    // Escape special characters for SVG
    const escapeXml = (text) => {
      return text.replace(/&/g, '&amp;')
                 .replace(/</g, '&lt;')
                 .replace(/>/g, '&gt;')
                 .replace(/"/g, '&quot;')
                 .replace(/'/g, '&#39;');
    };
    
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .card-bg { fill: #ffffff; stroke: #e2e8f0; stroke-width: 2; }
      .thai-text { font-family: Arial, sans-serif; font-size: 28px; font-weight: bold; fill: #1e293b; text-anchor: middle; }
      .pronunciation { font-family: Arial, sans-serif; font-size: 16px; fill: #64748b; text-anchor: middle; }
      .chinese { font-family: Arial, sans-serif; font-size: 18px; fill: #374151; text-anchor: middle; }
      .example-bg { fill: #f8fafc; stroke: #cbd5e1; stroke-width: 1; }
      .example-label { font-family: Arial, sans-serif; font-size: 11px; fill: #64748b; font-weight: bold; }
      .example-text { font-family: Arial, sans-serif; font-size: 12px; fill: #1e293b; }
      .example-chinese { font-family: Arial, sans-serif; font-size: 11px; fill: #64748b; }
      .card-info { font-family: Arial, sans-serif; font-size: 10px; fill: #94a3b8; }
    </style>
  </defs>
  <rect width="400" height="300" class="card-bg" rx="12"/>
  <text x="200" y="50" class="thai-text">${escapeXml(card.thai)}</text>
  <text x="200" y="75" class="pronunciation">[${escapeXml(card.pronunciation)}]</text>
  <text x="200" y="100" class="chinese">${escapeXml(card.chinese)}</text>
  <rect x="15" y="120" width="370" height="130" class="example-bg" rx="8"/>
  <text x="25" y="140" class="example-label">例句 EXAMPLE:</text>
  <text x="25" y="160" class="example-text">${escapeXml(ZipUtils.wrapText(card.example, 30))}</text>
  <text x="25" y="180" class="example-chinese">${escapeXml(ZipUtils.wrapText(card.example_translation, 35))}</text>
  <text x="25" y="270" class="card-info">卡片 ${cardNumber} | 级别 ${card.level} | 泰语学习卡片</text>
</svg>`;

    return {
      content: svgContent,
      filename: filename
    };
  },

  // Helper function to wrap text for SVG
  wrapText: (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  // Download real audio file from URL
  downloadAudioFile: async (url, filename) => {
    try {
      // Try direct download first
      let response;
      try {
        response = await fetch(url, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'audio/*',
          }
        });
      } catch (corsError) {
        // If CORS fails, try with a proxy
        console.log('Direct download failed, trying with proxy...');
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'audio/*',
          }
        });
      }
      
      if (response.ok) {
        const audioBlob = await response.blob();
        // Verify it's actually audio content
        if (audioBlob.size > 0) {
          return {
            blob: audioBlob,
            filename: filename,
            size: audioBlob.size
          };
        } else {
          throw new Error('Downloaded file is empty');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error downloading audio from ${url}:`, error);
      // Return a text file with the URL instead
      const textContent = `Audio URL: ${url}\nFilename: ${filename}\nError: ${error.message}\n\nNote: Could not download the actual audio file due to CORS restrictions.`;
      const textBlob = new Blob([textContent], { type: 'text/plain' });
      return {
        blob: textBlob,
        filename: filename.replace('.mp3', '.txt'),
        size: textBlob.size
      };
    }
  },

  // Create downloadable package with real files
  createDownloadPackage: async (cards, level, onProgress) => {
    try {
      console.log('Starting download package creation...');
      
      const filesMap = new Map();
      let processedCount = 0;
      const totalSteps = cards.length * 3; // word audio + example audio + SVG image

      // Process each card
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const cardNumber = String(i + 1).padStart(3, '0');
        
        if (onProgress) {
          onProgress(`处理卡片 ${i + 1}/${cards.length}: ${card.thai}`, Math.round((processedCount / totalSteps) * 100));
        }

        // Generate and add SVG image
        try {
          const svgData = ZipUtils.generateCardSVG(card, i);
          filesMap.set(`images/${svgData.filename}`, svgData.content);
          processedCount++;
        } catch (error) {
          console.error(`Error generating SVG for card ${card.id}:`, error);
          processedCount++;
        }

        // Download word audio if available in cache
        const wordCacheKey = `${card.thai}_th`;
        const wordAudioUrl = AudioUtils.audioCache.get(wordCacheKey);
        if (wordAudioUrl) {
          try {
            const wordFilename = `card_${cardNumber}_${card.thai.replace(/[^\w\u0E00-\u0E7F]/g, '_')}_word.mp3`;
            const audioFile = await ZipUtils.downloadAudioFile(wordAudioUrl, wordFilename);
            if (audioFile && audioFile.blob) {
              filesMap.set(`audio/words/${audioFile.filename}`, audioFile.blob);
              console.log(`Added word audio: ${audioFile.filename} (${audioFile.size} bytes)`);
            }
          } catch (error) {
            console.error(`Error downloading word audio for card ${card.id}:`, error);
          }
        }
        processedCount++;

        // Download example audio if available in cache
        const exampleCacheKey = `${card.example}_th`;
        const exampleAudioUrl = AudioUtils.audioCache.get(exampleCacheKey);
        if (exampleAudioUrl) {
          try {
            const exampleFilename = `card_${cardNumber}_${card.thai.replace(/[^\w\u0E00-\u0E7F]/g, '_')}_example.mp3`;
            const audioFile = await ZipUtils.downloadAudioFile(exampleAudioUrl, exampleFilename);
            if (audioFile && audioFile.blob) {
              filesMap.set(`audio/examples/${audioFile.filename}`, audioFile.blob);
              console.log(`Added example audio: ${audioFile.filename} (${audioFile.size} bytes)`);
            }
          } catch (error) {
            console.error(`Error downloading example audio for card ${card.id}:`, error);
          }
        }
        processedCount++;

        // Small delay to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Add cards data as JSON
      const cardsData = {
        level: level,
        cards: cards,
        created: new Date().toISOString(),
        totalCards: cards.length
      };
      filesMap.set(`data/cards_level_${level}.json`, JSON.stringify(cardsData, null, 2));

      // Add README file
      const readmeContent = `# 泰语学习卡片包 - 级别 ${level}

## 文件结构
- audio/words/ - 单词发音文件
- audio/examples/ - 例句发音文件  
- images/ - SVG格式卡片图片
- data/ - 卡片数据JSON文件

## 文件说明
- 音频文件: MP3格式，高质量泰语发音
- 图片文件: SVG格式，可缩放矢量图形
- 数据文件: JSON格式，包含完整卡片信息

## 文件命名规则
- 音频: card_001_สวัสดี_word.mp3 (卡片编号_泰语_类型.mp3)
- 图片: card_001_สวัสดี.svg (卡片编号_泰语.svg)

生成时间: ${new Date().toLocaleString('zh-CN')}
卡片数量: ${cards.length}
级别: ${level}
`;
      filesMap.set('README.md', readmeContent);

      if (onProgress) {
        onProgress('正在生成下载文件...', 95);
      }

      // Generate final zip
      const zipBlob = await ZipUtils.createZipFile(filesMap);
      
      if (onProgress) {
        onProgress('下载准备完成！', 100);
      }

      return zipBlob;

    } catch (error) {
      console.error('Error creating download package:', error);
      throw error;
    }
  },

  // Generate audio files for cards
  generateAudioFiles: async (cards) => {
    const audioFiles = {};
    
    for (const card of cards) {
      try {
        console.log(`Generating audio for card ${card.id}: ${card.thai}`);
        
        // Generate word audio
        const wordAudio = await AudioUtils.generateAudio(card.thai, 'th');
        if (wordAudio) {
          try {
            console.log(`Fetching word audio from: ${wordAudio}`);
            const response = await fetch(wordAudio, {
              method: 'GET',
              headers: {
                'Accept': 'audio/*',
              }
            });
            
            if (response.ok) {
              const audioBlob = await response.blob();
              console.log(`Word audio blob size: ${audioBlob.size} bytes`);
              audioFiles[`audio/word_${card.id}_${card.thai.replace(/[^\w\u0E00-\u0E7F]/g, '_')}.mp3`] = audioBlob;
            } else {
              console.warn(`Failed to fetch word audio: ${response.status}`);
              // Create a text file with the URL for reference
              audioFiles[`audio/word_${card.id}_${card.thai.replace(/[^\w\u0E00-\u0E7F]/g, '_')}.txt`] = `Audio URL: ${wordAudio}\nNote: Could not download audio file directly.`;
            }
          } catch (fetchError) {
            console.error(`Error fetching word audio:`, fetchError);
            audioFiles[`audio/word_${card.id}_${card.thai.replace(/[^\w\u0E00-\u0E7F]/g, '_')}.txt`] = `Audio URL: ${wordAudio}\nError: ${fetchError.message}`;
          }
        }
        
        // Generate example audio
        const exampleAudio = await AudioUtils.generateAudio(card.example, 'th');
        if (exampleAudio) {
          try {
            console.log(`Fetching example audio from: ${exampleAudio}`);
            const response = await fetch(exampleAudio, {
              method: 'GET',
              headers: {
                'Accept': 'audio/*',
              }
            });
            
            if (response.ok) {
              const audioBlob = await response.blob();
              console.log(`Example audio blob size: ${audioBlob.size} bytes`);
              audioFiles[`audio/example_${card.id}.mp3`] = audioBlob;
            } else {
              console.warn(`Failed to fetch example audio: ${response.status}`);
              audioFiles[`audio/example_${card.id}.txt`] = `Audio URL: ${exampleAudio}\nNote: Could not download audio file directly.`;
            }
          } catch (fetchError) {
            console.error(`Error fetching example audio:`, fetchError);
            audioFiles[`audio/example_${card.id}.txt`] = `Audio URL: ${exampleAudio}\nError: ${fetchError.message}`;
          }
        }
        
        // Add a small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Error generating audio for card ${card.id}:`, error);
        audioFiles[`audio/error_${card.id}.txt`] = `Error generating audio: ${error.message}`;
      }
    }
    
    return audioFiles;
  },

  // Generate card images as proper image files
  generateCardImages: async (cards) => {
    const imageFiles = {};
    
    for (const card of cards) {
      try {
        // Generate a card image as SVG
        const cardSvg = `
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .card-bg { fill: #f8fafc; stroke: #e2e8f0; stroke-width: 2; }
      .thai-text { font-family: Arial; font-size: 32px; font-weight: bold; fill: #1e293b; text-anchor: middle; }
      .pronunciation { font-family: Arial; font-size: 18px; fill: #64748b; text-anchor: middle; }
      .chinese { font-family: Arial; font-size: 20px; fill: #374151; text-anchor: middle; }
      .example-bg { fill: #f1f5f9; stroke: #cbd5e1; stroke-width: 1; }
      .example-label { font-family: Arial; font-size: 12px; fill: #64748b; }
      .example-text { font-family: Arial; font-size: 14px; fill: #1e293b; }
    </style>
  </defs>
  <rect width="400" height="300" class="card-bg" rx="12"/>
  <text x="200" y="80" class="thai-text">${card.thai}</text>
  <text x="200" y="120" class="pronunciation">${card.pronunciation}</text>
  <text x="200" y="150" class="chinese">${card.chinese}</text>
  <rect x="20" y="180" width="360" height="80" class="example-bg" rx="8"/>
  <text x="30" y="200" class="example-label">例句:</text>
  <text x="30" y="220" class="example-text">${card.example.substring(0, 30)}${card.example.length > 30 ? '...' : ''}</text>
  <text x="30" y="240" class="example-label">${card.example_translation.substring(0, 35)}${card.example_translation.length > 35 ? '...' : ''}</text>
</svg>`;
        
        // Convert SVG to blob
        const svgBlob = new Blob([cardSvg], { type: 'image/svg+xml' });
        imageFiles[`images/card_${card.id}_${card.thai.replace(/[^\w]/g, '_')}.svg`] = svgBlob;
      } catch (error) {
        console.error(`Error generating image for card ${card.id}:`, error);
      }
    }
    
    return imageFiles;
  },

  // Download individual files sequentially
  downloadFilesSequentially: async (cards, level, onProgress) => {
    try {
      let downloadCount = 0;
      const totalFiles = cards.length * 3; // SVG + word audio + example audio
      
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const cardNumber = String(i + 1).padStart(3, '0');
        const baseName = `card_${cardNumber}_${card.thai.replace(/[^\w\u0E00-\u0E7F]/g, '_')}`;
        
        if (onProgress) {
          onProgress(`正在下载卡片 ${i + 1}/${cards.length}: ${card.thai}`, Math.round((downloadCount / totalFiles) * 100));
        }
        
        // Download SVG
        try {
          const svgData = ZipUtils.generateCardSVG(card, i);
          const svgBlob = new Blob([svgData.content], { type: 'image/svg+xml' });
          ZipUtils.triggerDownload(svgBlob, svgData.filename);
          downloadCount++;
          await ZipUtils.delay(300); // Delay between downloads
        } catch (error) {
          console.error(`Error downloading SVG for card ${card.id}:`, error);
          downloadCount++;
        }
        
        // Download word audio (generate if not cached)
        try {
          const wordFilename = `${baseName}_word.mp3`;
          await ZipUtils.generateAndDownloadAudio(card.thai, wordFilename, 'th');
          downloadCount++;
        } catch (error) {
          console.error(`Error downloading word audio for card ${card.id}:`, error);
          downloadCount++;
        }
        
        // Download example audio (generate if not cached)  
        try {
          const exampleFilename = `${baseName}_example.mp3`;
          await ZipUtils.generateAndDownloadAudio(card.example, exampleFilename, 'th');
          downloadCount++;
        } catch (error) {
          console.error(`Error downloading example audio for card ${card.id}:`, error);
          downloadCount++;
        }
        
        await ZipUtils.delay(500); // Delay between cards
      }
      
      if (onProgress) {
        onProgress('下载完成！', 100);
      }
      
      return true;
    } catch (error) {
      console.error('Error in sequential download:', error);
      throw error;
    }
  },

  // Helper function to trigger file download
  triggerDownload: (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Helper function to download audio from URL
  downloadAudioFromUrl: async (audioUrl, filename) => {
    try {
      // Method 1: Try direct fetch first
      console.log(`Attempting to download audio from: ${audioUrl}`);
      
      let audioBlob = null;
      let downloadSuccess = false;
      
      try {
        const response = await fetch(audioUrl, {
          method: 'GET',
          headers: {
            'Accept': 'audio/mpeg, audio/mp3, audio/*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          mode: 'cors'
        });
        
        if (response.ok) {
          audioBlob = await response.blob();
          if (audioBlob.size > 0) {
            console.log(`Direct download successful: ${audioBlob.size} bytes`);
            ZipUtils.triggerDownload(audioBlob, filename);
            return true;
          }
        }
      } catch (corsError) {
        console.log('CORS failed, trying proxy method...');
      }
      
      // Method 2: Try with CORS proxy
      try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(audioUrl)}`;
        const proxyResponse = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'audio/*',
          }
        });
        
        if (proxyResponse.ok) {
          audioBlob = await proxyResponse.blob();
          if (audioBlob.size > 0) {
            console.log(`Proxy download successful: ${audioBlob.size} bytes`);
            ZipUtils.triggerDownload(audioBlob, filename);
            return true;
          }
        }
      } catch (proxyError) {
        console.log('Proxy method failed, trying alternative...');
      }
      
      // Method 3: Try alternative proxy
      try {
        const altProxyUrl = `https://cors-anywhere.herokuapp.com/${audioUrl}`;
        const altResponse = await fetch(altProxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'audio/*',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        
        if (altResponse.ok) {
          audioBlob = await altResponse.blob();
          if (audioBlob.size > 0) {
            console.log(`Alternative proxy download successful: ${audioBlob.size} bytes`);
            ZipUtils.triggerDownload(audioBlob, filename);
            return true;
          }
        }
      } catch (altError) {
        console.log('Alternative proxy failed');
      }
      
      // Method 4: Create downloadable link as fallback
      console.log('All download methods failed, creating link file...');
      const linkContent = `${audioUrl}`;
      const linkBlob = new Blob([linkContent], { type: 'text/plain' });
      ZipUtils.triggerDownload(linkBlob, filename.replace('.mp3', '_link.txt'));
      
      // Method 5: Try to open URL in new tab for manual download
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = audioUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.click();
      }, 500);
      
      return false;
      
    } catch (error) {
      console.error(`Failed to download audio from ${audioUrl}:`, error);
      
      // Final fallback: create instruction file
      const instructionContent = `音频下载说明 / Audio Download Instructions

原始音频链接 / Original Audio URL:
${audioUrl}

文件名 / Filename: ${filename}

下载方法 / Download Methods:
1. 点击上方链接直接访问音频文件
2. 右键链接选择"另存为"保存音频文件  
3. 复制链接到下载工具中下载

注意 / Note: 
由于浏览器安全限制，无法自动下载此音频文件。
请手动点击链接下载。

Due to browser security restrictions, this audio file cannot be downloaded automatically.
Please manually click the link to download.`;

      const instructionBlob = new Blob([instructionContent], { type: 'text/plain; charset=utf-8' });
      ZipUtils.triggerDownload(instructionBlob, filename.replace('.mp3', '_download_instructions.txt'));
      
      return false;
    }
  },

  // Generate and download audio immediately
  generateAndDownloadAudio: async (text, filename, lang = 'th') => {
    try {
      console.log(`Generating and downloading audio for: ${text}`);
      
      // First try to get from cache
      const cacheKey = `${text}_${lang}`;
      const cachedUrl = AudioUtils.audioCache.get(cacheKey);
      
      if (cachedUrl) {
        console.log('Found cached audio URL, attempting download...');
        return await ZipUtils.downloadAudioFromUrl(cachedUrl, filename);
      }
      
      // Generate new audio
      console.log('Generating new audio...');
      const audioUrl = await AudioUtils.generateAudio(text, lang);
      
      if (audioUrl) {
        console.log('Audio generated successfully, downloading...');
        return await ZipUtils.downloadAudioFromUrl(audioUrl, filename);
      } else {
        throw new Error('Failed to generate audio');
      }
      
    } catch (error) {
      console.error(`Failed to generate and download audio for "${text}":`, error);
      
      // Create fallback file with TTS instruction
      const fallbackContent = `音频生成失败 / Audio Generation Failed

文本内容 / Text Content: ${text}
语言 / Language: ${lang}
目标文件名 / Target Filename: ${filename}

错误信息 / Error: ${error.message}

建议 / Suggestions:
1. 检查网络连接
2. 稍后重试音频生成
3. 使用在线TTS工具手动生成

Check network connection and retry audio generation later.
You can also use online TTS tools to generate audio manually.`;

      const fallbackBlob = new Blob([fallbackContent], { type: 'text/plain; charset=utf-8' });
      ZipUtils.triggerDownload(fallbackBlob, filename.replace('.mp3', '_generation_failed.txt'));
      
      return false;
    }
  },

  // Helper function for delays
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Create simple archive with only generated audio files
  createCompleteArchive: async (cards, level) => {
    try {
      console.log('Starting archive creation for', cards.length, 'cards');
      
      const archive = {
        type: 'thai-learning-package',
        version: '1.0',
        level: level,
        created: new Date().toISOString(),
        totalCards: cards.length,
        cards: cards,
        audioUrls: {},
        images: {}
      };

      // Only include audio URLs that are already generated and cached
      console.log('Collecting cached audio URLs...');
      for (const card of cards) {
        // Check for word audio in cache
        const wordCacheKey = `${card.thai}_th`;
        const wordAudioUrl = AudioUtils.audioCache.get(wordCacheKey);
        if (wordAudioUrl) {
          archive.audioUrls[`word_${card.id}`] = {
            url: wordAudioUrl,
            text: card.thai,
            type: 'word',
            filename: `card_${String(cards.indexOf(card) + 1).padStart(3, '0')}_${card.thai.replace(/[^\w\u0E00-\u0E7F]/g, '_')}_word.mp3`
          };
        }

        // Check for example audio in cache
        const exampleCacheKey = `${card.example}_th`;
        const exampleAudioUrl = AudioUtils.audioCache.get(exampleCacheKey);
        if (exampleAudioUrl) {
          archive.audioUrls[`example_${card.id}`] = {
            url: exampleAudioUrl,
            text: card.example,
            type: 'example',
            filename: `card_${String(cards.indexOf(card) + 1).padStart(3, '0')}_${card.thai.replace(/[^\w\u0E00-\u0E7F]/g, '_')}_example.mp3`
          };
        }
      }

      // Generate SVG images
      console.log('Generating card images...');
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const svgData = ZipUtils.generateCardSVG(card, i);
        archive.images[`card_${card.id}`] = {
          content: svgData.content,
          filename: svgData.filename
        };
      }

      // Add usage instructions
      archive.instructions = `
# 泰语学习卡片包使用说明

## 文件内容
- cards: 学习卡片数据 (${cards.length}张)
- audioUrls: 已生成的音频文件URL链接 (${Object.keys(archive.audioUrls).length}个)
- images: SVG格式的卡片图片 (${Object.keys(archive.images).length}个)

## 音频文件说明
只包含已经通过"生成音频"功能生成的语音文件。
如需更多音频，请先在管理界面点击"生成音频"按钮。

## 使用方法
1. 音频链接可以直接在浏览器中播放或下载
2. SVG图片可以保存为文件并在剪映等软件中使用
3. 文件命名格式便于剪映等视频编辑软件识别和匹配

生成时间: ${new Date().toLocaleString('zh-CN')}
级别: ${level}
卡片数量: ${cards.length}
音频文件数量: ${Object.keys(archive.audioUrls).length}
`;

      console.log('Creating download package...');
      const jsonString = JSON.stringify(archive, null, 2);
      return new Blob([jsonString], { 
        type: 'application/json',
        name: `thai-learning-level-${level}.json`
      });

    } catch (error) {
      console.error('Error creating archive:', error);
      
      // Fallback: create minimal package with just cards
      const fallbackData = {
        cards: cards,
        level: level,
        created: new Date().toISOString(),
        error: 'Failed to generate complete package, this is a basic card export'
      };
      
      return new Blob([JSON.stringify(fallbackData, null, 2)], { 
        type: 'application/json' 
      });
    }
  }
};
