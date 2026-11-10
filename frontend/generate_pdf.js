import puppeteer from 'puppeteer-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  console.log('Generating PDF presentation...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const htmlPath = 'file:///C:/Users/Alexandro/.gemini/antigravity/scratch/avito-ai-buddy/docs/presentation/slides.html';
  await page.goto(htmlPath, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1000));

  const pdfPath = 'C:\\Users\\Alexandro\\.gemini\\antigravity\\scratch\\avito-ai-buddy\\docs\\presentation\\presentation.pdf';
  await page.pdf({
    path: pdfPath,
    width: '1600px',
    height: '900px',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  console.log('PDF presentation created at:', pdfPath);
  await browser.close();
}

run().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
