const mongoose = require('mongoose');

/**
 * Check database connection health
 * @returns {Object} Database health status
 */
const checkDatabaseHealth = () => {
  const state = mongoose.connection.readyState;
  
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  return {
    status: states[state] || 'unknown',
    connected: state === 1,
    host: mongoose.connection.host || 'N/A',
    name: mongoose.connection.name || 'N/A'
  };
};

module.exports = { checkDatabaseHealth };
