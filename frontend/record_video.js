import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const framesDir = 'C:\\Users\\Alexandro\\AppData\\Local\\Temp\\avito_demo_frames';

if (!fs.existsSync(framesDir)) {
  fs.mkdirSync(framesDir, { recursive: true });
} else {
  // Clean existing frames
  fs.readdirSync(framesDir).forEach(f => fs.unlinkSync(path.join(framesDir, f)));
}

let frameIndex = 0;

async function capture(page, repeat = 1) {
  for (let i = 0; i < repeat; i++) {
    const filename = path.join(framesDir, `frame_${String(frameIndex).padStart(5, '0')}.png`);
    await page.screenshot({ path: filename, fullPage: false });
    frameIndex++;
  }
}

async function run() {
  console.log('Recording video walkthrough...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  console.log('Navigating to http://127.0.0.1:4173 ...');
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 1200));

  // SCENE 1: Overview of Dashboard & Human-Friendly Header (25 frames)
  console.log('Recording Scene 1: Dashboard Overview...');
  await capture(page, 20);

  // SCENE 2: Quick Action "Оформить отгул" click
  console.log('Recording Scene 2: Quick Action click...');
  const quickAbsenceBtn = await page.$('button ::-p-text(Оформить отгул (Day-off))');
  if (quickAbsenceBtn) {
    await quickAbsenceBtn.click();
    await new Promise(r => setTimeout(r, 1500));
    await capture(page, 15);
  }

  // SCENE 3: Type date and reason in chat
  console.log('Recording Scene 3: Slot filling in chat...');
  const inputSel = 'input[placeholder*="Спроси о процессах"]';
  await page.waitForSelector(inputSel);
  await page.type(inputSel, '20 ноября, визит к врачу', { delay: 40 });
  await capture(page, 5);
  await page.keyboard.press('Enter');
  
  // Wait for AI response with action card
  await new Promise(r => setTimeout(r, 1800));
  await capture(page, 25);

  // SCENE 4: Switch to "Отгулы (Day-off)" tab
  console.log('Recording Scene 4: Absences Tab...');
  const absenceTab = await page.$('button ::-p-text(Отгулы (Day-off))');
  if (absenceTab) {
    await absenceTab.click();
    await new Promise(r => setTimeout(r, 1200));
    await capture(page, 25);
  }

  // SCENE 5: Switch to Mentor role to show RBAC approval
  console.log('Recording Scene 5: Mentor RBAC Approval...');
  const switchRoleBtn = await page.$('button ::-p-text(Войти как Наставник (Алексей))');
  if (switchRoleBtn) {
    await switchRoleBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    await capture(page, 15);
  }

  // Click "Согласовать отгул"
  const approveBtn = await page.$('button ::-p-text(Согласовать отгул)');
  if (approveBtn) {
    await approveBtn.click();
    await new Promise(r => setTimeout(r, 1200));
    await capture(page, 25);
  }

  // SCENE 6: Switch back to Intern & Go to "Чек-лист стажёра" tab
  console.log('Recording Scene 6: Checklist Tracker & Confetti...');
  const switchBackBtn = await page.$('button ::-p-text(Войти как Стажёр (Арсений))');
  if (switchBackBtn) {
    await switchBackBtn.click();
    await new Promise(r => setTimeout(r, 800));
  }

  const checklistTab = await page.$('button ::-p-text(Чек-лист стажёра)');
  if (checklistTab) {
    await checklistTab.click();
    await new Promise(r => setTimeout(r, 1000));
    await capture(page, 15);
  }

  // Toggle a checklist task
  const checkButtons = await page.$$('button:has(svg.lucide-circle)');
  if (checkButtons.length > 0) {
    await checkButtons[0].click();
    await new Promise(r => setTimeout(r, 1500));
    await capture(page, 25);
  }

  // SCENE 7: Switch to "Доступы и стенды" tab
  console.log('Recording Scene 7: Access Management Tab...');
  const accessTab = await page.$('button ::-p-text(Доступы и стенды)');
  if (accessTab) {
    await accessTab.click();
    await new Promise(r => setTimeout(r, 1000));
    await capture(page, 20);
  }

  // SCENE 8: Back to AI-Buddy Chat with RAG Question
  console.log('Recording Scene 8: Playbook RAG & ZBP...');
  const chatTab = await page.$('button ::-p-text(AI-Наставник)');
  if (chatTab) {
    await chatTab.click();
    await new Promise(r => setTimeout(r, 800));
  }

  const zbpBtn = await page.$('button ::-p-text(Правило Zero Bug Policy)');
  if (zbpBtn) {
    await zbpBtn.click();
    await new Promise(r => setTimeout(r, 1800));
    await capture(page, 25);
  }

  await browser.close();
  console.log(`Captured ${frameIndex} frames!`);

  // Now compile to MP4 using Python imageio_ffmpeg
  console.log('Compiling frames into docs/demo.mp4 via ffmpeg...');
  const pyScript = `
import imageio_ffmpeg
import subprocess
import os

ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
frames_pattern = r"${framesDir.replace(/\\/g, '/')}/frame_%05d.png"
output_mp4 = r"C:/Users/Alexandro/.gemini/antigravity/scratch/avito-ai-buddy/docs/demo.mp4"
output_user_mp4 = r"C:/Users/Alexandro/avito-ai-buddy/docs/demo.mp4"

cmd = [
    ffmpeg_exe,
    "-y",
    "-framerate", "12",
    "-i", frames_pattern,
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-crf", "22",
    "-preset", "fast",
    output_mp4
]
print("Running command:", " ".join(cmd))
subprocess.run(cmd, check=True)

import shutil
shutil.copyfile(output_mp4, output_user_mp4)
print("Video saved to:", output_mp4, "and", output_user_mp4)
`;
  fs.writeFileSync('C:\\Users\\Alexandro\\AppData\\Local\\Temp\\make_video.py', pyScript, 'utf8');
  execSync('py C:\\Users\\Alexandro\\AppData\\Local\\Temp\\make_video.py', { stdio: 'inherit' });
  console.log('Video recording and compilation complete!');
}

run().catch(err => {
  console.error('Recording error:', err);
  process.exit(1);
});
