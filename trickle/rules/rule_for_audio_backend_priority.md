When implementing audio playbook functionality
- Always prioritize backend generated audio from cache before attempting new generation
- Use SoundOfText API for high-quality Thai language pronunciation
- Implement completion callbacks for sequential audio playback
- Auto-advance functionality should trigger only after audio playback completion
- Cache generated audio URLs to avoid repeated API calls
- Fallback to browser TTS only when backend audio generation fails