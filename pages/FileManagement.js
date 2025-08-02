function FileManagement({ onBack }) {
  try {
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);
    const [selectedLevel, setSelectedLevel] = React.useState(1);
    const [cards, setCards] = React.useState([]);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedCards, setSelectedCards] = React.useState(new Set());
    const [uploadStatus, setUploadStatus] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [cardsPerPage] = React.useState(12);


    // Check login status on mount
    React.useEffect(() => {
      setIsLoggedIn(StorageUtils.isLoggedIn());
    }, []);

    // Load cards when level changes
    React.useEffect(() => {
      if (isLoggedIn) {
        const levelCards = MockData.getCardsByLevel(selectedLevel);
        setCards(levelCards);
        setSelectedCards(new Set());
        setCurrentPage(1);
      }
    }, [selectedLevel, isLoggedIn]);

    const handleLogin = () => {
      setIsLoggedIn(true);
    };

    const handleLogout = () => {
      StorageUtils.logout();
      setIsLoggedIn(false);
    };

    const handleFileUpload = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.cards && Array.isArray(data.cards)) {
            // Add new cards to existing mock data
            const newCards = data.cards.map((card, index) => ({
              ...card,
              id: Date.now() + index, // Generate unique IDs
              level: selectedLevel
            }));
            
            // Update mock data
            if (!MockData.cards[selectedLevel]) {
              MockData.cards[selectedLevel] = [];
            }
            MockData.cards[selectedLevel].push(...newCards);
            
            // Update course info total count
            MockData.courseInfo[selectedLevel].totalCards = MockData.cards[selectedLevel].length;
            
            // Refresh the cards display
            setCards(MockData.getCardsByLevel(selectedLevel));
            setSelectedCards(new Set());
            
            setUploadStatus(`成功上传 ${data.cards.length} 张卡片到级别 ${selectedLevel}`);
            setTimeout(() => setUploadStatus(''), 3000);
          } else {
            setUploadStatus('文件格式错误：缺少 cards 数组');
          }
        } catch (error) {
          setUploadStatus('文件解析失败：请检查JSON格式');
        }
      };
      reader.readAsText(file);
    };

    const filteredCards = cards.filter(card =>
      card.thai.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.chinese.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.pronunciation.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination logic
    const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
    const startIndex = (currentPage - 1) * cardsPerPage;
    const paginatedCards = filteredCards.slice(startIndex, startIndex + cardsPerPage);

    // Reset to first page when search changes
    React.useEffect(() => {
      setCurrentPage(1);
    }, [searchTerm]);

    const toggleCardSelection = (cardId) => {
      const newSelected = new Set(selectedCards);
      if (newSelected.has(cardId)) {
        newSelected.delete(cardId);
      } else {
        newSelected.add(cardId);
      }
      setSelectedCards(newSelected);
    };

    const selectAllCards = () => {
      setSelectedCards(new Set(paginatedCards.map(card => card.id)));
    };

    const selectAllFiltered = () => {
      setSelectedCards(new Set(filteredCards.map(card => card.id)));
    };

    const clearSelection = () => {
      setSelectedCards(new Set());
    };

    if (!isLoggedIn) {
      return React.createElement(LoginForm, { onLogin: handleLogin });
    }

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900" data-name="file-management" data-file="pages/FileManagement.js">
        <Header title="文件管理" onBack={onBack} />
        
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with logout */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              卡片管理系统
            </h2>
            <button
              onClick={handleLogout}
              className="btn-secondary text-sm"
            >
              <div className="flex items-center space-x-2">
                <div className="icon-log-out text-sm"></div>
                <span>退出登录</span>
              </div>
            </button>
          </div>

          {/* Upload Section */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                上传学习卡片
              </h3>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <p>上传JSON格式的卡片数据文件</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  选择级别
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(parseInt(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value={1}>基础泰语 1</option>
                  <option value={2}>基础泰语 2</option>
                  <option value={3}>基础泰语 3</option>
                  <option value={4}>基础泰语 4</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  上传JSON文件
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700"
                />
              </div>
            </div>

            {uploadStatus && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-sm text-green-600 dark:text-green-400">{uploadStatus}</p>
              </div>
            )}
          </div>

          {/* Card Management Section */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 space-y-4 md:space-y-0">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                级别 {selectedLevel} 卡片 (共{filteredCards.length}张，显示第{startIndex + 1}-{Math.min(startIndex + cardsPerPage, filteredCards.length)}张)
              </h3>
              
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="搜索卡片..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
                
                <div className="flex space-x-2">
                  <button onClick={selectAllCards} className="btn-secondary text-sm">
                    选择当前页
                  </button>
                  <button onClick={selectAllFiltered} className="btn-secondary text-sm">
                    选择全部
                  </button>
                  <button onClick={clearSelection} className="btn-secondary text-sm">
                    清除
                  </button>
                </div>
              </div>
            </div>

            {selectedCards.size > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                  已选择 {selectedCards.size} 张卡片
                </p>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={async () => {
                      setUploadStatus('正在生成音频...');
                      const selectedCardList = cards.filter(card => selectedCards.has(card.id));
                      for (const card of selectedCardList) {
                        await AudioUtils.generateAudio(card.thai, 'th');
                        await AudioUtils.generateAudio(card.example, 'th');
                      }
                      setUploadStatus(`已为 ${selectedCards.size} 张卡片生成音频`);
                      setTimeout(() => setUploadStatus(''), 3000);
                    }}
                    className="btn-primary text-sm py-1 px-3"
                  >
                    生成音频
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm(`确定要删除选中的 ${selectedCards.size} 张卡片吗？`)) {
                        // Remove selected cards from mock data
                        MockData.cards[selectedLevel] = MockData.cards[selectedLevel].filter(
                          card => !selectedCards.has(card.id)
                        );
                        
                        // Update course info total count
                        MockData.courseInfo[selectedLevel].totalCards = MockData.cards[selectedLevel].length;
                        
                        // Refresh the display
                        setCards(MockData.getCardsByLevel(selectedLevel));
                        setSelectedCards(new Set());
                        setUploadStatus(`成功删除 ${selectedCards.size} 张卡片`);
                        setTimeout(() => setUploadStatus(''), 3000);
                      }
                    }}
                    className="btn-secondary text-sm py-1 px-3"
                  >
                    批量删除
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {paginatedCards.map((card) => (
                <div
                  key={card.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedCards.has(card.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                  onClick={() => toggleCardSelection(card.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      {card.thai}
                    </h4>
                    <div className={`w-4 h-4 rounded border-2 ${
                      selectedCards.has(card.id)
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {selectedCards.has(card.id) && (
                        <div className="icon-check text-xs text-white"></div>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">
                    {card.chinese}
                  </p>
                  <p className="text-slate-500 dark:text-slate-500 text-xs">
                    {card.pronunciation}
                  </p>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-4 mb-6">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="icon-chevron-left text-sm"></div>
                </button>
                
                <div className="flex space-x-2">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded text-sm ${
                          currentPage === pageNum
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="icon-chevron-right text-sm"></div>
                </button>
              </div>
            )}

            {filteredCards.length === 0 && (
              <div className="text-center py-8">
                <div className="icon-inbox text-4xl text-slate-400 mb-2"></div>
                <p className="text-slate-600 dark:text-slate-400">
                  {searchTerm ? '没有找到匹配的卡片' : '该级别暂无卡片'}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error('FileManagement component error:', error);
    return null;
  }
}