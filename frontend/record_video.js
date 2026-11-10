import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const framesDir = 'C:\\Users\\Alexandro\\AppData\\Local\\Temp\\avito_demo_frames';
const screenshotsDir = 'C:\\Users\\Alexandro\\.gemini\\antigravity\\scratch\\avito-ai-buddy\\docs\\screenshots';
const artifactDir = 'C:\\Users\\Alexandro\\.gemini\\antigravity\\brain\\fb4c37c1-d62c-4350-919d-05c3b7385931';

[framesDir, screenshotsDir, artifactDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Clean existing frames
fs.readdirSync(framesDir).forEach(f => {
  try {
    fs.unlinkSync(path.join(framesDir, f));
  } catch (e) {}
});

let frameIndex = 0;

async function capture(page, repeat = 1) {
  for (let i = 0; i < repeat; i++) {
    const filename = path.join(framesDir, `frame_${String(frameIndex).padStart(5, '0')}.png`);
    await page.screenshot({ path: filename, fullPage: false });
    frameIndex++;
  }
}

async function saveKeyScreenshot(page, filename) {
  const p1 = path.join(screenshotsDir, filename);
  const p2 = path.join(artifactDir, filename);
  await page.screenshot({ path: p1, fullPage: false });
  try {
    fs.copyFileSync(p1, p2);
  } catch (e) {}
  console.log(`[KEY SCREENSHOT] Saved ${filename}`);
}

async function clickButtonByText(page, text) {
  const success = await page.evaluate((targetText) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    for (const btn of buttons) {
      if (btn.textContent && btn.textContent.toLowerCase().includes(targetText.toLowerCase())) {
        btn.click();
        return true;
      }
    }
    return false;
  }, text);
  return success;
}

async function typeText(page, selector, text, delay = 15) {
  await page.waitForSelector(selector);
  for (const char of text) {
    await page.type(selector, char, { delay });
    if (frameIndex % 3 === 0) {
      await capture(page, 1);
    }
  }
}

