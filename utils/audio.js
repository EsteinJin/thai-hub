// Audio utilities for text-to-speech and playback management
const AudioUtils = {
  currentAudio: null,
  speechSynthesis: null,
  audioCache: new Map(),

  // Initialize speech synthesis
  init: () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      AudioUtils.speechSynthesis = window.speechSynthesis;
    }
  },

  // Stop current audio playback
  stopCurrent: () => {
    try {
      if (AudioUtils.currentAudio) {
        AudioUtils.currentAudio.pause();
        AudioUtils.currentAudio.currentTime = 0;
        AudioUtils.currentAudio = null;
      }
      
      if (AudioUtils.speechSynthesis) {
        AudioUtils.speechSynthesis.cancel();
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  },

  // Generate audio using backend TTS (soundoftext API)
  generateAudio: async (text, lang = 'th') => {
    try {
      // Check cache first
      const cacheKey = `${text}_${lang}`;
      if (AudioUtils.audioCache.has(cacheKey)) {
        return AudioUtils.audioCache.get(cacheKey);
      }

      const response = await fetch('https://api.soundoftext.com/sounds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          engine: 'Google',
          data: {
            text: text,
            voice: lang === 'th' ? 'th-TH' : 'zh-CN'
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.id) {
          // Poll for audio URL
          const audioUrl = await AudioUtils.pollForAudio(result.id);
      if (audioUrl) {
        AudioUtils.audioCache.set(cacheKey, audioUrl);
        
        // Store audio URL to backend if possible
        try {
          await fetch('/api/audio/store', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cardId: `${text}_${lang}`,
              audioType: 'generated',
              audioUrl: audioUrl,
              text: text
            })
          });
        } catch (error) {
          console.warn('Failed to store audio URL to backend:', error);
        }
        
        return audioUrl;
      }
        }
      }
      return null;
    } catch (error) {
      console.error('Error generating audio:', error);
      return null;
    }
  },

  // Poll for audio generation completion
  pollForAudio: async (soundId, maxAttempts = 10) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`https://api.soundoftext.com/sounds/${soundId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.status === 'Done' && result.location) {
            return result.location;
          }
          if (result.status === 'Error') {
            break;
          }
        }
        // Wait 1 second before next attempt
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error polling for audio:', error);
        break;
      }
    }
    return null;
  },

  // Play audio from URL
  playAudioFile: async (audioUrl) => {
    try {
      AudioUtils.stopCurrent();
      
      const audio = new Audio(audioUrl);
      AudioUtils.currentAudio = audio;
      
      await audio.play();
      
      audio.addEventListener('ended', () => {
        AudioUtils.currentAudio = null;
      });
      
      return true;
    } catch (error) {
      console.error('Error playing audio file:', error);
      return false;
    }
  },

  // Fallback to browser TTS
  speakText: (text, lang = 'th') => {
    try {
      AudioUtils.stopCurrent();
      
      if (!AudioUtils.speechSynthesis) {
        AudioUtils.init();
      }
      
      if (!AudioUtils.speechSynthesis) {
        console.warn('Speech synthesis not supported');
        return false;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'th' ? 'th-TH' : 'zh-CN';
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const voices = AudioUtils.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith(lang === 'th' ? 'th' : 'zh')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      AudioUtils.speechSynthesis.speak(utterance);
      return true;
    } catch (error) {
      console.error('Error with speech synthesis:', error);
      return false;
    }
  },

  // Smart audio playback with backend TTS priority
  playAudio: async (text, audioUrl = null, lang = 'th') => {
    try {
      // Check cache first for backend generated audio
      const cacheKey = `${text}_${lang}`;
      const cachedUrl = AudioUtils.audioCache.get(cacheKey);
      if (cachedUrl) {
        const success = await AudioUtils.playAudioFile(cachedUrl);
        if (success) return true;
      }
      
      // Try to get stored audio from backend (prioritize local MP3 files)
      try {
        const cardId = `${text}_th`;
        const response = await fetch(`/api/audio/${encodeURIComponent(cardId)}/generated`);
        if (response.ok) {
          const audioData = await response.json();
          
          // Prioritize local MP3 file if available
          if (audioData.localUrl) {
            const localAudioUrl = `${window.location.origin}${audioData.localUrl}`;
            AudioUtils.audioCache.set(cacheKey, localAudioUrl);
            const success = await AudioUtils.playAudioFile(localAudioUrl);
            if (success) return true;
          }
          
          // Fallback to original URL
          if (audioData.audioUrl) {
            AudioUtils.audioCache.set(cacheKey, audioData.audioUrl);
            const success = await AudioUtils.playAudioFile(audioData.audioUrl);
            if (success) return true;
          }
        }
      } catch (error) {
        console.warn('Failed to get stored audio from backend:', error);
      }
      
      // Try provided audio URL
      if (audioUrl) {
        const success = await AudioUtils.playAudioFile(audioUrl);
        if (success) return true;
      }
      
      // Try backend TTS generation
      const generatedUrl = await AudioUtils.generateAudio(text, lang);
      if (generatedUrl) {
        const success = await AudioUtils.playAudioFile(generatedUrl);
        if (success) return true;
      }
      
      // Fallback to browser TTS
      return AudioUtils.speakText(text, lang);
    } catch (error) {
      console.error('Error playing audio:', error);
      return false;
    }
  },

  // Play both word and example sequentially with completion callback
  playSequential: async (word, example, lang = 'th', onComplete = null) => {
    try {
      // Play word first
      await AudioUtils.playAudio(word, null, lang);
      
      // Wait for word to finish, then play example
      return new Promise((resolve) => {
        const checkWordFinished = () => {
          if (!AudioUtils.currentAudio || AudioUtils.currentAudio.ended || AudioUtils.currentAudio.paused) {
            setTimeout(async () => {
              await AudioUtils.playAudio(example, null, lang);
              
              // Wait for example to finish with better detection
              const checkExampleFinished = () => {
                if (!AudioUtils.currentAudio || AudioUtils.currentAudio.ended || AudioUtils.currentAudio.paused) {
                  // Extra delay to ensure audio is truly finished
                  setTimeout(() => {
                    if (onComplete) onComplete();
                    resolve(true);
                  }, 800); // Longer delay to ensure completion
                } else {
                  setTimeout(checkExampleFinished, 200); // Check more frequently
                }
              };
              setTimeout(checkExampleFinished, 100); // Initial delay before checking
            }, 800); // Longer delay between word and example
          } else {
            setTimeout(checkWordFinished, 200); // Check more frequently
          }
        };
        setTimeout(checkWordFinished, 100); // Initial delay before checking
      });
    } catch (error) {
      console.error('Error playing sequential audio:', error);
      // Ensure callback is called even on error
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 1000);
      return false;
    }
  }
};

// Initialize on load
if (typeof window !== 'undefined') {
  AudioUtils.init();
}
