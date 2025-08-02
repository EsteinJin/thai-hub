class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">出现错误</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">很抱歉，发生了意外错误。</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              重新加载页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  try {
    const [currentPage, setCurrentPage] = React.useState('home');
    const [selectedLevel, setSelectedLevel] = React.useState(1);
    const [isDarkMode, setIsDarkMode] = React.useState(false);

    // Initialize theme from localStorage
    React.useEffect(() => {
      const savedTheme = localStorage.getItem('thai-app-theme');
      if (savedTheme === 'dark') {
        setIsDarkMode(true);
        document.body.className = 'dark';
      } else {
        setIsDarkMode(false);
        document.body.className = 'light';
      }
    }, []);

    // Handle theme toggle
    const toggleTheme = React.useCallback(() => {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      document.body.className = newTheme ? 'dark' : 'light';
      localStorage.setItem('thai-app-theme', newTheme ? 'dark' : 'light');
    }, [isDarkMode]);

    // Handle navigation
    const navigateTo = React.useCallback((page, level = null) => {
      setCurrentPage(page);
      if (level !== null) {
        setSelectedLevel(level);
      }
    }, []);

    // Render current page
    const renderCurrentPage = () => {
      switch (currentPage) {
        case 'learning':
          return React.createElement(Learning, {
            level: selectedLevel,
            onBack: () => navigateTo('home'),
            onToggleTheme: toggleTheme,
            isDarkMode
          });
        case 'browser':
          return React.createElement(CardBrowser, {
            level: selectedLevel,
            onBack: () => navigateTo('home')
          });
        case 'file-management':
          return React.createElement(FileManagement, {
            onBack: () => navigateTo('home')
          });
        default:
          return React.createElement(CourseSelection, {
            onStartLearning: (level) => navigateTo('learning', level),
            onBrowseCards: (level) => navigateTo('browser', level),
            onFileManagement: () => navigateTo('file-management')
          });
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300" data-name="app" data-file="app.js">
        {renderCurrentPage()}
      </div>
    );
  } catch (error) {
    console.error('App component error:', error);
    return null;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);