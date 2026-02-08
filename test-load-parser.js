try {
  console.log('Loading apiResponseParser...');
  const ApiResponseParser = require('./utils/apiResponseParser');
  console.log('Loaded successfully');
  console.log('Type:', typeof ApiResponseParser);
  console.log('Constructor name:', ApiResponseParser.constructor.name);
  console.log('Is function?:', typeof ApiResponseParser === 'function');
  console.log('Keys:', Object.keys(ApiResponseParser));
  console.log('Own property names:', Object.getOwnPropertyNames(ApiResponseParser));
  
  // Try to instantiate
  try {
    const instance = new ApiResponseParser();
    console.log('Instance created:', instance);
  } catch (e) {
    console.log('Cannot instantiate:', e.message);
  }
  
  // Check prototype
  console.log('Prototype:', ApiResponseParser.prototype);
  console.log('Prototype keys:', Object.keys(ApiResponseParser.prototype || {}));
  
} catch (error) {
  console.error('Error loading:', error);
  console.error('Stack:', error.stack);
}
