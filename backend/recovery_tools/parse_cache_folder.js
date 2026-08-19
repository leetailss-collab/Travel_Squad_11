const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const cacheDir = process.argv[2] || path.join(__dirname, '../캐시');

if (!fs.existsSync(cacheDir)) {
  console.error(`Cache directory not found: ${cacheDir}`);
  process.exit(1);
}

console.log(`Scanning cache folder: ${cacheDir}`);

const files = fs.readdirSync(cacheDir);
const foundPlans = [];

files.forEach(filename => {
  const filePath = path.join(cacheDir, filename);
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return;

    const buf = fs.readFileSync(filePath);
    let text = '';
    const gzipIdx = buf.indexOf(Buffer.from([0x1f, 0x8b]));
    if (gzipIdx !== -1) {
      try { text = zlib.gunzipSync(buf.slice(gzipIdx)).toString('utf8'); } catch (e) { text = buf.toString('utf8'); }
    } else {
      text = buf.toString('utf8');
    }

    if (!text.includes('itinerary') && !text.includes('title')) return;

    let pos = 0;
    while (pos < text.length) {
      const idx1 = text.indexOf('{"title":', pos);
      const idx2 = text.indexOf('{"id":', pos);
      let start = -1;
      if (idx1 !== -1 && idx2 !== -1) start = Math.min(idx1, idx2);
      else if (idx1 !== -1) start = idx1;
      else if (idx2 !== -1) start = idx2;

      if (start === -1) break;

      let depth = 0;
      let endIdx = -1;
      for (let i = start; i < Math.min(text.length, start + 500000); i++) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}') {
          depth--;
          if (depth === 0) {
            endIdx = i;
            break;
          }
        }
      }

      if (endIdx !== -1) {
        const jsonStr = text.substring(start, endIdx + 1);
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed && parsed.title && parsed.itinerary) {
            foundPlans.push({ sourceFile: filename, data: parsed });
            console.log(`✔ Found Plan ID ${parsed.id}: "${parsed.title}" in file ${filename}`);
          }
        } catch (e) {}
      }
      pos = start + 6;
    }
  } catch (err) {}
});

const outputPath = path.join(__dirname, 'extracted_cache_plans.json');
fs.writeFileSync(outputPath, JSON.stringify(foundPlans, null, 2), 'utf8');
console.log(`\nScan complete. Found ${foundPlans.length} plan objects. Saved to ${outputPath}`);
