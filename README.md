# AssistPilot AI – Intelligent Email Management Dashboard
### AI Full-Stack Engineer Intern Assignment Prototype

AssistPilot AI is a modern, intelligent email management platform designed specifically for **Personal Assistants** and their **Executive Clients**. It bridges the gap between busy executives and their support team by using AI to automatically classify reply responsibility, extract actionable logistics, and provide a minimal, distraction-free executive feed.

---

## 🌟 Key Features

1. **Automatic AI Reply Responsibility Classification**:
   - `Assistant to Reply`: Calendar scheduling, vendor document filings, routine operational queries.
   - `Client to Reply`: Confidential decisions, Series B Term Sheet sign-offs, personal social dinner invitations.
   - `No Reply Needed`: Newsletters, transactional receipts, automated notifications.
   - **Assistant Manual Override**: 1-click override to change any AI classification instantly.

2. **Dual-Role Experience**:
   - **👔 Assistant Master View**: Full operational cockpit with KPI metric cards, segment sidebar, threaded conversations, and AI draft generation.
   - **👤 Client Minimal View**: Ultra-clean executive action feed displaying *only* emails requiring direct client personal response, with clear *"Why your response is needed"* callouts and 1-click approvals/delegations.

3. **AI Reply Drafter (Human-in-the-Loop)**:
   - Select tone: *Formal & Professional*, *Warm & Friendly*, or *Executive Brief*.
   - Review and customize drafts before sending.

4. **AI Inbox Copilot**:
   - Interactive conversational assistant answering questions such as *"What requires client approval?"*, *"Summarize pending meetings"*, and *"What am I waiting on?"*.

5. **Email Account Connection & Synchronization Flow**:
   - Simulated OAuth 2.0 connection for Google Workspace (Gmail) and Microsoft Outlook 365 with live synchronization status.

6. **Interactive "Demo Video Tour" Mode**:
   - Built-in 5-step guided walkthrough with animated banners designed specifically for evaluator demonstrations and video recordings!

---

## 📹 Official Demo Video (with Voiceover)

A full high-definition (720p HD) walkthrough video demonstrating all core features with clear voiceover narration:
- **Presentation Video with Audio:** [`AssistPilot_AI_Interview_Presentation.mp4`](file:///C:/Users/prava/.gemini/antigravity/scratch/ai-email-assistant/AssistPilot_AI_Interview_Presentation.mp4) (4.5 MB)
- **Direct Video File:** [`demo_video.mp4`](file:///C:/Users/prava/.gemini/antigravity/scratch/ai-email-assistant/demo_video.mp4)
- **In-Browser Video Player:** Open `http://localhost:5000/watch-demo.html` or `/watch-demo` on Vercel.

To re-record the video at any time automatically:
```bash
npm run record-video
```

---

## 🚀 Quick Start (One Command)

1. Open your terminal in this directory:
   ```bash
   cd ai-email-assistant
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npm start
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```
