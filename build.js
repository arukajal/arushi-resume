const fs = require('fs');
const path = require('path');

// Generate a timestamp-based version
const timestamp = Date.now();
const version = `v${timestamp}`;

// Read the HTML file
const htmlPath = path.join(__dirname, 'index.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Replace version numbers
htmlContent = htmlContent.replace(/styles\.css\?v=[^"]+/g, `styles.css?${version}`);
htmlContent = htmlContent.replace(/app\.js\?v=[^"]+/g, `app.js?${version}`);

// Write back to file
fs.writeFileSync(htmlPath, htmlContent);

console.log(`✅ Cache busting updated with version: ${version}`);
console.log(`📁 HTML file updated: ${htmlPath}`);
