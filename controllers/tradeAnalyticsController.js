const Car = require('../models/Car');

/**
 * Get analytics data for a dealer
 * GET /api/trade/analytics?timeRange=30days
 */
exports.getAnalytics = async (req, res) => {
  try {
    const { timeRange = '30days' } = req.query;
    const dealerId = req.dealerId;

    console.log('[Analytics Controller] Fetching analytics for dealer:', dealerId);
    console.log('[Analytics Controller] Time range:', timeRange);

    if (!dealerId) {
      console.error('[Analytics Controller] No dealerId found in request');
      return res.status(400).json({
        success: false,
        message: 'Dealer ID not found'
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get all dealer listings (not filtered by date - we'll show all listings)
    console.log('[Analytics Controller] Querying listings with dealerId:', dealerId);
    const listings = await Car.find({
      dealerId,
      isDealerListing: true
    });

    console.log('[Analytics Controller] Found', listings.length, 'listings');

    if (listings.length === 0) {
      console.log('[Analytics Controller] No listings found, returning empty analytics');
      return res.json({
        success: true,
        data: {
          overview: {
            totalViews: 0,
            totalInquiries: 0,
            conversionRate: 0,
            avgTimeToSell: 0,
            activeListings: 0,
            soldThisMonth: 0
          },
          topPerformers: [],
          viewsByDay: [],
          inquiriesBySource: [],
          priceRangePerformance: []
        }
      });
    }

    // Calculate overview statistics
    const totalViews = listings.reduce((sum, car) => sum + (car.viewCount || 0), 0);
    const totalInquiries = listings.reduce((sum, car) => sum + (car.inquiryCount || 0), 0);
    const conversionRate = totalViews > 0 ? parseFloat(((totalInquiries / totalViews) * 100).toFixed(1)) : 0;

    console.log('[Analytics Controller] Overview stats:', {
      totalViews,
      totalInquiries,
      conversionRate: `${conversionRate}%`
    });

    // Calculate average time to sell
    const soldListings = listings.filter(car => car.advertStatus === 'sold' && car.soldAt);
    let avgTimeToSell = 0;
    if (soldListings.length > 0) {
      const totalDays = soldListings.reduce((sum, car) => {
        // Use publishedAt if available, otherwise use createdAt as fallback
        const startDate = car.publishedAt || car.createdAt;
        const days = Math.floor((car.soldAt - startDate) / (1000 * 60 * 60 * 24));
        return sum + (days > 0 ? days : 0); // Ensure non-negative days
      }, 0);
      avgTimeToSell = soldListings.length > 0 ? Math.round(totalDays / soldListings.length) : 0;
    }

    console.log('[Analytics Controller] Avg time to sell:', {
      soldListingsCount: soldListings.length,
      avgTimeToSell: `${avgTimeToSell} days`
    });

    // Count active and sold listings
    const activeListings = listings.filter(car => car.advertStatus === 'active').length;
    
    // Count vehicles sold THIS MONTH (not all sold vehicles)
    // Use existing 'now' variable from line 24
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const soldThisMonth = listings.filter(car => {
      return car.advertStatus === 'sold' && 
             car.soldAt && 
             new Date(car.soldAt) >= firstDayOfMonth;
    }).length;

    console.log('[Analytics Controller] Sold this month:', {
      soldThisMonth,
      firstDayOfMonth: firstDayOfMonth.toISOString(),
      currentDate: now.toISOString()
    });

    // Get top performers (sorted by view count)
    const topPerformers = listings
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 5)
      .map(car => ({
        id: car._id,
        make: car.make,
        model: car.model,
        year: car.year,
        views: car.viewCount || 0,
        inquiries: car.inquiryCount || 0,
        price: car.price
      }));

    // Calculate views by day
    const viewsByDay = calculateViewsByDay(listings, startDate, now);

    // Calculate inquiry sources (placeholder - will be enhanced with Inquiry model)
    const inquiriesBySource = calculateInquiriesBySource(listings);

    // Calculate price range performance
    const priceRangePerformance = calculatePriceRangePerformance(listings);

    res.json({
      success: true,
      data: {
        overview: {
          totalViews,
          totalInquiries,
          conversionRate: parseFloat(conversionRate),
          avgTimeToSell,
          activeListings,
          soldThisMonth
        },
        topPerformers,
        viewsByDay,
        inquiriesBySource,
        priceRangePerformance
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
};

/**
 * Calculate views by day for the time range
 */
function calculateViewsByDay(listings, startDate, endDate) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const viewsByDay = {};

  // Initialize all days with 0 views
  for (let i = 0; i < 7; i++) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - (6 - i));
    const dayName = days[date.getDay()];
    viewsByDay[dayName] = 0;
  }

  // Aggregate views by day of week
  listings.forEach(car => {
    if (car.lastViewedAt) {
      const dayName = days[car.lastViewedAt.getDay()];
      viewsByDay[dayName] = (viewsByDay[dayName] || 0) + (car.viewCount || 0);
    }
  });

  return days.map(day => ({
    day,
    views: viewsByDay[day] || 0
  }));
}

/**
 * Calculate inquiry sources distribution
 */
function calculateInquiriesBySource(listings) {
  const sources = {
    'Direct': 0,
    'Search': 0,
    'Social': 0,
    'Other': 0
  };

  const totalInquiries = listings.reduce((sum, car) => sum + (car.inquiryCount || 0), 0);

  if (totalInquiries === 0) {
    return Object.entries(sources).map(([source]) => ({
      source,
      count: 0,
      percentage: 0
    }));
  }

  // Distribute inquiries proportionally (placeholder logic - can be enhanced later)
  const distribution = {
    'Direct': 0.47,
    'Search': 0.31,
    'Social': 0.13,
    'Other': 0.09
  };

  return Object.entries(distribution).map(([source, ratio]) => {
    const count = Math.round(totalInquiries * ratio);
    return {
      source,
      count,
      percentage: Math.round(ratio * 100)
    };
  });
}

/**
 * Calculate price range performance
 */
function calculatePriceRangePerformance(listings) {
  const ranges = {
    '£0-£10k': { min: 0, max: 10000, listings: 0, views: 0, inquiries: 0 },
    '£10k-£20k': { min: 10000, max: 20000, listings: 0, views: 0, inquiries: 0 },
    '£20k-£30k': { min: 20000, max: 30000, listings: 0, views: 0, inquiries: 0 },
    '£30k+': { min: 30000, max: Infinity, listings: 0, views: 0, inquiries: 0 }
  };

  listings.forEach(car => {
    const price = car.price || 0;
    let rangeKey = null;

    if (price < 10000) rangeKey = '£0-£10k';
    else if (price < 20000) rangeKey = '£10k-£20k';
    else if (price < 30000) rangeKey = '£20k-£30k';
    else rangeKey = '£30k+';

    if (rangeKey) {
      ranges[rangeKey].listings += 1;
      ranges[rangeKey].views += car.viewCount || 0;
      ranges[rangeKey].inquiries += car.inquiryCount || 0;
    }
  });

  return Object.entries(ranges).map(([range, data]) => ({
    range,
    listings: data.listings,
    views: data.views,
    inquiries: data.inquiries
  }));
}
