function CardBrowser({ level, onBack }) {
  try {
    const [cards, setCards] = React.useState([]);
    const [selectedCard, setSelectedCard] = React.useState(null);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [cardsPerPage] = React.useState(9);

    React.useEffect(() => {
      const levelCards = MockData.getCardsByLevel(level);
      setCards(levelCards);
    }, [level]);

    // Pagination logic for lazy loading
    const totalPages = Math.ceil(cards.length / cardsPerPage);
    const startIndex = (currentPage - 1) * cardsPerPage;
    const paginatedCards = cards.slice(startIndex, startIndex + cardsPerPage);

    const handleCardClick = (card) => {
      setSelectedCard(card);
      AudioUtils.playSequential(card.thai, card.example, 'th');
    };

    const closeModal = () => {
      setSelectedCard(null);
      AudioUtils.stopCurrent();
    };

    // Handle click outside modal to close
    const handleModalClick = (e) => {
      if (e.target === e.currentTarget) {
        closeModal();
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900" data-name="card-browser" data-file="pages/CardBrowser.js">
        <Header 
          title={`浏览卡片 - 基础泰语 ${level}`}
          onBack={onBack}
        />
        
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {cards.length === 0 ? (
            <div className="text-center py-12">
              <div className="icon-book-open text-4xl text-slate-400 mb-4"></div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                暂无卡片
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                该级别还没有学习卡片
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  基础泰语 {level}
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  共 {cards.length} 张卡片，显示第 {startIndex + 1}-{Math.min(startIndex + cardsPerPage, cards.length)} 张
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {paginatedCards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => handleCardClick(card)}
                    className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-700 cursor-pointer hover:scale-105"
                  >
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        {card.thai}
                      </h3>
                      <p className="text-lg text-slate-600 dark:text-slate-400 mb-2">
                        {card.chinese}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">
                        {card.pronunciation}
                      </p>
                      <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                        <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                          {card.example}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="icon-chevron-left text-lg"></div>
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      第 {currentPage} 页，共 {totalPages} 页
                    </span>
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="icon-chevron-right text-lg"></div>
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        {/* Card Detail Modal */}
        {selectedCard && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleModalClick}
          >
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                  {selectedCard.thai}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  <div className="icon-x text-xl text-slate-600 dark:text-slate-400"></div>
                </button>
              </div>

              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-xl text-slate-600 dark:text-slate-400 mb-2">
                    {selectedCard.pronunciation}
                  </p>
                  <p className="text-lg text-slate-700 dark:text-slate-300">
                    {selectedCard.chinese}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                    例句 Example
                  </h4>
                  <p className="text-lg text-slate-800 dark:text-slate-200 mb-2">
                    {selectedCard.example}
                  </p>
                  <p className="text-base text-slate-600 dark:text-slate-400">
                    {selectedCard.example_translation}
                  </p>
                </div>

                <div className="flex flex-col space-y-3">
                  <button
                    onClick={() => AudioUtils.playSequential(selectedCard.thai, selectedCard.example, 'th')}
                    className="btn-primary w-full py-3"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <div className="icon-volume-2 text-lg"></div>
                      <span>播放单词和例句</span>
                    </div>
                  </button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => AudioUtils.playAudio(selectedCard.thai, null, 'th')}
                      className="btn-secondary py-2"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <div className="icon-volume-2 text-sm"></div>
                        <span>单词发音</span>
                      </div>
                    </button>
                    <button
                      onClick={() => AudioUtils.playAudio(selectedCard.example, null, 'th')}
                      className="btn-secondary py-2"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <div className="icon-volume-2 text-sm"></div>
                        <span>例句发音</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('CardBrowser component error:', error);
    return null;
  }
}