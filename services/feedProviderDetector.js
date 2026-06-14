/**
 * Detect feed provider based on structure and patterns
 */
class FeedProviderDetector {
  
  /**
   * Detect provider from parsed feed data
   */
  detect(parsedData, format) {
    const detectors = [
      this.detectMotorDesk.bind(this),
      this.detectDragon2000.bind(this),
      this.detectClickDealer.bind(this),
      this.detectDealerWeb.bind(this),
      this.detectCodeweavers.bind(this),
      this.detectGForces.bind(this),
      this.detectSpidersnet.bind(this),
      this.detect67Degrees.bind(this),
      this.detectBlueskyInteractive.bind(this),
      this.detectAutoManager.bind(this),
      this.detectCarDealer5.bind(this),
      this.detectAutoEdit.bind(this)
    ];

    for (const detector of detectors) {
      const result = detector(parsedData, format);
      if (result) {
        return result;
      }
    }

    return 'generic';
  }

  /**
   * MotorDesk detection
   */
  detectMotorDesk(data, format) {
    if (format === 'xml') {
      const dataStr = JSON.stringify(data).toLowerCase();
      if (dataStr.includes('motordesk') || 
          (data.vehicles?.vehicle && data.vehicles.vehicle[0]?.stocknumber)) {
        return 'MotorDesk';
      }
    }
    return null;
  }

  /**
   * Dragon2000 detection
   */
  detectDragon2000(data, format) {
    if (format === 'xml') {
      const dataStr = JSON.stringify(data).toLowerCase();
      if (dataStr.includes('dragon2000') || dataStr.includes('dragon-2000')) {
        return 'Dragon2000';
      }
    }
    return null;
  }

  /**
   * Click Dealer detection
   */
  detectClickDealer(data, format) {
    if (format === 'xml') {
      const dataStr = JSON.stringify(data).toLowerCase();
      if (dataStr.includes('clickdealer') || dataStr.includes('click-dealer')) {
        return 'ClickDealer';
      }
    }
    return null;
  }

  /**
   * DealerWeb detection
   */
  detectDealerWeb(data, format) {
    if (format === 'xml') {
      const dataStr = JSON.stringify(data).toLowerCase();
      if (dataStr.includes('dealerweb') || dataStr.includes('dealer-web')) {
        return 'DealerWeb';
      }
    }
    return null;
  }

  /**
   * Codeweavers detection
   */
  detectCodeweavers(data, format) {
    if (format === 'xml') {
      const dataStr = JSON.stringify(data).toLowerCase();
      if (dataStr.includes('codeweavers') || dataStr.includes('code-weavers')) {
        return 'Codeweavers';
      }
    }
    return null;
  }

  /**
   * GForces detection
   */
  detectGForces(data, format) {
    if (format === 'xml') {
      const dataStr = JSON.stringify(data).toLowerCase();
      if (dataStr.includes('gforces') || dataStr.includes('g-forces')) {
        return 'GForces';
      }
    }
    return null;
  }

  /**
   * Spidersnet detection
   */
  detectSpidersnet(data, format) {
    if (format === 'xml') {
      const dataStr = JSON.stringify(data).toLowerCase();
      if (dataStr.includes('spidersnet') || dataStr.includes('spiders-net')) {
        return 'Spidersnet';
      }
    }
    return null;
  }

  /**
   * 67 Degrees detection
   */
  detect67Degrees(data, format) {
    if (format === 'xml') {
      const dataStr = JSON.stringify(data).toLowerCase();
      if (dataStr.includes('67degrees') || dataStr.includes('67-degrees')) {
        return '67Degrees';
      }
    }
    return null;
  }

  /**
   * Bluesky Interactive detection
   */
  detectBlueskyInteractive(data, format) {
    if (format === 'xml') {
      const dataStr = JSON.stringify(data).toLowerCase();
      if (dataStr.includes('bluesky') || dataStr.includes('blue-sky')) {
        return 'BlueskyInteractive';
      }
    }
    return null;
  }

  /**
   * AutoManager detection
   */
  detectAutoManager(data, format) {
    if (format === 'xml') {
      const dataStr = JSON.stringify(data).toLowerCase();
      if (dataStr.includes('automanager') || dataStr.includes('auto-manager')) {
        return 'AutoManager';
      }
    }
    return null;
  }

  /**
   * Car Dealer 5 detection
   */
  detectCarDealer5(data, format) {
    if (format === 'xml') {
      const dataStr = JSON.stringify(data).toLowerCase();
      if (dataStr.includes('cardealer5') || dataStr.includes('car-dealer-5')) {
        return 'CarDealer5';
      }
    }
    return null;
  }

  /**
   * AutoEdit detection
   */
  detectAutoEdit(data, format) {
    if (format === 'xml') {
      const dataStr = JSON.stringify(data).toLowerCase();
      if (dataStr.includes('autoedit') || dataStr.includes('auto-edit')) {
        return 'AutoEdit';
      }
    }
    return null;
  }
}

module.exports = new FeedProviderDetector();
