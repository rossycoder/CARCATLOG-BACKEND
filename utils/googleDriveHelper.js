/**
 * Google Drive Image Helper
 * Converts Drive viewer links to direct download/thumbnail URLs
 */

/**
 * Convert Google Drive viewer link to direct image URL
 * 
 * Input:  https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * Output: https://drive.google.com/uc?export=view&id=FILE_ID
 * 
 * @param {string} driveUrl - Google Drive viewer URL
 * @returns {string} Direct image URL
 */
function convertDriveLinkToDirectURL(driveUrl) {
  if (!driveUrl || typeof driveUrl !== 'string') {
    return driveUrl;
  }

  // Check if it's a Google Drive link
  if (!driveUrl.includes('drive.google.com')) {
    return driveUrl; // Not a Drive link, return as-is
  }

  // Extract file ID from various Drive URL formats
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,  // /file/d/FILE_ID
    /id=([a-zA-Z0-9_-]+)/,           // ?id=FILE_ID
    /\/d\/([a-zA-Z0-9_-]+)/          // /d/FILE_ID
  ];

  let fileId = null;
  for (const pattern of patterns) {
    const match = driveUrl.match(pattern);
    if (match && match[1]) {
      fileId = match[1];
      break;
    }
  }

  if (!fileId) {
    console.warn('⚠️  Could not extract file ID from Drive URL:', driveUrl);
    return driveUrl; // Return original if we can't parse it
  }

  // Convert to direct image URL
  // This format works for public images and doesn't require authentication
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

/**
 * Get thumbnail URL from Google Drive file ID
 * @param {string} fileId - Google Drive file ID
 * @param {number} size - Thumbnail size (default: 800)
 * @returns {string} Thumbnail URL
 */
function getDriveThumbnailURL(fileId, size = 800) {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
}

/**
 * Check if URL is a Google Drive link
 * @param {string} url - URL to check
 * @returns {boolean} True if it's a Drive link
 */
function isDriveLink(url) {
  return url && typeof url === 'string' && url.includes('drive.google.com');
}

/**
 * Extract file ID from Google Drive URL
 * @param {string} driveUrl - Google Drive URL
 * @returns {string|null} File ID or null
 */
function extractDriveFileId(driveUrl) {
  if (!driveUrl || typeof driveUrl !== 'string') {
    return null;
  }

  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/
  ];

  for (const pattern of patterns) {
    const match = driveUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

module.exports = {
  convertDriveLinkToDirectURL,
  getDriveThumbnailURL,
  isDriveLink,
  extractDriveFileId
};
