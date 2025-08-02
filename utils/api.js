// API utilities for backend communication
const ApiUtils = {
  baseUrl: window.location.origin,

  // Generic API request function
  request: async (endpoint, options = {}) => {
    try {
      const url = `${ApiUtils.baseUrl}/api${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },

  // Get cards for a specific level
  getCards: async (level) => {
    try {
      const data = await ApiUtils.request(`/cards/${level}`);
      return data.cards || [];
    } catch (error) {
      console.error(`Failed to get cards for level ${level}:`, error);
      // Fallback to mock data if API fails
      return MockData.getCardsByLevel(level);
    }
  },

  // Save cards for a specific level
  saveCards: async (level, cards) => {
    try {
      return await ApiUtils.request(`/cards/${level}`, {
        method: 'POST',
        body: JSON.stringify({ cards })
      });
    } catch (error) {
      console.error(`Failed to save cards for level ${level}:`, error);
      throw error;
    }
  },

  // Upload new cards to a level
  uploadCards: async (level, cards) => {
    try {
      return await ApiUtils.request(`/cards/${level}/upload`, {
        method: 'POST',
        body: JSON.stringify({ cards })
      });
    } catch (error) {
      console.error(`Failed to upload cards to level ${level}:`, error);
      throw error;
    }
  },

  // Delete a specific card
  deleteCard: async (level, cardId) => {
    try {
      return await ApiUtils.request(`/cards/${level}/${cardId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error(`Failed to delete card ${cardId} from level ${level}:`, error);
      throw error;
    }
  },

  // Get backup of all data
  getBackup: async () => {
    try {
      return await ApiUtils.request('/backup');
    } catch (error) {
      console.error('Failed to get backup:', error);
      throw error;
    }
  },

  // Check if backend is available
  checkBackend: async () => {
    try {
      await ApiUtils.request('/cards/1');
      return true;
    } catch (error) {
      console.warn('Backend not available, using mock data');
      return false;
    }
  }
};