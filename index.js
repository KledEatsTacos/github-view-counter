const express = require('express');
const storage = require('node-persist');
const path = require('path');
const app = express();

// Initialize storage with proper configuration
(async () => {
  await storage.init({
    dir: path.join(process.cwd(), 'data'),
    stringify: JSON.stringify,
    parse: JSON.parse,
    encoding: 'utf8',
    logging: false,
    ttl: false,
    expiredInterval: 2 * 60 * 1000, // 2 minutes
    forgiveParseErrors: false
  });

  // Initialize views counter if it doesn't exist
  const views = await storage.getItem('views');
  if (views === undefined) {
    await storage.setItem('views', 0);
  }
})();

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});

// Count endpoint
app.get('/count', async (req, res) => {
    // Get IP address (handle Vercel and other proxies)
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
               req.headers['x-real-ip'] || 
               req.socket.remoteAddress;
    
    const ipKey = `ip:${ip}`;
    const lastVisit = await storage.getItem(ipKey);
    const now = Date.now();
    
    if (!lastVisit || (now - lastVisit) > 1800000) { // 30 minutes
        const views = (await storage.getItem('views') || 0) + 1;
        await storage.setItem('views', views);
        await storage.setItem(ipKey, now);
        console.log(`View counted from IP: ${ip.substring(0,6)}... (Total: ${views})`);
    }
    
    // Return 1x1 transparent pixel
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>');
});

// Simple badge renderer - only flat style
const renderBadge = (label, count) => {
    // Calculate dimensions
    const calculateTextWidth = (text) => 7 * text.length;
    
    const labelWidth = Math.max(calculateTextWidth(label), 20);
    const countWidth = Math.max(calculateTextWidth(count.toString()), 20);
    const totalWidth = labelWidth + countWidth;
    
    ///////////////////////////////////////////////////////////////////////////////////////
    // Badge colors can be customized by changing the value of the BadgeColor variable.
    // Some popular colors:
    // Blue: 007ec6 (default)
    // Green: 97ca00
    // Red: e05d44
    // Yellow: dfb317
    // Orange: fe7d37
    // Purple: 8833d7
    // Pink: ff69b4
    ///////////////////////////////////////////////////////////////////////////////////////
    const badgeColor = '007ec6'; // <-- Change this value to change badge color
    
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${count}">
  <title>${label}: ${count}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${countWidth}" height="20" fill="#${badgeColor}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text x="${labelWidth/2}" y="15" fill="#fff">${label}</text>
    <text x="${labelWidth + countWidth/2}" y="15" fill="#fff">${count}</text>
  </g>
</svg>`;
};

// Badge endpoint - Simplified to only support flat style with default color
app.get('/badge', async (req, res) => {
    const views = await storage.getItem('views') || 0;
    
    // Format with commas
    const formattedViews = views.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Generate badge SVG
    const svg = renderBadge('Profile views', formattedViews);
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(svg);
});

// Add a simple home route with basic instructions
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head>
  <title>GitHub Profile View Counter</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; max-width: 800px; margin: 0 auto; }
    code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
    pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>GitHub Profile View Counter</h1>
  <p>A simple view counter for GitHub profiles that excludes self-views.</p>
  
  <h2>How to use:</h2>
  <p>Add these to your GitHub profile README.md:</p>
  
  <h3>1. Add the counter (invisible):</h3>
  <pre><code>![](${req.protocol}://${req.get('host')}/count)</code></pre>
  
  <h3>2. Add the badge (displays the count):</h3>
  <pre><code>![Profile views](${req.protocol}://${req.get('host')}/badge)</code></pre>

  <p>Your badge will look like this:</p>
  <img src="${req.protocol}://${req.get('host')}/badge" alt="Profile views badge">
</body>
</html>`);
});

// Add a stats endpoint
app.get('/stats', async (req, res) => {
    const views = await storage.getItem('views') || 0;
    res.json({ views });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});