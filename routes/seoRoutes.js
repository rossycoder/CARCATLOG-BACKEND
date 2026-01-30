const express = require('express');
const router = express.Router();
const { SitemapStream, streamToPromise } = require('sitemap');
const { Readable } = require('stream');
const Car = require('../models/Car');

// Generate Sitemap
router.get('/sitemap.xml', async (req, res) => {
  try {
    const links = [
      // Static pages
      { url: '/', changefreq: 'daily', priority: 1.0 },
      { url: '/used-cars', changefreq: 'daily', priority: 0.9 },
      { url: '/new-cars', changefreq: 'daily', priority: 0.9 },
      { url: '/sell-your-car', changefreq: 'weekly', priority: 0.8 },
      { url: '/vehicle-lookup', changefreq: 'weekly', priority: 0.8 },
      { url: '/vehicle-check', changefreq: 'weekly', priority: 0.8 },
      { url: '/valuation', changefreq: 'weekly', priority: 0.8 },
      { url: '/find-your-car', changefreq: 'weekly', priority: 0.7 },
      { url: '/advertising-prices', changefreq: 'monthly', priority: 0.6 },
      { url: '/contact', changefreq: 'monthly', priority: 0.5 },
      { url: '/about', changefreq: 'monthly', priority: 0.5 },
      
      // Bikes
      { url: '/bikes', changefreq: 'daily', priority: 0.9 },
      { url: '/bikes/used-bikes', changefreq: 'daily', priority: 0.8 },
      { url: '/bikes/new-bikes', changefreq: 'daily', priority: 0.8 },
      { url: '/bikes/sell-your-bike', changefreq: 'weekly', priority: 0.7 },
      
      // Vans
      { url: '/vans', changefreq: 'daily', priority: 0.9 },
      { url: '/vans/used-vans', changefreq: 'daily', priority: 0.8 },
      { url: '/vans/new-vans', changefreq: 'daily', priority: 0.8 },
      { url: '/vans/sell-your-van', changefreq: 'weekly', priority: 0.7 },
    ];

    // Add dynamic car listings
    const cars = await Car.find({ 
      status: 'active',
      expiresAt: { $gt: new Date() }
    })
    .select('_id updatedAt')
    .limit(1000)
    .lean();

    cars.forEach(car => {
      links.push({
        url: `/cars/${car._id}`,
        changefreq: 'weekly',
        priority: 0.7,
        lastmod: car.updatedAt
      });
    });

    // Create sitemap stream
    const stream = new SitemapStream({ hostname: 'https://carcatlog.vercel.app' });
    
    res.header('Content-Type', 'application/xml');
    res.header('Content-Encoding', 'gzip');

    const xmlString = await streamToPromise(
      Readable.from(links).pipe(stream)
    ).then(data => data.toString());

    res.send(xmlString);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// Robots.txt
router.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`# Allow all crawlers
User-agent: *
Allow: /

# Disallow admin and private pages
Disallow: /trade/
Disallow: /my-listings
Disallow: /saved-cars
Disallow: /signin
Disallow: /signup
Disallow: /auth/
Disallow: /verify-email
Disallow: /reset-password

# Sitemap location
Sitemap: https://carcatlog.vercel.app/api/seo/sitemap.xml

# Crawl-delay for polite crawling
Crawl-delay: 1
`);
});

module.exports = router;
