const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function main() {
  const buf = fs.readFileSync('c:/Users/HyunSoo/Documents/Travel_Squad_11/일본여행.pdf');
  const uint8 = new Uint8Array(buf);
  const parser = new PDFParse(uint8);

  let allText = '';
  for (let i = 1; i <= 31; i++) {
    try {
      const pageText = await parser.getPageText(i);
      if (pageText && typeof pageText === 'string') {
        allText += `\n--- PAGE ${i} ---\n` + pageText;
      } else if (pageText && typeof pageText === 'object') {
        allText += `\n--- PAGE ${i} ---\n` + JSON.stringify(pageText);
      }
    } catch(pe) {
      // skip
    }
  }
  
  if (allText) {
    console.log(allText.substring(0, 20000));
  } else {
    console.log('No text extracted page-by-page, trying raw getText...');
    try {
      const text = await parser.getText();
      if (typeof text === 'object') {
        const combined = Object.values(text).flat().join('\n');
        console.log(combined.substring(0, 20000));
      }
    } catch(e) {
      console.log('Failed:', e.message);
    }
  }
}

main().catch(e => console.error(e));
