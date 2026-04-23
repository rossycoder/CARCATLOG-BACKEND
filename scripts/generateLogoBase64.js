const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, '../../public/images/brands/logo.jpeg');
const data = fs.readFileSync(logoPath);
const b64 = 'data:image/jpeg;base64,' + data.toString('base64');

const output = `// Auto-generated - do not edit manually\nexport const LOGO_BASE64 = "${b64}";\n`;
const outPath = path.join(__dirname, '../../src/utils/logoBase64.js');
fs.writeFileSync(outPath, output);
console.log('Done! Written to src/utils/logoBase64.js, size:', Math.round(b64.length / 1024), 'KB');
