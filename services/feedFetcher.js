const axios = require('axios');
const xml2js = require('xml2js');
const Papa = require('papaparse');

class FeedFetcher {
  constructor() {
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Convert common URLs to raw content URLs
   */
  convertToRawUrl(url) {
    try {
      const urlObj = new URL(url);
      
      // GitHub file URLs (convert to raw.githubusercontent.com)
      if (urlObj.hostname === 'github.com' && urlObj.pathname.includes('/blob/')) {
        const rawPath = urlObj.pathname.replace('/blob/', '/');
        return `https://raw.githubusercontent.com${rawPath}`;
      }
      
      // GitHub Gist URLs (convert to raw)
      if (urlObj.hostname === 'gist.github.com') {
        // If already raw, return as-is
        if (urlObj.hostname === 'gist.githubusercontent.com') {
          return url;
        }
        
        // Handle fragment-based URLs like #file-test-feed-xml/raw
        if (urlObj.hash && urlObj.hash.includes('/raw')) {
          // Extract the raw part: #file-test-feed-xml/raw -> /raw
          const rawPart = urlObj.hash.split('/raw')[0].replace('#file-', '');
          // Construct proper raw URL
          const gistId = urlObj.pathname.replace('/', '');
          return `https://gist.githubusercontent.com/${urlObj.pathname}/raw/${rawPart}`;
        }
        
        // Try to convert gist URL to raw
        if (!url.endsWith('/raw')) {
          return `${url}/raw`;
        }
      }
      
      // Pastebin URLs (convert to raw)
      if (urlObj.hostname === 'pastebin.com' && !urlObj.pathname.startsWith('/raw/')) {
        const pasteId = urlObj.pathname.replace('/', '');
        return `https://pastebin.com/raw/${pasteId}`;
      }
      
      // Google Drive share links (convert to direct download)
      if (urlObj.hostname === 'drive.google.com' && url.includes('/file/d/')) {
        const fileIdMatch = url.match(/\/file\/d\/([^\/]+)/);
        if (fileIdMatch) {
          return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
        }
      }
      
      // Dropbox share links (convert to direct download)
      if (urlObj.hostname.includes('dropbox.com') && url.includes('dl=0')) {
        return url.replace('dl=0', 'dl=1');
      }
      
      return url; // Return original if no conversion needed
    } catch (error) {
      return url; // Return original if URL parsing fails
    }
  }

  /**
   * Check if response is HTML instead of feed data
   */
  isHtmlResponse(data, contentType) {
    const dataStr = typeof data === 'string' ? data.trim() : '';
    const isHtmlContentType = contentType && contentType.toLowerCase().includes('text/html');
    const startsWithHtml = dataStr.toLowerCase().startsWith('<!doctype html') || 
                          dataStr.toLowerCase().startsWith('<html');
    return isHtmlContentType || startsWithHtml;
  }

  /**
   * Fetch feed from URL
   */
  async fetchFeed(url) {
    try {
      // ═══════════════════════════════════════════════════════════════════════
      // 🧪 TESTING MODE: Support local file:// URLs for development
      // ═══════════════════════════════════════════════════════════════════════
      if (url.startsWith('file://')) {
        console.log('🧪 [Testing Mode] Loading local file:', url);
        const fs = require('fs');
        const path = require('path');
        
        // Convert file:// URL to local path (handle both Windows and Unix)
        let filePath = url.replace('file:///', '').replace('file://', '');
        
        // Handle Windows paths (C:/ format)
        if (process.platform === 'win32' && filePath.match(/^[a-zA-Z]:\//)) {
          // Path is already correct: C:/Users/...
        } else if (process.platform === 'win32' && !path.isAbsolute(filePath)) {
          // Relative path - resolve from current directory
          filePath = path.resolve(process.cwd(), filePath);
        }
        
        console.log('📂 Reading file from:', filePath);
        
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          console.log(`✅ File loaded successfully (${content.length} bytes)`);
          
          return {
            success: true,
            data: content,
            contentType: 'text/xml', // Assume XML for local files
            status: 200
          };
        } catch (fileError) {
          console.error('❌ File read error:', fileError.message);
          return {
            success: false,
            error: `Cannot read local file: ${fileError.message}. Try uploading the feed to GitHub Gist, Pastebin, or use an HTTP URL instead.`
          };
        }
      }
      
      // ═══════════════════════════════════════════════════════════════════════
      // 🌐 PRODUCTION MODE: Fetch from HTTP/HTTPS URL
      // ═══════════════════════════════════════════════════════════════════════
      
      // Try to convert URL to raw format first
      const rawUrl = this.convertToRawUrl(url);
      let urlUsed = rawUrl !== url ? rawUrl : url;
      
      // 🔥 Add cache-busting timestamp parameter
      const cacheBuster = `_t=${Date.now()}`;
      urlUsed = urlUsed.includes('?') ? `${urlUsed}&${cacheBuster}` : `${urlUsed}?${cacheBuster}`;
      
      console.log(`Fetching feed from: ${urlUsed.split('?')[0]}`); // Log without timestamp
      if (rawUrl !== url) {
        console.log(`  (converted from: ${url})`);
      }

      const response = await axios.get(urlUsed, {
        timeout: this.timeout,
        maxContentLength: 50 * 1024 * 1024, // 50MB max
        headers: {
          'User-Agent': 'CarCatalog Stock Feed Importer/1.0'
        }
      });

      const contentType = response.headers['content-type'];
      
      // Check if we got HTML instead of feed data
      if (this.isHtmlResponse(response.data, contentType)) {
        let errorMsg = 'Received HTML page instead of feed data. ';
        
        // Provide helpful guidance
        if (url.includes('github.com')) {
          errorMsg += 'For GitHub files, use the "Raw" button URL (raw.githubusercontent.com).';
        } else if (url.includes('gist.github.com')) {
          errorMsg += 'For GitHub Gists, click "Raw" and use that URL.';
        } else if (url.includes('pastebin.com')) {
          errorMsg += 'For Pastebin, use the "raw" link URL.';
        } else if (url.includes('drive.google.com')) {
          errorMsg += 'For Google Drive, ensure the file has public access and use a direct download link.';
        } else {
          errorMsg += 'Please ensure the URL points directly to the XML/CSV/JSON file, not a webpage.';
        }
        
        return {
          success: false,
          error: errorMsg
        };
      }

      return {
        success: true,
        data: response.data,
        contentType: contentType,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.response?.status
      };
    }
  }

  /**
   * Detect feed format automatically
   * Strips BOM before detection to handle Excel exports
   */
  detectFormat(data, contentType) {
    // Log for debugging
    console.log('Content-Type:', contentType);
    let dataStr = typeof data === 'string' ? data.trim() : JSON.stringify(data);
    dataStr = dataStr.replace(/^\uFEFF/, ''); // Strip BOM (Byte Order Mark) common in Excel/Windows exports
    console.log('Data preview (first 200 chars):', dataStr.substring(0, 200));
    
    // PRIORITY 1: Check actual data structure (most reliable)
    const start = dataStr.substring(0, 100).toLowerCase();
    
    // XML detection (check first 100 chars)
    // Check for XML declaration OR any valid XML opening tag
    // Match pattern: starts with < followed by a letter/word and then > or space
    if (start.includes('<?xml') || 
        (start.startsWith('<') && /^<[a-z_][a-z0-9_-]*[\s>]/i.test(start))) {
      return 'xml';
    }

    // JSON detection - Check if data starts with JSON markers
    if (dataStr.startsWith('{') || dataStr.startsWith('[')) {
      try {
        // Try to parse as JSON to confirm
        JSON.parse(dataStr);
        return 'json';
      } catch (e) {
        // JSON structure detected but invalid - throw descriptive error
        console.error('❌ JSON parsing failed:', e.message);
        throw new Error(`Invalid JSON format: ${e.message}. Please check your feed data for syntax errors (missing values, trailing commas, etc.)`);
      }
    }

    // PRIORITY 2: Check content type header (less reliable for text/plain)
    if (contentType) {
      const ct = contentType.toLowerCase();
      if (ct.includes('xml') || ct.includes('application/xml') || ct.includes('text/xml')) return 'xml';
      if (ct.includes('json') || ct.includes('application/json')) return 'json';
      if (ct.includes('csv') || ct.includes('text/csv')) return 'csv';
    }

    // PRIORITY 3: CSV detection (only if not JSON/XML)
    const lines = dataStr.split('\n').filter(line => line.trim());
    if (lines.length > 1) {
      const firstLine = lines[0];
      const secondLine = lines[1];
      
      // Check if first line looks like CSV headers
      const hasCommas = firstLine.includes(',');
      const commonHeaders = ['make', 'model', 'price', 'year', 'stock', 'registration', 'reg'];
      const hasCommonHeaders = commonHeaders.some(header => 
        firstLine.toLowerCase().includes(header)
      );
      
      console.log('CSV detection - hasCommas:', hasCommas, 'hasCommonHeaders:', hasCommonHeaders);
      
      if (hasCommas && (hasCommonHeaders || secondLine.includes(','))) {
        return 'csv';
      }
    }

    console.log('Format detection failed - returning unknown');
    return 'unknown';
  }

  /**
   * Parse feed based on format
   */
  async parseFeed(data, format) {
    try {
      switch (format) {
        case 'xml':
          return await this.parseXML(data);
        case 'json':
          return this.parseJSON(data);
        case 'csv':
          return this.parseCSV(data);
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      throw new Error(`Failed to parse feed: ${error.message}`);
    }
  }

  /**
   * Parse XML feed with namespace support and BOM handling
   * Handles namespace prefixes (ns:vehicle) and BOM characters
   */
  async parseXML(data) {
    const { stripPrefix } = xml2js.processors;
    const xmlString = typeof data === 'string' ? data.replace(/^\uFEFF/, '') : data;
    
    const parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true,
      trim: true,
      strict: false,
      attrValueProcessors: [(value) => value || ''],
      tagNameProcessors: [stripPrefix, (name) => name.toLowerCase()] // Strips "ns:" prefixes + lowercases
    });

    try {
      return await parser.parseStringPromise(xmlString);
    } catch (error) {
      throw new Error(`XML parsing failed: ${error.message}`);
    }
  }

