function CourseSelection({ onStartLearning, onBrowseCards, onFileManagement }) {
  try {
    const [isDarkMode, setIsDarkMode] = React.useState(false);

    React.useEffect(() => {
      const savedTheme = localStorage.getItem('thai-app-theme');
      setIsDarkMode(savedTheme === 'dark');
    }, []);

    const toggleTheme = () => {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      document.body.className = newTheme ? 'dark' : 'light';
      localStorage.setItem('thai-app-theme', newTheme ? 'dark' : 'light');
    };

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900" data-name="course-selection" data-file="pages/CourseSelection.js">
        <Header 
          title="泰语学习卡片" 
          showThemeToggle={true}
          onToggleTheme={toggleTheme}
          isDarkMode={isDarkMode}
        />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              选择学习课程
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              智能化的泰语学习体验，通过交互式卡片学习日常泰语词汇和表达
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {Object.entries(MockData.courseInfo).map(([level, course]) => (
              <CourseCard
                key={level}
                level={parseInt(level)}
                course={course}
                onStartLearning={onStartLearning}
                onBrowseCards={onBrowseCards}
              />
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={onFileManagement}
              className="btn-primary"
            >
              <div className="flex items-center space-x-2">
                <div className="icon-settings text-lg"></div>
                <span>文件管理</span>
              </div>
            </button>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error('CourseSelection component error:', error);
    return null;
  }
}