async function run() {
  console.log('--- Starting Ultra HD Walkthrough Recording with All 4 Extensions ---');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    defaultViewport: { width: 1440, height: 920 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  console.log('Navigating to http://127.0.0.1:4173 ...');
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 25000 });
  await new Promise(r => setTimeout(r, 2000));

  // =========================================================================
  // SCENE 1: INTERN VIEW (АРСЕНИЙ НОВИКОВ)
  // =========================================================================
  console.log('Scene 1: Intern Dashboard Overview...');
  await capture(page, 15);
  await saveKeyScreenshot(page, '01_intern_dashboard_overview.png');

  // AI Chat: Zero Bug Policy
  console.log('Scene 2: Intern asking about Zero Bug Policy...');
  await clickButtonByText(page, 'Zero Bug Policy');
  await new Promise(r => setTimeout(r, 1800));
  await capture(page, 20);

  // AI Chat: Natural Language Day-Off Booking Flow
  console.log('Scene 3: Intern Booking Day-Off via AI...');
  await clickButtonByText(page, 'Как оформить отгул?');
  await new Promise(r => setTimeout(r, 1200));
  await capture(page, 15);

  const inputSel = 'input[placeholder*="Спроси о процессах"]';
  await typeText(page, inputSel, '24 ноября, экзамен в магистратуре');
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 2000));
  await capture(page, 20);
  await saveKeyScreenshot(page, '02_intern_chat_dayoff_booked.png');

  // Interactive Absences Calendar Tab
  console.log('Scene 4: Intern in Absences Tab & Glassy Calendar...');
  await clickButtonByText(page, 'Отгулы');
  await new Promise(r => setTimeout(r, 1200));
  await capture(page, 15);
  await saveKeyScreenshot(page, '03_intern_absences_calendar_tab.png');

  // Open Detailed Calendar Modal
  await clickButtonByText(page, 'Оформить отгул в календаре');
  await new Promise(r => setTimeout(r, 1000));
  await capture(page, 12);

  // Pick day 27
  const dayButtons = await page.$$('button:has(span.text-xs)');
  for (const b of dayButtons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.trim() === '27') {
      await b.click();
      await new Promise(r => setTimeout(r, 600));
      await capture(page, 10);
      break;
    }
  }

  const reasonInput = await page.$('input[placeholder*="Сдача зачёта"]');
  if (reasonInput) {
    await reasonInput.type('Участие в конференции HighLoad++', { delay: 10 });
    await capture(page, 10);
  }

  await clickButtonByText(page, 'Отправить заявку');
  await new Promise(r => setTimeout(r, 1200));
  await capture(page, 15);

  // Access Tab: Request Lens k8s
  console.log('Scene 5: Intern requesting Lens access...');
  await clickButtonByText(page, 'Доступы');
  await new Promise(r => setTimeout(r, 1000));
  await capture(page, 15);

  await clickButtonByText(page, 'Запросить доступ в 1 клик');
  await new Promise(r => setTimeout(r, 1200));
  await capture(page, 15);
  await saveKeyScreenshot(page, '04_intern_access_requested.png');

  // Checklist Tab: Note and Task Modal
  console.log('Scene 6: Intern Checklist...');
  await clickButtonByText(page, 'Чек-лист');
  await new Promise(r => setTimeout(r, 1000));
  await capture(page, 15);

  const taskCards = await page.$$('div.glass-card:has(h4)');
  if (taskCards.length > 0) {
    await taskCards[0].click();
    await new Promise(r => setTimeout(r, 1000));
    await capture(page, 15);
    await saveKeyScreenshot(page, '05_intern_task_modal_notes.png');

    await clickButtonByText(page, 'Закрыть');
    await new Promise(r => setTimeout(r, 600));
  }

  // =========================================================================
  // MODULE 1: PRE-FLIGHT CODE REVIEW PLAYGROUND (Go / ZBP Analyzer)
  // =========================================================================
  console.log('Scene 7: Pre-flight Code Review Playground...');
  await clickButtonByText(page, 'Pre-flight Review');
  await new Promise(r => setTimeout(r, 1500));
  await capture(page, 15);

  // Analyze buggy code
  await clickButtonByText(page, 'Запустить AI-Анализ');
  await new Promise(r => setTimeout(r, 1500));
  await capture(page, 25);
  await saveKeyScreenshot(page, '17_code_review_playground_analysis.png');

  // Switch to Full AI Fixed Code tab
  await clickButtonByText(page, 'Исправленный код от AI');
  await new Promise(r => setTimeout(r, 1200));
  await capture(page, 20);

  // Switch back to all issues
  await clickButtonByText(page, 'Все замечания');
  await new Promise(r => setTimeout(r, 800));

  // Load Clean Avito Go Preset
  await clickButtonByText(page, 'Идеальный код по ZBP');
  await new Promise(r => setTimeout(r, 800));
  await clickButtonByText(page, 'Запустить AI-Анализ');
  await new Promise(r => setTimeout(r, 1500));
  await capture(page, 20);

  // =========================================================================
  // MODULE 2: GAMIFICATION BADGES & LEVELS (Avito Start)
  // =========================================================================
  console.log('Scene 8: Gamification Badges & Levels...');
  await clickButtonByText(page, 'Бейджи и XP');
  await new Promise(r => setTimeout(r, 1500));
  await capture(page, 20);
  await saveKeyScreenshot(page, '19_achievements_gamification_badges.png');

  // Trigger celebration
  await clickButtonByText(page, 'Отпраздновать успехи');
  await new Promise(r => setTimeout(r, 1200));
  await capture(page, 15);

  // =========================================================================
  // SCENE 11: MENTOR VIEW (АЛЕКСЕЙ СМИРНОВ)
  // =========================================================================
  console.log('Scene 11: Switching to Mentor Алексей Смирнов...');
  await clickButtonByText(page, 'Алексей');
  await new Promise(r => setTimeout(r, 1500));
  await capture(page, 20);
  await saveKeyScreenshot(page, '06_mentor_dashboard_overview.png');

  // Go to Chat Tab as Mentor
  await clickButtonByText(page, 'AI-Наставник');
  await new Promise(r => setTimeout(r, 1200));
  await capture(page, 15);

  // Mentor Quick Action 1: Intern Progress Audit
  console.log('Scene 12: Mentor asking for Intern Progress Audit...');
  await clickButtonByText(page, 'Сводка прогресса стажёра');
  await new Promise(r => setTimeout(r, 2200));
  await capture(page, 25);
  await saveKeyScreenshot(page, '07_mentor_ai_progress_audit.png');

  // Mentor Quick Action 2: 1:1 Coaching Plan
  console.log('Scene 13: Mentor asking for 1:1 Coaching Agenda...');
  await clickButtonByText(page, 'План встречи 1:1 для ментора');
  await new Promise(r => setTimeout(r, 2200));
  await capture(page, 25);
  await saveKeyScreenshot(page, '08_mentor_ai_1on1_coaching_agenda.png');

  // Mentor Quick Action 3: Junior Code Review Checklist
  console.log('Scene 14: Mentor asking for Junior Code Review Checklist...');
  await clickButtonByText(page, 'Чек-лист код-ревью для джуна');
  await new Promise(r => setTimeout(r, 2200));
  await capture(page, 25);
  await saveKeyScreenshot(page, '09_mentor_ai_code_review_checklist.png');

  // Mentor Quick Action 4: Equator Evaluation (3 months)
  console.log('Scene 15: Mentor asking for Equator Evaluation...');
  await clickButtonByText(page, 'Оценка к Экватору (3 мес)');
  await new Promise(r => setTimeout(r, 2200));
  await capture(page, 25);
  await saveKeyScreenshot(page, '10_mentor_ai_equator_evaluation.png');

  // Mentor approving Intern's Access Request in Access Tab
  console.log('Scene 16: Mentor approving Lens access...');
  await clickButtonByText(page, 'Доступы');
  await new Promise(r => setTimeout(r, 1200));
  await capture(page, 15);

  await clickButtonByText(page, 'Подтвердить выдачу стажёру');
  await new Promise(r => setTimeout(r, 1500));
  await capture(page, 20);
  await saveKeyScreenshot(page, '11_mentor_access_granted.png');

  // =========================================================================
  // SCENE 17: TEAM LEAD VIEW (ЕКАТЕРИНА СОКОЛОВА)
  // =========================================================================
  console.log('Scene 17: Switching to Team Lead Екатерина Соколова...');
  await clickButtonByText(page, 'Екатерина');
  await new Promise(r => setTimeout(r, 1500));
  await capture(page, 20);
  await saveKeyScreenshot(page, '12_team_lead_dashboard_stats.png');

  // Go to Chat Tab as Team Lead
  await clickButtonByText(page, 'AI-Наставник');
  await new Promise(r => setTimeout(r, 1200));
  await capture(page, 15);

  // Lead Action 1: Team Onboarding Metrics & DORA Time to First PR
  console.log('Scene 18: Team Lead asking for Onboarding Metrics & Time to PR...');
  await clickButtonByText(page, 'Метрики онбординга команды');
  await new Promise(r => setTimeout(r, 2200));
  await capture(page, 25);
  await saveKeyScreenshot(page, '13_team_lead_ai_metrics_time_to_pr.png');

  // Lead Action 2: Offer Readiness Assessment Score
  console.log('Scene 19: Team Lead asking for Offer Readiness Assessment...');
  await clickButtonByText(page, 'Готовность стажёра к офферу');
  await new Promise(r => setTimeout(r, 2200));
  await capture(page, 25);
  await saveKeyScreenshot(page, '14_team_lead_ai_offer_readiness.png');

  // Lead Action 3: Mentor Capacity Audit
  console.log('Scene 20: Team Lead asking for Mentor Capacity Audit...');
  await clickButtonByText(page, 'Нагрузка наставника Алексея');
  await new Promise(r => setTimeout(r, 2200));
  await capture(page, 25);
  await saveKeyScreenshot(page, '15_team_lead_ai_mentor_capacity.png');

  // Smooth scroll to Glassy Liquid footer
  console.log('Scene 21: Glassy Liquid Footer...');
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
  await new Promise(r => setTimeout(r, 1200));
  await capture(page, 20);
  await saveKeyScreenshot(page, '16_glassy_liquid_footer.png');

  await browser.close();
  console.log(`Successfully captured ${frameIndex} high-resolution frames!`);

  // Compile frames into docs/demo.mp4
  console.log('Compiling frames into docs/demo.mp4 via ffmpeg...');
  const pyScript = `
import imageio_ffmpeg
import subprocess
import os
import shutil

ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
frames_pattern = r"${framesDir.replace(/\\/g, '/')}/frame_%05d.png"
output_mp4 = r"C:/Users/Alexandro/.gemini/antigravity/scratch/avito-ai-buddy/docs/demo.mp4"
output_user_mp4 = r"C:/Users/Alexandro/avito-ai-buddy/docs/demo.mp4"
output_artifact_mp4 = r"C:/Users/Alexandro/.gemini/antigravity/brain/fb4c37c1-d62c-4350-919d-05c3b7385931/demo.mp4"

cmd = [
    ffmpeg_exe,
    "-y",
    "-framerate", "12",
    "-i", frames_pattern,
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-crf", "19",
    "-preset", "medium",
    output_mp4
]
print("Running command:", " ".join(cmd))
subprocess.run(cmd, check=True)

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
