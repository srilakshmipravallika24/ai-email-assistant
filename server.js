const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Realistic In-Memory Database representing Executive Client & Assistant Inbox
let emailDatabase = [
  {
    id: 'em-101',
    sender: 'Sarah Jenkins',
    senderEmail: 's.jenkins@apexventures.com',
    senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    subject: 'Urgent: Term Sheet Approval & Signature Needed - Series B',
    timestamp: 'Today, 10:15 AM',
    date: '2026-11-17T10:15:00',
    read: false,
    starred: true,
    category: 'important',
    replyResponsibility: 'client', // 'client' | 'assistant' | 'none'
    responsibilityReason: 'Involves binding legal investment terms and Series B valuation sign-off that only the Client/CEO can approve.',
    summary: 'Apex Ventures has sent the finalized $12M Series B term sheet. Signature and valuation approval required by 5:00 PM today.',
    extractedMeeting: null,
    actionRequired: true,
    waitingForResponse: false,
    history: [
      {
        sender: 'Sarah Jenkins',
        time: '10:15 AM',
        content: 'Hi Alex,\n\nPlease find attached the finalized Series B Term Sheet from Apex Ventures ($12M round at $60M pre-money valuation). Our partners have signed off. Please review Section 4 regarding liquidation preferences and sign before 5:00 PM EST today so we can initiate legal escrow.\n\nBest regards,\nSarah Jenkins\nManaging Partner, Apex Ventures'
      }
    ],
    tags: ['Term Sheet', 'Legal', 'High Priority']
  },
  {
    id: 'em-102',
    sender: 'David Chen',
    senderEmail: 'dchen@techsummit2026.org',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    subject: 'Keynote Speaker Availability: Global AI Summit (Oct 14)',
    timestamp: 'Today, 09:30 AM',
    date: '2026-11-17T09:30:00',
    read: true,
    starred: false,
    category: 'meetings',
    replyResponsibility: 'assistant',
    responsibilityReason: 'Routine calendar coordination, scheduling availability check, and keynote speaker logistics.',
    summary: 'Inquiry asking if Alex is available to deliver a 30-minute keynote on AI Automation on Oct 14th in San Francisco.',
    extractedMeeting: {
      title: 'Global AI Summit Keynote',
      suggestedDate: 'Oct 14, 2026',
      suggestedTime: '10:00 AM - 10:45 AM PST',
      location: 'Moscone Center, SF / Virtual'
    },
    actionRequired: true,
    waitingForResponse: true,
    history: [
      {
        sender: 'David Chen',
        time: '09:30 AM',
        content: 'Dear Alex & Team,\n\nWe would be thrilled to invite Alex as a headline keynote speaker for our annual Global AI Summit on October 14th at Moscone Center. Could your team please confirm Alex\'s availability for a 30-minute morning session and connect us with whoever coordinates the calendar and travel logistics?\n\nWarm regards,\nDavid Chen\nEvent Director'
      }
    ],
    tags: ['Speaking', 'Conference', 'Calendar']
  },
  {
    id: 'em-103',
    sender: 'AWS Cloud Billing',
    senderEmail: 'no-reply@amazon.com',
    senderAvatar: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=100&auto=format&fit=crop&q=80',
    subject: 'Amazon Web Services Invoice Available - Oct 2026',
    timestamp: 'Yesterday, 04:45 PM',
    date: '2026-11-16T16:45:00',
    read: true,
    starred: false,
    category: 'general',
    replyResponsibility: 'none',
    responsibilityReason: 'Automated transactional notification and invoice receipt; no reply is expected or possible.',
    summary: 'Monthly cloud infrastructure invoice ($4,219.82) has been automatically charged to the corporate card on file.',
    extractedMeeting: null,
    actionRequired: false,
    waitingForResponse: false,
    history: [
      {
        sender: 'AWS Cloud Billing',
        time: 'Nov 16, 04:45 PM',
        content: 'Greetings from Amazon Web Services.\n\nYour monthly tax invoice for account #4928-1029-3810 is now ready for download. Total charged: $4,219.82 USD. Paid via Corporate Visa ending in 4192. No further action is required.'
      }
    ],
    tags: ['Invoice', 'Automated', 'Receipt']
  },
  {
    id: 'em-104',
    sender: 'Elena Rostova',
    senderEmail: 'elena@novacapital.ch',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    subject: 'Personal: Dinner in Zurich next Thursday?',
    timestamp: 'Yesterday, 02:10 PM',
    date: '2026-11-16T14:10:00',
    read: false,
    starred: true,
    category: 'client-reply',
    replyResponsibility: 'client',
    responsibilityReason: 'Personal social invitation from close strategic peer requesting direct personal confirmation.',
    summary: 'Elena is visiting Zurich next Thursday and asking Alex if they can catch up over dinner at Kronenhalle.',
    extractedMeeting: {
      title: 'Dinner with Elena Rostova',
      suggestedDate: 'Next Thursday, 7:30 PM',
      location: 'Kronenhalle, Zurich'
    },
    actionRequired: true,
    waitingForResponse: false,
    history: [
      {
        sender: 'Elena Rostova',
        time: 'Nov 16, 02:10 PM',
        content: 'Hey Alex! Long time no see. I will be in Zurich for the FinTech roundtable next Thursday. Are you around for dinner at Kronenhalle around 7:30 PM? Let me know if you can make it!'
      }
    ],
    tags: ['Personal', 'Dinner', 'Networking']
  },
  {
    id: 'em-105',
    sender: 'Markus Lindholm',
    senderEmail: 'markus@nordiclogistics.se',
    senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    subject: 'Updated Vendor NDA & Supplier Onboarding Documents',
    timestamp: 'Nov 15, 11:20 AM',
    date: '2026-11-15T11:20:00',
    read: true,
    starred: false,
    category: 'assistant-reply',
    replyResponsibility: 'assistant',
    responsibilityReason: 'Routine vendor document collection, filing countersigned standard NDAs, and administrative onboarding.',
    summary: 'Markus sent the signed standard mutual NDA and requested our counter-signed PDF and vendor tax form W-8BEN.',
    extractedMeeting: null,
    actionRequired: true,
    waitingForResponse: true,
    history: [
      {
        sender: 'Markus Lindholm',
        time: 'Nov 15, 11:20 AM',
        content: 'Hi Alex and Team,\n\nAttached is our signed copy of the standard mutual NDA. Could your office please counter-sign and share your vendor tax registration form so our accounting department can clear the file?\n\nThanks,\nMarkus Lindholm'
      }
    ],
    tags: ['Vendor', 'NDA', 'Admin']
  },
  {
    id: 'em-106',
    sender: 'Morning Brew Daily',
    senderEmail: 'crew@morningbrew.com',
    senderAvatar: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=100&auto=format&fit=crop&q=80',
    subject: 'AI chip race heats up & market open recap',
    timestamp: 'Nov 15, 06:00 AM',
    date: '2026-11-15T06:00:00',
    read: true,
    starred: false,
    category: 'general',
    replyResponsibility: 'none',
    responsibilityReason: 'Editorial newsletter; general informational reading with no reply required.',
    summary: 'Daily business and technology recap highlighting latest enterprise AI models and quarterly earnings.',
    extractedMeeting: null,
    actionRequired: false,
    waitingForResponse: false,
    history: [
      {
        sender: 'Morning Brew Daily',
        time: 'Nov 15, 06:00 AM',
        content: 'Good morning! Here is today\'s rundown of global tech markets, venture funding rounds, and the newest LLM architecture benchmarks.'
      }
    ],
    tags: ['Newsletter', 'News']
  }
];

