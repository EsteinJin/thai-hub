function Header({ title, onBack, showThemeToggle = false, onToggleTheme, isDarkMode }) {
  try {
    return (
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10" data-name="header" data-file="components/Header.js">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="返回"
                >
                  <div className="icon-arrow-left text-xl text-slate-600 dark:text-slate-300"></div>
                </button>
              )}
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {title}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {showThemeToggle && (
                <ThemeToggle isDarkMode={isDarkMode} onToggle={onToggleTheme} />
              )}
            </div>
          </div>
        </div>
      </header>
    );
  } catch (error) {
    console.error('Header component error:', error);
    return null;
  }
}