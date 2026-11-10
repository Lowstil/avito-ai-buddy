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

async function typeText(page, selector, text, delay = 25) {
  await page.waitForSelector(selector);
  for (const char of text) {
    await page.type(selector, char, { delay });
    if (frameIndex % 3 === 0) {
      await capture(page, 1);
    }
  }
}

async function run() {
  console.log('--- Starting Extended High-Definition Walkthrough Video Recording ---');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  console.log('Navigating to application at http://127.0.0.1:4173 ...');
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 1500));

  // SCENE 1: Overview of Dashboard, Vector Avatars & Meaningful Intern Stats (30 frames)
  console.log('Scene 1: Intern Dashboard Overview & Stats with Local Avatars...');
  await capture(page, 30);

  // SCENE 2: Chat with AI-Buddy - Zero Bug Policy & Clean Markdown (35 frames)
  console.log('Scene 2: Asking Zero Bug Policy (Testing Markdown Rendering)...');
  const zbpBtn = await page.$('button ::-p-text(Правило Zero Bug Policy)');
  if (zbpBtn) {
    await zbpBtn.click();
    await new Promise(r => setTimeout(r, 1800));
    await capture(page, 35);
  }

  // SCENE 3: Deep Technical Question - Code Review Standards in Avito (45 frames)
  console.log('Scene 3: Deep Technical Standards Question (Code Review)...');
  const inputSel = 'input[placeholder*="Спроси о процессах"]';
  await typeText(page, inputSel, 'Какие стандарты Code Review действуют в Авито?');
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 2200));
  await capture(page, 45);

  // SCENE 4: 1:1 Meeting Synthesis with Task Breakdown (45 frames)
  console.log('Scene 4: 1:1 Meeting Agenda Synthesis with Mentor...');
  const meetingBtn = await page.$('button ::-p-text(Подготовка к встрече 1:1)');
  if (meetingBtn) {
    await meetingBtn.click();
    await new Promise(r => setTimeout(r, 2200));
    await capture(page, 45);
  }

  // SCENE 5: Natural Language Day-Off Booking Flow via AI (40 frames)
  console.log('Scene 5: Booking Day-Off via AI...');
  const dayOffBtn = await page.$('button ::-p-text(Оформить отгул (Day-off))');
  if (dayOffBtn) {
    await dayOffBtn.click();
    await new Promise(r => setTimeout(r, 1400));
    await capture(page, 20);
  }
  await typeText(page, inputSel, '24 ноября, экзамен в магистратуре');
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 2000));
  await capture(page, 40);

  // SCENE 6: Switch to Absences Tab - Interactive Calendar Selection (55 frames)
  console.log('Scene 6: Absences Interactive Calendar Selection...');
  const absenceTab = await page.$('button ::-p-text(Отгулы (Day-off))');
  if (absenceTab) {
    await absenceTab.click();
    await new Promise(r => setTimeout(r, 1200));
    await capture(page, 25);
  }

  // Click "Оформить отгул в календаре"
  const openCalendarBtn = await page.$('button ::-p-text(Оформить отгул в календаре)');
  if (openCalendarBtn) {
    await openCalendarBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    await capture(page, 25);

    // Pick a date on the calendar: day 27
    const dayButtons = await page.$$('button:has(span.text-xs)');
    for (const b of dayButtons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.trim() === '27') {
        await b.click();
        await new Promise(r => setTimeout(r, 800));
        await capture(page, 20);
        break;
      }
    }

    // Type reason
    const reasonInput = await page.$('input[placeholder*="Сдача зачёта"]');
    if (reasonInput) {
      await reasonInput.type('Участие в конференции HighLoad++', { delay: 20 });
      await capture(page, 15);
    }

    // Submit
    const submitAbsence = await page.$('button ::-p-text(Отправить заявку)');
    if (submitAbsence) {
      await submitAbsence.click();
      await new Promise(r => setTimeout(r, 1500));
      await capture(page, 30);
    }
  }

  // SCENE 7: Open Full Detail Modal with Calendar Highlighting
  console.log('Scene 7: Open Detail Modal with Month Calendar Highlighting...');
  const showInCalBtn = await page.$('button ::-p-text(Показать в календаре →)');
  if (showInCalBtn) {
    await showInCalBtn.click();
    await new Promise(r => setTimeout(r, 1200));
    await capture(page, 35);
    // Close modal
    const closeDetail = await page.$('button ::-p-text(Закрыть окно)');
    if (closeDetail) await closeDetail.click();
    await new Promise(r => setTimeout(r, 600));
  }

  // SCENE 8: Switch Role to Mentor (Алексей) - Reject Request with Reason Modal (55 frames)
  console.log('Scene 8: Switching to Mentor & Rejection with Mandatory Reason...');
  const mentorBtn = await page.$('button ::-p-text(Алексей)');
  if (mentorBtn) {
    await mentorBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    await capture(page, 20);
  }

  // Click "Отклонить..." on a request
  const rejectBtn = await page.$('button ::-p-text(Отклонить...)');
  if (rejectBtn) {
    await rejectBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    await capture(page, 25);

    // Click quick reason chip: "Высокая нагрузка в спринте"
    const quickChip = await page.$('button ::-p-text(Высокая нагрузка в спринте)');
    if (quickChip) {
      await quickChip.click();
      await new Promise(r => setTimeout(r, 600));
      await capture(page, 15);
    }

    // Submit rejection
    const confirmReject = await page.$('button ::-p-text(Отклонить заявку с указанием причины)');
    if (confirmReject) {
      await confirmReject.click();
      await new Promise(r => setTimeout(r, 1400));
      await capture(page, 35);
    }
  }

  // SCENE 9: Approve another request as Mentor
  console.log('Scene 9: Approve request as Mentor...');
  const approveBtn = await page.$('button ::-p-text(Одобрить отгул)');
  if (approveBtn) {
    await approveBtn.click();
    await new Promise(r => setTimeout(r, 1200));
    await capture(page, 30);
  }

  // SCENE 10: Access Management & Strict RBAC Verification (Intern vs Mentor Sync)
  console.log('Scene 10: Access Management & Strict RBAC Verification...');
  const internBtn = await page.$('button ::-p-text(Арсений)');
  if (internBtn) {
    await internBtn.click();
    await new Promise(r => setTimeout(r, 800));
  }

  const accessTab = await page.$('button ::-p-text(Доступы и стенды)');
  if (accessTab) {
    await accessTab.click();
    await new Promise(r => setTimeout(r, 1200));
    await capture(page, 30);
  }

  // Intern requests access to Lens k8s
  const reqAccessBtn = await page.$('button ::-p-text(Запросить доступ в 1 клик)');
  if (reqAccessBtn) {
    await reqAccessBtn.click();
    await new Promise(r => setTimeout(r, 1200));
    await capture(page, 30);
  }

  // Switch to Mentor to show instantaneous synchronization & approval power
  console.log('Scene 11: Mentor Sees Request & Grants Access...');
  if (mentorBtn) {
    await mentorBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    await capture(page, 25);
  }

  const grantBtn = await page.$('button ::-p-text(Подтвердить выдачу стажёру)');
  if (grantBtn) {
    await grantBtn.click();
    await new Promise(r => setTimeout(r, 1400));
    await capture(page, 30);
  }

  // Switch back to Intern to show synchronized Active status
  console.log('Scene 11b: Intern Sees Active Status...');
  if (internBtn) {
    await internBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    await capture(page, 25);
  }

  // SCENE 12: Checklist Tab - Open Task Modal, Add Notes & Confetti (50 frames)
  console.log('Scene 12: Checklist Tab, Detailed Task Modal, Notes & Confetti...');
  const checklistTab = await page.$('button ::-p-text(Чек-лист стажёра)');
  if (checklistTab) {
    await checklistTab.click();
    await new Promise(r => setTimeout(r, 1200));
    await capture(page, 25);
  }

  // Click on a task card to open detailed modal
  const taskCards = await page.$$('div.glass-card:has(h4)');
  if (taskCards.length > 0) {
    await taskCards[0].click();
    await new Promise(r => setTimeout(r, 1200));
    await capture(page, 25);

    // Type personal note in the task modal textarea
    const noteArea = await page.$('textarea[placeholder*="Запишите сюда вопросы"]');
    if (noteArea) {
      await noteArea.type('Согласовано с наставником: изучил стандарты логирования в Splunk.', { delay: 20 });
      await capture(page, 15);
    }

    // Toggle complete from inside modal
    const modalCompleteBtn = await page.$('button ::-p-text(Отметить выполненной)');
    if (modalCompleteBtn) {
      await modalCompleteBtn.click();
      await new Promise(r => setTimeout(r, 1500));
      await capture(page, 35);
    }
  }

  // SCENE 13: Switch to Team Lead (Екатерина Соколова) Role (35 frames)
  console.log('Scene 13: Team Lead Екатерина Соколова Perspective...');
  const leadBtn = await page.$('button ::-p-text(Екатерина)');
  if (leadBtn) {
    await leadBtn.click();
    await new Promise(r => setTimeout(r, 1200));
    await capture(page, 35);
  }

  // Scroll smoothly to footer
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
  await new Promise(r => setTimeout(r, 1200));
  await capture(page, 25);

  await browser.close();
  console.log(`Successfully captured ${frameIndex} high-resolution frames!`);

  // Compile with Python imageio_ffmpeg
  console.log('Compiling frames into docs/demo.mp4 via ffmpeg...');
  const pyScript = `
import imageio_ffmpeg
import subprocess
import os

ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
frames_pattern = r"${framesDir.replace(/\\/g, '/')}/frame_%05d.png"
output_mp4 = r"C:/Users/Alexandro/.gemini/antigravity/scratch/avito-ai-buddy/docs/demo.mp4"
output_user_mp4 = r"C:/Users/Alexandro/avito-ai-buddy/docs/demo.mp4"
output_artifact_mp4 = r"C:/Users/Alexandro/.gemini/antigravity/brain/fb4c37c1-d62c-4350-919d-05c3b7385931/demo.mp4"

cmd = [
    ffmpeg_exe,
    "-y",
    "-framerate", "10",
    "-i", frames_pattern,
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-crf", "20",
    "-preset", "medium",
    output_mp4
]
print("Running command:", " ".join(cmd))
subprocess.run(cmd, check=True)

import shutil
os.makedirs(os.path.dirname(output_user_mp4), exist_ok=True)
shutil.copyfile(output_mp4, output_user_mp4)
shutil.copyfile(output_mp4, output_artifact_mp4)
print("Video saved successfully to:")
print(" -", output_mp4)
print(" -", output_user_mp4)
print(" -", output_artifact_mp4)
`;
  fs.writeFileSync('C:\\Users\\Alexandro\\AppData\\Local\\Temp\\make_video.py', pyScript, 'utf8');
  execSync('py C:\\Users\\Alexandro\\AppData\\Local\\Temp\\make_video.py', { stdio: 'inherit' });
  console.log('HD Demo Video successfully generated and exported!');
}

run().catch(err => {
  console.error('Recording error:', err);
  process.exit(1);
});
