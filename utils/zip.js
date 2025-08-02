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

  // Create a proper ZIP file using manual ZIP format
  createZipFile: async (filesMap) => {
    try {
      const files = [];
      let offset = 0;
      
      // Process each file
      for (const [filename, content] of filesMap) {
        let fileData;
        let uncompressedSize;
        
        if (typeof content === 'string') {
          fileData = new TextEncoder().encode(content);
          uncompressedSize = fileData.length;
        } else if (content instanceof Blob) {
          fileData = new Uint8Array(await content.arrayBuffer());
          uncompressedSize = fileData.length;
        } else {
          const str = String(content);
          fileData = new TextEncoder().encode(str);
          uncompressedSize = fileData.length;
        }
        
        files.push({
          filename: filename,
          data: fileData,
          uncompressedSize: uncompressedSize,
          compressedSize: uncompressedSize, // No compression for simplicity
          offset: offset
        });
        
        offset += 30 + filename.length + uncompressedSize; // Local file header + filename + data
      }
      
      // Calculate total size
      const centralDirSize = files.reduce((sum, file) => sum + 46 + file.filename.length, 0);
      const totalSize = offset + centralDirSize + 22; // + End of central directory
      
      const zipData = new Uint8Array(totalSize);
      let pos = 0;
      
      // Write local file headers and data
      for (const file of files) {
        // Local file header signature
        zipData.set([0x50, 0x4b, 0x03, 0x04], pos); pos += 4;
        // Version needed to extract
        zipData.set([0x14, 0x00], pos); pos += 2;
        // General purpose bit flag
        zipData.set([0x00, 0x00], pos); pos += 2;
        // Compression method (0 = no compression)
        zipData.set([0x00, 0x00], pos); pos += 2;
        // File last modification time
        zipData.set([0x00, 0x00], pos); pos += 2;
        // File last modification date
        zipData.set([0x00, 0x00], pos); pos += 2;
        // CRC-32
        const crc = ZipUtils.crc32(file.data);
        zipData.set(ZipUtils.uint32ToBytes(crc), pos); pos += 4;
        // Compressed size
        zipData.set(ZipUtils.uint32ToBytes(file.compressedSize), pos); pos += 4;
        // Uncompressed size
        zipData.set(ZipUtils.uint32ToBytes(file.uncompressedSize), pos); pos += 4;
        // Filename length
        zipData.set(ZipUtils.uint16ToBytes(file.filename.length), pos); pos += 2;
        // Extra field length
        zipData.set([0x00, 0x00], pos); pos += 2;
        // Filename
        const filenameBytes = new TextEncoder().encode(file.filename);
        zipData.set(filenameBytes, pos); pos += filenameBytes.length;
        // File data
        zipData.set(file.data, pos); pos += file.data.length;
      }
      
      const centralDirStart = pos;
      
      // Write central directory
      for (const file of files) {
        // Central directory file header signature
        zipData.set([0x50, 0x4b, 0x01, 0x02], pos); pos += 4;
        // Version made by
        zipData.set([0x14, 0x00], pos); pos += 2;
        // Version needed to extract
        zipData.set([0x14, 0x00], pos); pos += 2;
        // General purpose bit flag
        zipData.set([0x00, 0x00], pos); pos += 2;
        // Compression method
        zipData.set([0x00, 0x00], pos); pos += 2;
        // File last modification time
        zipData.set([0x00, 0x00], pos); pos += 2;
        // File last modification date
        zipData.set([0x00, 0x00], pos); pos += 2;
        // CRC-32
        const crc = ZipUtils.crc32(file.data);
        zipData.set(ZipUtils.uint32ToBytes(crc), pos); pos += 4;
        // Compressed size
        zipData.set(ZipUtils.uint32ToBytes(file.compressedSize), pos); pos += 4;
        // Uncompressed size
        zipData.set(ZipUtils.uint32ToBytes(file.uncompressedSize), pos); pos += 4;
        // Filename length
        zipData.set(ZipUtils.uint16ToBytes(file.filename.length), pos); pos += 2;
        // Extra field length
        zipData.set([0x00, 0x00], pos); pos += 2;
        // File comment length
        zipData.set([0x00, 0x00], pos); pos += 2;
        // Disk number start
        zipData.set([0x00, 0x00], pos); pos += 2;
        // Internal file attributes
        zipData.set([0x00, 0x00], pos); pos += 2;
        // External file attributes
        zipData.set([0x00, 0x00, 0x00, 0x00], pos); pos += 4;
        // Relative offset of local header
        zipData.set(ZipUtils.uint32ToBytes(file.offset), pos); pos += 4;
        // Filename
        const filenameBytes = new TextEncoder().encode(file.filename);
        zipData.set(filenameBytes, pos); pos += filenameBytes.length;
      }
      
      // End of central directory record
      // End of central directory signature
      zipData.set([0x50, 0x4b, 0x05, 0x06], pos); pos += 4;
      // Number of this disk
      zipData.set([0x00, 0x00], pos); pos += 2;
      // Disk where central directory starts
      zipData.set([0x00, 0x00], pos); pos += 2;
      // Number of central directory records on this disk
      zipData.set(ZipUtils.uint16ToBytes(files.length), pos); pos += 2;
      // Total number of central directory records
      zipData.set(ZipUtils.uint16ToBytes(files.length), pos); pos += 2;
      // Size of central directory
      zipData.set(ZipUtils.uint32ToBytes(centralDirSize), pos); pos += 4;
      // Offset of start of central directory
      zipData.set(ZipUtils.uint32ToBytes(centralDirStart), pos); pos += 4;
      // ZIP file comment length
      zipData.set([0x00, 0x00], pos); pos += 2;
      
      return new Blob([zipData], { type: 'application/zip' });
    } catch (error) {
      console.error('Error creating ZIP file:', error);
      return null;
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
