// Storage utilities for learning progress and user data
const StorageUtils = {
  // Progress tracking
  getProgress: (level) => {
    try {
      const key = `thai-progress-level-${level}`;
      const stored = localStorage.getItem(key);
      if (!stored) return { completed: [], timestamp: Date.now() };
      
      const data = JSON.parse(stored);
      // Check if data is older than 24 hours
      const isExpired = Date.now() - data.timestamp > 24 * 60 * 60 * 1000;
      if (isExpired) {
        localStorage.removeItem(key);
        return { completed: [], timestamp: Date.now() };
      }
      return data;
    } catch (error) {
      console.error('Error getting progress:', error);
      return { completed: [], timestamp: Date.now() };
    }
  },

  saveProgress: (level, completed) => {
    try {
      const key = `thai-progress-level-${level}`;
      const data = { completed, timestamp: Date.now() };
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  },

  markCardCompleted: (level, cardId) => {
    try {
      const progress = StorageUtils.getProgress(level);
      if (!progress.completed.includes(cardId)) {
        progress.completed.push(cardId);
        StorageUtils.saveProgress(level, progress.completed);
      }
    } catch (error) {
      console.error('Error marking card completed:', error);
    }
  },

  // Theme settings
  getTheme: () => {
    try {
      return localStorage.getItem('thai-app-theme') || 'light';
    } catch (error) {
      return 'light';
    }
  },

  saveTheme: (theme) => {
    try {
      localStorage.setItem('thai-app-theme', theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  },

  // User session
  isLoggedIn: () => {
    try {
      const session = localStorage.getItem('thai-app-session');
      if (!session) return false;
      const data = JSON.parse(session);
      return data.username === 'sanghak.kim' && Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000;
    } catch (error) {
      return false;
    }
  },

  login: (username, password) => {
    if (username === 'sanghak.kim' && password === 'Nopassw1') {
      const session = { username, timestamp: Date.now() };
      localStorage.setItem('thai-app-session', JSON.stringify(session));
      return true;
    }
    return false;
  },

  logout: () => {
    localStorage.removeItem('thai-app-session');
  }
};