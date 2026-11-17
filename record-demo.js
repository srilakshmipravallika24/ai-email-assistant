const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const { execSync, spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

// Helper sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  console.log('====================================================');
  console.log('🎬 AUTOMATED DEMO VIDEO GENERATOR');
  console.log('====================================================');

  // 1. Start Server automatically
  console.log('Starting AssistPilot AI backend server on port 5000...');
  const serverProcess = spawn('node', ['server.js'], {
    cwd: __dirname,
    stdio: 'ignore',
    detached: false
  });

  await sleep(2500);

  const videoDir = path.join(__dirname, 'public', 'videos');
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  // Clean old video files
  try {
    const existingFiles = fs.readdirSync(videoDir);
    for (const f of existingFiles) {
      if (f.endsWith('.webm') || f.endsWith('.mp4')) {
        try { fs.unlinkSync(path.join(videoDir, f)); } catch (_) {}
      }
    }
  } catch (_) {}

  // 2. Locate Browser executable
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const execPath = fs.existsSync(chromePath) ? chromePath : edgePath;
  console.log(`Using Browser executable: ${execPath}`);

  let browser;
  let context;
  try {
    browser = await chromium.launch({
      executablePath: execPath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: {
        dir: videoDir,
        size: { width: 1280, height: 720 }
      }
    });

    const page = await context.newPage();

    console.log('Loading application at http://localhost:5000...');
    await page.goto('http://localhost:5000', { waitUntil: 'networkidle' });

    // Inject visual virtual mouse cursor and click ripple
    await page.evaluate(() => {
      const cursor = document.createElement('div');
      cursor.id = 'demo-virtual-cursor';
      cursor.style.width = '20px';
      cursor.style.height = '20px';
      cursor.style.position = 'fixed';
      cursor.style.top = '0px';
      cursor.style.left = '0px';
      cursor.style.borderRadius = '50%';
      cursor.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
      cursor.style.border = '2px solid white';
      cursor.style.boxShadow = '0 0 10px rgba(0,0,0,0.6)';
      cursor.style.pointerEvents = 'none';
      cursor.style.zIndex = '999999';
      cursor.style.transition = 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
      cursor.style.transform = 'translate(-50%, -50%)';
      document.body.appendChild(cursor);

      window.moveCursorTo = (x, y) => {
        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;
      };

      window.clickRipple = (x, y) => {
        const ripple = document.createElement('div');
        ripple.style.position = 'fixed';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.style.width = '24px';
        ripple.style.height = '24px';
        ripple.style.borderRadius = '50%';
        ripple.style.border = '2px solid #ef4444';
        ripple.style.transform = 'translate(-50%, -50%) scale(0.6)';
        ripple.style.pointerEvents = 'none';
        ripple.style.zIndex = '999998';
        ripple.style.transition = 'all 0.35s ease-out';
        ripple.style.opacity = '1';
        document.body.appendChild(ripple);
        setTimeout(() => {
          ripple.style.transform = 'translate(-50%, -50%) scale(2.2)';
          ripple.style.opacity = '0';
        }, 20);
        setTimeout(() => ripple.remove(), 400);
      };
    });

    async function moveAndClick(selector) {
      try {
        const el = await page.$(selector);
        if (!el) return;
        const box = await el.boundingBox();
        if (!box) return;
        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;
        await page.evaluate(({ cx, cy }) => window.moveCursorTo(cx, cy), { cx: x, cy: y });
        await sleep(350);
        await page.evaluate(({ cx, cy }) => window.clickRipple(cx, cy), { cx: x, cy: y });
        await el.click();
        await sleep(500);
      } catch (err) {
        console.log(`Notice for selector ${selector}:`, err.message);
      }
    }

    // --- SCENE 1: Welcome & Metrics ---
    console.log('🎥 Recording Scene 1: Dashboard Overview & KPI Metrics...');
    await sleep(2000);
    await page.evaluate(() => window.moveCursorTo(320, 105));
    await sleep(1000);
    await page.evaluate(() => window.moveCursorTo(520, 105));
    await sleep(1000);

    // --- SCENE 2: Sidebar Filtering ---
    console.log('🎥 Recording Scene 2: Mailbox Segmentation...');
    await moveAndClick('button:has-text("Assistant to Reply")');
    await sleep(1200);

    await moveAndClick('button:has-text("Client to Reply")');
    await sleep(1200);

    await moveAndClick('button:has-text("Meetings & Dates")');
    await sleep(1200);

    await moveAndClick('button:has-text("All Conversations")');
    await sleep(1000);

    // --- SCENE 3: Email Details & AI Reasoning ---
    console.log('🎥 Recording Scene 3: Email Inspection & AI Reasoning...');
    await moveAndClick('div:has-text("Keynote Speaker Availability")');
    await sleep(1500);

    await page.evaluate(() => {
      const el = document.querySelector('main .overflow-y-auto');
      if (el) el.scrollBy({ top: 120, behavior: 'smooth' });
    });
    await sleep(1000);

    // --- SCENE 4: Manual AI Override ---
    console.log('🎥 Recording Scene 4: Assistant Overriding Classification...');
    const selectBox = await page.$('select');
    if (selectBox) {
      const box = await selectBox.boundingBox();
      if (box) {
        await page.evaluate(({ cx, cy }) => window.moveCursorTo(cx, cy), { cx: box.x + 30, cy: box.y + 12 });
        await sleep(400);
        await selectBox.selectOption('client');
        await sleep(1400);
        await selectBox.selectOption('assistant');
        await sleep(1000);
      }
    }

    // --- SCENE 5: Minimalistic Client-Facing View ---
    console.log('🎥 Recording Scene 5: Switching to Minimalist Client View...');
    await moveAndClick('button:has-text("Client Minimal View")');
    await sleep(2500);

    await page.evaluate(() => window.moveCursorTo(640, 260));
    await sleep(1000);

    // Click "Mark Handled / Approved" on client email
    const approveBtn = await page.$('button:has-text("Mark Handled / Approved")');
    if (approveBtn) {
      const box = await approveBtn.boundingBox();
      if (box) {
        await page.evaluate(({ cx, cy }) => window.moveCursorTo(cx, cy), { cx: box.x + 50, cy: box.y + 16 });
        await sleep(350);
        await page.evaluate(({ cx, cy }) => window.clickRipple(cx, cy), { cx: box.x + 50, cy: box.y + 16 });
        await approveBtn.click();
        await sleep(1800);
      }
    }

    // --- SCENE 6: Return to Assistant & AI Reply Drafter ---
    console.log('🎥 Recording Scene 6: Generating AI Drafted Reply...');
    await moveAndClick('button:has-text("Assistant Master View")');
    await sleep(1000);

    await moveAndClick('div:has-text("David Chen")');
    await sleep(700);

    await moveAndClick('button:has-text("Draft AI Reply")');
    await sleep(1500);

    await moveAndClick('button:has-text("Warm & Friendly")');
    await sleep(1600);

    await moveAndClick('button:has-text("Approve & Send Reply")');
    await sleep(1400);

    // --- SCENE 7: AI Copilot Drawer ---
    console.log('🎥 Recording Scene 7: Interacting with AI Inbox Copilot...');
    await moveAndClick('button:has-text("AI Copilot")');
    await sleep(1200);

    await moveAndClick('button:has-text("What requires client approval?")');
    await sleep(2200);

    await moveAndClick('button:has-text("Summarize pending meetings")');
    await sleep(2200);

    // Close Copilot by clicking toggle or top close
    await moveAndClick('.fixed.inset-y-0.right-0 button:has-text("✕")');
    await sleep(800);

    // --- SCENE 8: Guided Demo Tour ---
    console.log('🎥 Recording Scene 8: Running Guided Demo Video Tour...');
    await moveAndClick('button:has-text("Demo Video Tour")');
    await sleep(1800);

    for (let i = 0; i < 4; i++) {
      const nextBtn = await page.$('button:has-text("Next Step")');
      if (nextBtn) {
        const box = await nextBtn.boundingBox();
        if (box) {
          await page.evaluate(({ cx, cy }) => window.moveCursorTo(cx, cy), { cx: box.x + 35, cy: box.y + 15 });
          await sleep(350);
          await page.evaluate(({ cx, cy }) => window.clickRipple(cx, cy), { cx: box.x + 35, cy: box.y + 15 });
          await nextBtn.click();
          await sleep(1800);
        }
      }
    }

    const finishBtn = await page.$('button:has-text("Finish Tour")');
    if (finishBtn) {
      await finishBtn.click();
      await sleep(1200);
    }

    console.log('Recording complete! Finalizing video stream...');
    await sleep(1500);

    await context.close();
    await browser.close();

  } catch (err) {
    console.error('Error during recording:', err);
    if (context) await context.close();
    if (browser) await browser.close();
  } finally {
    // Kill the backend server
    try { serverProcess.kill(); } catch (_) {}
  }

  // 3. Process video files
  const files = fs.readdirSync(videoDir);
  const recordedVideo = files.find(f => f.endsWith('.webm'));

  if (!recordedVideo) {
    console.error('❌ Error: No recorded video file was generated.');
    return;
  }

  const rawVideoPath = path.join(videoDir, recordedVideo);
  const finalWebmPath = path.join(videoDir, 'demo_video.webm');
  const rootWebmPath = path.join(__dirname, 'demo_video.webm');
  const finalMp4Path = path.join(videoDir, 'demo_video.mp4');
  const rootMp4Path = path.join(__dirname, 'demo_video.mp4');

  fs.copyFileSync(rawVideoPath, finalWebmPath);
  fs.copyFileSync(rawVideoPath, rootWebmPath);
  console.log(`✅ WebM Video created: ${finalWebmPath}`);

  // Transcode to MP4 using ffmpeg-static
  console.log('Converting to MP4 format using FFmpeg...');
  try {
    const cmd = `"${ffmpegPath}" -y -i "${finalWebmPath}" -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p "${finalMp4Path}"`;
    execSync(cmd, { stdio: 'inherit' });
    fs.copyFileSync(finalMp4Path, rootMp4Path);
    console.log(`✅ MP4 Video created: ${finalMp4Path}`);
    console.log(`✅ MP4 Root Video created: ${rootMp4Path}`);
  } catch (err) {
    console.error('Warning during MP4 conversion:', err.message);
  }

  console.log('====================================================');
  console.log('🎉 SUCCESS! YOUR INTERVIEW DEMO VIDEO IS READY!');
  console.log(`📹 MP4:  ${rootMp4Path}`);
  console.log(`📹 WebM: ${rootWebmPath}`);
  console.log('====================================================');
}

run().catch(console.error);
