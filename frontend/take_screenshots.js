import puppeteer from 'puppeteer-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    defaultViewport: { width: 1400, height: 950 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  console.log('Navigating to http://127.0.0.1:4173 ...');
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 15000 });

  // Wait 1 sec for animations
  await new Promise(r => setTimeout(r, 1200));

  // Screenshot 1: Full Main Dashboard (Glassy Liquid UI, Stats Cards, Checklist, Chat)
  const shot1 = 'C:\\Users\\Alexandro\\.gemini\\antigravity\\scratch\\avito-ai-buddy\\docs\\stage4_dashboard.png';
  await page.screenshot({ path: shot1, fullPage: false });
  console.log('Saved screenshot 1:', shot1);

  // Send a chat message: "Мне нужен отгул"
  const inputSelector = 'input[placeholder*="Спроси о процессах"]';
  await page.waitForSelector(inputSelector);
  await page.type(inputSelector, 'Мне нужен отгул');
  await page.keyboard.press('Enter');

  // Wait for AI response
  await new Promise(r => setTimeout(r, 1500));

  // Type next slot: "20 ноября, визит к врачу"
  await page.type(inputSelector, '20 ноября, визит к врачу');
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 1500));

  // Screenshot 2: Completed Absence Booking with Action Card & MCP Execution
  const shot2 = 'C:\\Users\\Alexandro\\.gemini\\antigravity\\scratch\\avito-ai-buddy\\docs\\stage4_absence_action.png';
  await page.screenshot({ path: shot2, fullPage: false });
  console.log('Saved screenshot 2:', shot2);

  // Click on "Кадры: Отгулы (Day-off)" button to open Modal
  const modalBtn = await page.$('button ::-p-text(Кадры: Отгулы (Day-off))');
  if (modalBtn) {
    await modalBtn.click();
    await new Promise(r => setTimeout(r, 800));
    const shot3 = 'C:\\Users\\Alexandro\\.gemini\\antigravity\\scratch\\avito-ai-buddy\\docs\\stage4_absence_modal.png';
    await page.screenshot({ path: shot3, fullPage: false });
    console.log('Saved screenshot 3:', shot3);
  }

  // Scroll down to capture the requested Glassy Liquid Footer!
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 800));
  const shot4 = 'C:\\Users\\Alexandro\\.gemini\\antigravity\\scratch\\avito-ai-buddy\\docs\\stage4_glassy_footer.png';
  await page.screenshot({ path: shot4, fullPage: false });
  console.log('Saved screenshot 4 (Glassy Liquid Footer):', shot4);

  await browser.close();
  console.log('All screenshots captured successfully!');
}

run().catch(err => {
  console.error('Error taking screenshots:', err);
  process.exit(1);
});
