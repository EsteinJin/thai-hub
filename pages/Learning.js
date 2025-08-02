function Learning({ level, onBack, onToggleTheme, isDarkMode }) {
  try {
    const [cards, setCards] = React.useState([]);
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [showHelp, setShowHelp] = React.useState(false);
    const [progress, setProgress] = React.useState({ completed: [] });
    const [autoAdvance, setAutoAdvance] = React.useState(true);
    const [showCompletion, setShowCompletion] = React.useState(false);

    // Load cards and progress on mount
    React.useEffect(() => {
      const levelCards = MockData.getRandomCards(level, 10);
      setCards(levelCards);
      setProgress(StorageUtils.getProgress(level));
    }, [level]);

    // Keyboard shortcuts
    React.useEffect(() => {
      const handleKeyPress = (e) => {
        switch (e.key.toLowerCase()) {
          case ' ':
          case 'arrowright':
            e.preventDefault();
            nextCard();
            break;
          case 'arrowleft':
            e.preventDefault();
            prevCard();
            break;
          case 'c':
            markCompleted();
            break;
          case 'd':
            onToggleTheme();
            break;
          case 'h':
            setShowHelp(!showHelp);
            break;
          case 'a':
            setAutoAdvance(!autoAdvance);
            break;
        }
      };

      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentIndex, showHelp, autoAdvance, onToggleTheme]);

    // Touch/swipe navigation
    React.useEffect(() => {
      let startX = 0;
      let startY = 0;

      const handleTouchStart = (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      };

      const handleTouchEnd = (e) => {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = endY - startY;

        // Only trigger if horizontal swipe is greater than vertical
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
          if (deltaX > 0) {
            prevCard(); // Swipe right = previous card
          } else {
            nextCard(); // Swipe left = next card
          }
        }
      };

      document.addEventListener('touchstart', handleTouchStart);
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }, [currentIndex]);

    // Auto play audio and advance when card changes
    React.useEffect(() => {
      if (cards.length > 0 && cards[currentIndex]) {
        const timer = setTimeout(async () => {
          await AudioUtils.playSequential(
            cards[currentIndex].thai, 
            cards[currentIndex].example, 
            'th',
            () => {
              // Auto advance after audio finishes
              if (autoAdvance && currentIndex < cards.length - 1) {
                setTimeout(() => {
                  setCurrentIndex(prev => prev + 1);
                }, 200); // Faster interval between cards
              } else if (autoAdvance && currentIndex === cards.length - 1) {
                // All cards completed, show completion options
                setTimeout(() => {
                  setShowCompletion(true);
                }, 800);
              }
            }
          );
        }, 200); // Faster initial delay
        return () => clearTimeout(timer);
      }
    }, [currentIndex, cards, autoAdvance]);

    // Clean up audio on unmount
    React.useEffect(() => {
      return () => AudioUtils.stopCurrent();
    }, []);

    const nextCard = () => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    };

    const prevCard = () => {
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    };

    const markCompleted = () => {
      if (cards[currentIndex]) {
        StorageUtils.markCardCompleted(level, cards[currentIndex].id);
        setProgress(StorageUtils.getProgress(level));
      }
    };

    const currentCard = cards[currentIndex];
    const isCompleted = currentCard && progress.completed.includes(currentCard.id);

    if (cards.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="text-center">
            <div className="icon-loader text-4xl text-blue-500 mb-4 animate-spin"></div>
            <p className="text-slate-600 dark:text-slate-400">加载中...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 relative" data-name="learning" data-file="pages/Learning.js">
        <Header 
          title={`基础泰语 ${level}`}
          onBack={onBack}
          showThemeToggle={true}
          onToggleTheme={onToggleTheme}
          isDarkMode={isDarkMode}
        />

        <main className="flex flex-col items-center justify-center min-h-screen pt-16 px-4">
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center space-x-4 mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {currentIndex + 1} / {cards.length}
              </span>
              <button
                onClick={() => setAutoAdvance(!autoAdvance)}
                className={`text-xs px-2 py-1 rounded ${autoAdvance ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
              >
                {autoAdvance ? '自动翻页' : '手动翻页'}
              </button>
              {isCompleted && (
                <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                  <div className="icon-check-circle text-sm"></div>
                  <span className="text-sm">已完成</span>
                </div>
              )}
            </div>
            <div className="progress-bar w-64 mx-auto">
              <div 
                className="progress-fill"
                style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <LearningCard card={currentCard} />

          <div className="flex items-center space-x-4 mt-8">
            <button
              onClick={prevCard}
              disabled={currentIndex === 0}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="icon-chevron-left text-lg"></div>
            </button>

            <button
              onClick={markCompleted}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                isCompleted 
                  ? 'bg-green-600 text-white' 
                  : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className={`icon-${isCompleted ? 'check-circle' : 'circle'} text-lg`}></div>
                <span>{isCompleted ? '已完成' : '标记完成'}</span>
              </div>
            </button>

            <button
              onClick={nextCard}
              disabled={currentIndex === cards.length - 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="icon-chevron-right text-lg"></div>
            </button>
          </div>

          <button
            onClick={() => setShowHelp(!showHelp)}
            className="fixed bottom-6 right-6 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors"
            aria-label="帮助"
          >
            <div className="icon-help-circle text-xl"></div>
          </button>
        </main>

        {/* Completion Dialog */}
        {showCompletion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full">
              <div className="text-center mb-6">
                <div className="icon-check-circle text-4xl text-green-500 mb-4"></div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  学习完成！
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  恭喜您完成了这组{cards.length}张卡片的学习
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    const newCards = MockData.getRandomCards(level, 10);
                    setCards(newCards);
                    setCurrentIndex(0);
                    setShowCompletion(false);
                  }}
                  className="w-full btn-primary py-3"
                >
                  学习下一组10张卡片
                </button>
                <button
                  onClick={onBack}
                  className="w-full btn-secondary py-3"
                >
                  返回课程选择
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Help Panel */}
        {showHelp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  快捷键帮助
                </h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                >
                  <div className="icon-x text-xl text-slate-600 dark:text-slate-400"></div>
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">空格键 / → / 左滑</span>
                  <span className="text-slate-900 dark:text-white">下一张卡片</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">← / 右滑</span>
                  <span className="text-slate-900 dark:text-white">上一张卡片</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">C</span>
                  <span className="text-slate-900 dark:text-white">标记完成</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">D</span>
                  <span className="text-slate-900 dark:text-white">切换主题</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">A</span>
                  <span className="text-slate-900 dark:text-white">切换自动翻页</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">H</span>
                  <span className="text-slate-900 dark:text-white">显示/隐藏帮助</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Learning component error:', error);
    return null;
  }
}
