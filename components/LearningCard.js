function LearningCard({ card, onAudio }) {
  try {
    const [isPlaying, setIsPlaying] = React.useState(false);

    const handleAudioPlay = async () => {
      if (isPlaying) return;
      
      setIsPlaying(true);
      try {
        await AudioUtils.playSequential(
          card.thai, 
          card.example, 
          'th',
          () => {
            // Audio playback completed
            setTimeout(() => setIsPlaying(false), 500);
          }
        );
      } catch (error) {
        console.error('Audio play error:', error);
        setTimeout(() => setIsPlaying(false), 500);
      }
    };

    return (
      <div 
        className="learning-card relative w-full max-w-2xl"
        data-name="learning-card"
        data-file="components/LearningCard.js"
      >
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-6">
          {/* Thai word section */}
          <div className="space-y-3">
            <h2 className="text-5xl font-bold text-slate-900 dark:text-white">
              {card.thai}
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              {card.pronunciation}
            </p>
            <p className="text-lg text-slate-700 dark:text-slate-300">
              {card.chinese}
            </p>
          </div>
          
          {/* Example section */}
          <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-6 w-full max-w-lg">
            <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">
              例句 Example
            </h4>
            <p className="text-lg text-slate-800 dark:text-slate-200 mb-2">
              {card.example}
            </p>
            <p className="text-base text-slate-600 dark:text-slate-400">
              {card.example_translation}
            </p>
          </div>
          
          {/* Audio control */}
          <button
            onClick={handleAudioPlay}
            disabled={isPlaying}
            className="flex items-center space-x-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className={`icon-${isPlaying ? 'loader animate-spin' : 'volume-2'} text-xl`}></div>
            <span className="text-lg font-medium">
              {isPlaying ? '播放中...' : '播放发音'}
            </span>
          </button>
        </div>
      </div>
    );
  } catch (error) {
    console.error('LearningCard component error:', error);
    return null;
  }
}