  /**
   * Parse JSON feed
   */
  parseJSON(data) {
    if (typeof data === 'string') {
      return JSON.parse(data);
    }
    return data;
  }

  /**
   * Parse CSV feed with intelligent delimiter detection
   * Handles BOM, semicolon, tab, pipe delimiters common in European/legacy systems
   */
  parseCSV(data) {
    try {
      let csvString = typeof data === 'string' ? data : String(data);
      csvString = csvString.replace(/^\uFEFF/, ''); // Strip BOM (common in Excel exports)
      
      const baseOptions = {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: (header) => header.trim(),
        newline: '',
        quoteChar: '"',
        escapeChar: '"'
      };
      
      let result = Papa.parse(csvString, { ...baseOptions, delimiter: '' }); // Auto-detect first
      
      // If auto-detect produced single-column rows, it likely picked the wrong
      // delimiter — manually test common alternatives and keep the best one
      const firstRowKeys = result.data?.[0] ? Object.keys(result.data[0]) : [];
      if (firstRowKeys.length <= 1) {
        let bestColumnCount = firstRowKeys.length;
        for (const delim of [',', ';', '\t', '|']) {
          const attempt = Papa.parse(csvString, { ...baseOptions, delimiter: delim });
          const cols = attempt.data?.[0] ? Object.keys(attempt.data[0]).length : 0;
          if (cols > bestColumnCount) {
            bestColumnCount = cols;
            result = attempt;
          }
        }
      }
      
      if (result.errors && result.errors.length > 0) {
        const criticalErrors = result.errors.filter(e => e.type !== 'Quotes');
        if (criticalErrors.length > 0) {
          throw new Error(`CSV parsing errors: ${JSON.stringify(criticalErrors.slice(0, 3))}`);
        }
      }
      
      if (!result.data || result.data.length === 0) {
        throw new Error('No data found in CSV file');
      }
      
      return result.data;
    } catch (error) {
      throw new Error(`CSV parsing failed: ${error.message}`);
    }
  }

  /**
   * Test feed connection and return preview
   */
  async testFeed(url) {
    const startTime = Date.now();

    // Fetch feed
    const fetchResult = await this.fetchFeed(url);
    if (!fetchResult.success) {
      return {
        success: false,
        error: fetchResult.error,
        status: fetchResult.status
      };
    }

    // Detect format
    const format = this.detectFormat(fetchResult.data, fetchResult.contentType);
    if (format === 'unknown') {
      return {
        success: false,
        error: 'Could not detect feed format (XML, JSON, or CSV expected)'
      };
    }

    // Parse feed
    try {
      const parsedData = await this.parseFeed(fetchResult.data, format);
      
      const duration = Date.now() - startTime;

      return {
        success: true,
        format,
        duration,
        preview: parsedData,
        message: 'Feed successfully fetched and parsed'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        format
      };
    }
  }
}

module.exports = new FeedFetcher();