// Connected Accounts State
let connectedAccounts = [
  {
    id: 'acc-1',
    provider: 'Google Workspace (Gmail)',
    email: 'alex.rivera.ceo@gmail.com',
    owner: 'Alex Rivera (Client)',
    status: 'Connected',
    lastSync: 'Just now',
    totalSynced: 124
  },
  {
    id: 'acc-2',
    provider: 'Microsoft Outlook 365',
    email: 'alex@riveracapital.com',
    owner: 'Alex Rivera (Corporate)',
    status: 'Connected',
    lastSync: '2 mins ago',
    totalSynced: 89
  }
];

// 1. Get Emails (with filtering, segmentation, and search)
app.get('/api/emails', (req, res) => {
  const { segment, search, responsibility } = req.query;
  let filtered = [...emailDatabase];

  if (responsibility) {
    filtered = filtered.filter(e => e.replyResponsibility === responsibility);
  }

  if (segment) {
    if (segment === 'client-reply') {
      filtered = filtered.filter(e => e.replyResponsibility === 'client');
    } else if (segment === 'assistant-reply') {
      filtered = filtered.filter(e => e.replyResponsibility === 'assistant');
    } else if (segment === 'no-reply') {
      filtered = filtered.filter(e => e.replyResponsibility === 'none');
    } else if (segment === 'action-required') {
      filtered = filtered.filter(e => e.actionRequired);
    } else if (segment === 'waiting') {
      filtered = filtered.filter(e => e.waitingForResponse);
    } else if (segment === 'meetings') {
      filtered = filtered.filter(e => e.extractedMeeting !== null);
    } else if (segment === 'important') {
      filtered = filtered.filter(e => e.starred || e.category === 'important');
    }
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(e =>
      e.subject.toLowerCase().includes(q) ||
      e.sender.toLowerCase().includes(q) ||
      e.summary.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// 2. Get Single Email
app.get('/api/emails/:id', (req, res) => {
  const email = emailDatabase.find(e => e.id === req.params.id);
  if (!email) return res.status(404).json({ success: false, message: 'Email not found' });
  email.read = true; // Mark read upon open
  res.json({ success: true, data: email });
});

// 3. Update Classification Manually (Assistant Override)
app.post('/api/emails/:id/classify', (req, res) => {
  const { responsibility, reason } = req.body;
  const email = emailDatabase.find(e => e.id === req.params.id);
  if (!email) return res.status(404).json({ success: false, message: 'Email not found' });

  email.replyResponsibility = responsibility;
  email.responsibilityReason = reason || `Manually overridden by Assistant to: ${responsibility.toUpperCase()}`;
  res.json({ success: true, message: 'Classification updated', data: email });
});

// 4. Client-Facing Actions (Approve, Delegate, Mark Handled)
app.post('/api/emails/:id/client-action', (req, res) => {
  const { action, note } = req.body; // 'handled' | 'delegate_to_assistant' | 'approved'
  const email = emailDatabase.find(e => e.id === req.params.id);
  if (!email) return res.status(404).json({ success: false, message: 'Email not found' });

  if (action === 'handled') {
    email.actionRequired = false;
    email.replyResponsibility = 'none';
    email.responsibilityReason = 'Marked as Handled by Client Alex Rivera.';
    email.history.push({
      sender: 'Alex Rivera (Client)',
      time: 'Just now',
      content: `[Client marked this matter as handled: "${note || 'Completed directly'}"]`
    });
  } else if (action === 'delegate_to_assistant') {
    email.replyResponsibility = 'assistant';
    email.responsibilityReason = `Delegated by Client to Assistant with note: "${note || 'Please follow up and handle.'}"`;
    email.history.push({
      sender: 'Alex Rivera (Client)',
      time: 'Just now',
      content: `[Delegated to Assistant: "${note || 'Please handle this on my behalf.'}"]`
    });
  } else if (action === 'approved') {
    email.actionRequired = false;
    email.history.push({
      sender: 'Alex Rivera (Client)',
      time: 'Just now',
      content: `[Approved by Client: "${note || 'Approved as requested. Proceeding.'}"]`
    });
  }

  res.json({ success: true, message: `Action '${action}' executed`, data: email });
});

// 5. AI Reply Generator (Tone-based professional assistant reply)
app.post('/api/emails/:id/draft-reply', (req, res) => {
  const { tone = 'professional', customInstructions = '' } = req.body;
  const email = emailDatabase.find(e => e.id === req.params.id);
  if (!email) return res.status(404).json({ success: false, message: 'Email not found' });

  let draftedText = '';
  const senderFirstName = email.sender.split(' ')[0] || 'there';

  if (email.id === 'em-102') {
    // Keynote scheduling
    if (tone === 'friendly') {
      draftedText = `Hi ${senderFirstName}!\n\nThanks so much for reaching out! Alex would love to deliver the keynote on October 14th at the Moscone Center.\n\nI coordinate Alex's executive calendar. Could you send over the technical requirements and the deadline for slide submission? Let's also set up a quick 10-minute briefing next week.\n\nBest,\nTaylor Vance\nExecutive Assistant to Alex Rivera`;
    } else if (tone === 'brief') {
      draftedText = `Hi ${senderFirstName},\n\nAlex is pleased to accept the keynote invitation for Oct 14th. Please forward speaker logistics and agreements directly to me for processing.\n\nRegards,\nTaylor Vance | Office of Alex Rivera`;
    } else {
      draftedText = `Dear ${senderFirstName},\n\nThank you for the kind invitation for Alex Rivera to deliver the keynote address at the Global AI Summit on October 14, 2026.\n\nOn behalf of Alex, I am delighted to confirm availability. Please send across the formal speaker agreement, AV requirements, and any briefing materials. I will ensure all logistics are coordinated promptly.\n\nSincerely,\nTaylor Vance\nExecutive Assistant to Alex Rivera\nRivera Capital Group`;
    }
  } else if (email.id === 'em-101') {
    // Term sheet
    draftedText = `Dear ${senderFirstName},\n\nThank you for transmitting the Series B Term Sheet. Alex has completed review of Section 4 regarding liquidation preferences. We are preparing the countersigned documents via DocuSign and will transmit them well ahead of your 5:00 PM EST deadline today.\n\nPlease confirm receipt of escrow instructions once delivered.\n\nBest regards,\nOffice of Alex Rivera`;
  } else if (email.id === 'em-105') {
    // NDA
    draftedText = `Hi ${senderFirstName},\n\nThank you for sharing your countersigned NDA. Please find attached our countersigned copy along with our completed W-8BEN vendor tax document for your finance department.\n\nLet us know if you require any additional vendor onboarding materials.\n\nBest regards,\nTaylor Vance\nOperations & Executive Support`;
  } else {
    // Generic fallback
    draftedText = `Hello ${senderFirstName},\n\nThank you for your email regarding "${email.subject}".\n\nI have reviewed the details on behalf of Alex Rivera. We are reviewing the matter and will provide the requested follow-up shortly.\n\nWarm regards,\nTaylor Vance\nExecutive Assistant to Alex Rivera`;
  }

  if (customInstructions) {
    draftedText += `\n\n[Note incorporated: ${customInstructions}]`;
  }

  res.json({
    success: true,
    draft: draftedText,
    subject: `Re: ${email.subject}`,
    toneUsed: tone
  });
});

// 6. AI Inbox Copilot / Q&A
app.post('/api/ai/copilot', (req, res) => {
  const { query } = req.body;
  const q = (query || '').toLowerCase();

  let answer = '';
  let relatedEmailIds = [];

  if (q.includes('attention') || q.includes('client') || q.includes('require')) {
    answer = 'Currently, there are 2 emails requiring the client Alex\'s direct attention:\n1. Term Sheet Approval from Sarah Jenkins (Apex Ventures) - $12M Series B approval due by 5 PM today.\n2. Personal dinner invitation from Elena Rostova in Zurich next Thursday.';
    relatedEmailIds = ['em-101', 'em-104'];
  } else if (q.includes('meeting') || q.includes('appointment') || q.includes('calendar')) {
    answer = 'I found 2 calendar-related items:\n1. Global AI Summit Keynote on Oct 14, 2026 (David Chen requested availability confirmation).\n2. Dinner invitation with Elena Rostova next Thursday at 7:30 PM (Kronenhalle, Zurich).';
    relatedEmailIds = ['em-102', 'em-104'];
  } else if (q.includes('waiting') || q.includes('pending')) {
    answer = 'You are currently waiting for responses or countersignatures on:\n1. David Chen regarding Keynote slot confirmation.\n2. Markus Lindholm regarding finalized vendor onboarding clearance.';
    relatedEmailIds = ['em-102', 'em-105'];
  } else if (q.includes('assistant') || q.includes('my task') || q.includes('i do')) {
    answer = 'Your top tasks as Executive Assistant right now:\n1. Confirm keynote speaker availability & schedule briefing with David Chen.\n2. Send countersigned NDA and tax W-8BEN form to Markus Lindholm.\n3. Monitor Series B Term Sheet sign-off before 5 PM deadline.';
    relatedEmailIds = ['em-102', 'em-105'];
  } else {
    answer = `Inbox Summary Analysis: Total 6 conversations tracked. 2 require Client attention, 2 assigned to Assistant for routine handling, and 2 are informational (no reply needed). Everything is synchronized with live Gmail and Outlook connections.`;
    relatedEmailIds = ['em-101', 'em-102', 'em-105'];
  }

  res.json({ success: true, answer, relatedEmailIds });
});

// 7. Get Accounts & Sync Status
app.get('/api/accounts', (req, res) => {
  res.json({ success: true, data: connectedAccounts });
});

// 8. Connect New Account (Simulated OAuth flow)
app.post('/api/accounts/connect', (req, res) => {
  const { provider, email } = req.body;
  const newAcc = {
    id: `acc-${Date.now()}`,
    provider: provider || 'Google Workspace (Gmail)',
    email: email || 'alex.work@company.com',
    owner: 'Alex Rivera',
    status: 'Connected & Synced',
    lastSync: 'Just now',
    totalSynced: Math.floor(Math.random() * 50) + 10
  };
  connectedAccounts.push(newAcc);
  res.json({ success: true, message: `${provider} successfully connected and synchronized!`, account: newAcc });
});

// 9. Aggregate Dashboard Stats
app.get('/api/stats', (req, res) => {
  const total = emailDatabase.length;
  const unread = emailDatabase.filter(e => !e.read).length;
  const clientReply = emailDatabase.filter(e => e.replyResponsibility === 'client').length;
  const assistantReply = emailDatabase.filter(e => e.replyResponsibility === 'assistant').length;
  const noReply = emailDatabase.filter(e => e.replyResponsibility === 'none').length;
  const meetings = emailDatabase.filter(e => e.extractedMeeting !== null).length;
  const actionReq = emailDatabase.filter(e => e.actionRequired).length;

  res.json({
    success: true,
    stats: {
      total,
      unread,
      clientReply,
      assistantReply,
      noReply,
      meetings,
      actionRequired: actionReq
    }
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 AI Email Assistant Backend running at:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
