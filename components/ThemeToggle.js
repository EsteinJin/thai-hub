function ThemeToggle({ isDarkMode, onToggle }) {
  try {
    return (
      <button
        onClick={onToggle}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        aria-label={isDarkMode ? "切换到浅色模式" : "切换到深色模式"}
        data-name="theme-toggle"
        data-file="components/ThemeToggle.js"
      >
        {isDarkMode ? (
          <div className="icon-sun text-xl text-yellow-500"></div>
        ) : (
          <div className="icon-moon text-xl text-slate-600"></div>
        )}
      </button>
    );
  } catch (error) {
    console.error('ThemeToggle component error:', error);
    return null;
  }
}