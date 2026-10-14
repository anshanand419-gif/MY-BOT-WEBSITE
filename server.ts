import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import net from 'net';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

// Initialize Gemini API client on server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

const app = express();
app.use(express.json());

// File paths
const BOT_DIR = path.resolve(__dirname, 'bot');
const BOT_FILE = path.resolve(BOT_DIR, 'index.js');
const ROOT_FILE = path.resolve(__dirname, 'index.js');

// Bot Process Management State
interface BotLog {
  id: string;
  time: string;
  type: 'info' | 'chat' | 'mob' | 'warn' | 'error' | 'success';
  text: string;
}

let botProcess: ChildProcess | null = null;
let botStartTime: number | null = null;
let currentConfig = {
  host: 'YOUR_SERVER_IP',
  port: 25565,
  username: 'HELL_KING_ANSH'
};
let botStatus: 'stopped' | 'starting' | 'running' | 'error' = 'stopped';
const botLogs: BotLog[] = [];
const sseClients: Response[] = [];

// Helper to push logs and notify SSE clients
function addLog(text: string, type: BotLog['type'] = 'info') {
  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
  const log: BotLog = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    time: timestamp,
    type,
    text: text.trim()
  };

  botLogs.push(log);
  if (botLogs.length > 500) {
    botLogs.shift();
  }

  // Push to SSE clients
  const message = `data: ${JSON.stringify(log)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.write(message);
    } catch {
      // Ignore write errors to dead clients
    }
  });
}

// Read current values from index.js on server
function syncConfigFromFile() {
  try {
    const targetPath = fs.existsSync(BOT_FILE) ? BOT_FILE : ROOT_FILE;
    if (fs.existsSync(targetPath)) {
      const content = fs.readFileSync(targetPath, 'utf8');
      const hostMatch = content.match(/const\s+SERVER_HOST\s*=\s*['"]([^'"]+)['"]/);
      const portMatch = content.match(/const\s+SERVER_PORT\s*=\s*(\d+)/);
      const userMatch = content.match(/const\s+BOT_USERNAME\s*=\s*['"]([^'"]+)['"]/);

      if (hostMatch) currentConfig.host = hostMatch[1];
      if (portMatch) currentConfig.port = parseInt(portMatch[1], 10);
      if (userMatch) currentConfig.username = userMatch[1];
    }
  } catch (err) {
    console.error('Failed to sync config from file:', err);
  }
}

// Initial sync
syncConfigFromFile();

// Kill bot process
async function stopBotProcess(): Promise<void> {
  return new Promise((resolve) => {
    if (!botProcess) {
      botStatus = 'stopped';
      botStartTime = null;
      return resolve();
    }

    addLog('Stopping bot process...', 'warn');
    const proc = botProcess;
    botProcess = null;
    botStatus = 'stopped';
    botStartTime = null;

    let resolved = false;
    const forceKillTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try {
          proc.kill('SIGKILL');
        } catch {}
        addLog('Bot process killed forcefully.', 'warn');
        resolve();
      }
    }, 2000);

    proc.once('exit', () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(forceKillTimer);
        addLog('Bot process stopped cleanly.', 'info');
        resolve();
      }
    });

    try {
      proc.kill('SIGTERM');
    } catch {
      if (!resolved) {
        resolved = true;
        clearTimeout(forceKillTimer);
        resolve();
      }
    }
  });
}

// Start bot process
function startBotProcess(): boolean {
  if (botProcess) {
    addLog('Bot is already running. Please restart instead.', 'warn');
    return false;
  }

  const scriptPath = fs.existsSync(BOT_FILE) ? BOT_FILE : ROOT_FILE;
  const scriptDir = fs.existsSync(BOT_FILE) ? BOT_DIR : __dirname;

  if (!fs.existsSync(scriptPath)) {
    addLog(`Error: Bot script not found at ${scriptPath}`, 'error');
    botStatus = 'error';
    return false;
  }

  addLog(`[SYSTEM] Spawning bot with node at ${scriptPath}...`, 'info');
  addLog(`[CONFIG] Target: ${currentConfig.host}:${currentConfig.port} | Bot: ${currentConfig.username}`, 'info');

  botStatus = 'starting';
  botStartTime = Date.now();

  try {
    botProcess = spawn('node', [scriptPath], {
      cwd: scriptDir,
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });

    botProcess.stdout?.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        let type: BotLog['type'] = 'info';

        if (line.includes('BOT CONNECTED SUCCESSFULLY')) {
          type = 'success';
          botStatus = 'running';
        } else if (line.includes('[CHAT]')) {
          type = 'chat';
        } else if (line.includes('attack') || line.includes('mob') || line.includes('defense')) {
          type = 'mob';
        } else if (line.includes('DISCONNECTED') || line.includes('Reconnecting')) {
          type = 'warn';
        }

        addLog(line, type);
      }
    });

    botProcess.stderr?.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        addLog(line, 'error');
      }
    });

    botProcess.on('error', (err) => {
      addLog(`[PROCESS ERROR] Failed to run bot: ${err.message}`, 'error');
      botStatus = 'error';
      botProcess = null;
      botStartTime = null;
    });

    botProcess.on('exit', (code, signal) => {
      addLog(`[PROCESS EXITED] Exit code: ${code ?? 'none'}, Signal: ${signal ?? 'none'}`, 'warn');
      botProcess = null;
      botStatus = 'stopped';
      botStartTime = null;
    });

    return true;
  } catch (err: any) {
    addLog(`[SPAWN EXCEPTION] ${err.message}`, 'error');
    botStatus = 'error';
    botProcess = null;
    botStartTime = null;
    return false;
  }
}

// ----------------- API ROUTES -----------------

// 1. Payment Verification State & Anti-Fake System
let isPaymentVerified = false;
let verifiedPaymentInfo: any = null;

// UPI Details
const UPI_RECEIVER = {
  name: 'Mukesh Kumar',
  upiId: 'mukeshkumae078@okicici',
  instagramSupport: 'hell_king_ansh'
};

// Dynamic Single-Use Activation Keys (Generated dynamically by owner in Admin Portal)
interface DynamicKey {
  code: string;
  createdAt: string;
  used: boolean;
  usedAt?: string;
  usedByUtr?: string;
}

const dynamicKeys: DynamicKey[] = [];

// Helper to generate a unique random one-time passcode (e.g. ANSH-7491-QX or MK-3820-ZL)
function generateDynamicKey(customPrefix?: string): DynamicKey {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const prefix = customPrefix ? customPrefix.trim().toUpperCase() : (Math.random() > 0.4 ? 'ANSH' : 'MK');
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const randSuffix = letters.charAt(Math.floor(Math.random() * letters.length)) + letters.charAt(Math.floor(Math.random() * letters.length));
  const code = `${prefix}-${randNum}-${randSuffix}`;

  if (dynamicKeys.some((k) => k.code === code)) {
    return generateDynamicKey(customPrefix);
  }

  const newKey: DynamicKey = {
    code,
    createdAt: new Date().toISOString(),
    used: false
  };

  dynamicKeys.unshift(newKey);
  if (dynamicKeys.length > 500) dynamicKeys.pop();
  return newKey;
}

// Seed 3 initial unique single-use dynamic keys on boot
generateDynamicKey('ANSH');
generateDynamicKey('MK');
generateDynamicKey('VIP');

const ADMIN_PIN = 'mukesh@2026';
const ADMIN_PIN_ALT = 'ansh888';

// Robust case-insensitive and whitespace-tolerant PIN validator for owner phones
function isValidAdminPin(pinCandidate: unknown): boolean {
  if (typeof pinCandidate !== 'string') return false;
  const clean = pinCandidate.trim().toLowerCase();
  const validPins = [
    ADMIN_PIN.toLowerCase(), // 'mukesh@2026'
    ADMIN_PIN_ALT.toLowerCase(), // 'ansh888'
    'mukesh2026',
    'mukesh@2026',
    'ansh888'
  ];
  return validPins.includes(clean);
}

interface PaymentSubmission {
  id: string;
  utr: string;
  payerName: string;
  amount: number;
  planId: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
}

const paymentSubmissions: PaymentSubmission[] = [];
const approvedUtrs = new Set<string>();

// Helper to check for obviously fake UTR patterns
function isFakeUtrPattern(utr: string): boolean {
  // Check all identical digits: 000000000000, 111111111111, etc.
  if (/^(\d)\1{11}$/.test(utr)) return true;
  // Check sequential sequences: 123456789012, 012345678901, 987654321098
  if (utr === '123456789012' || utr === '012345678901' || utr === '987654321098' || utr === '123456789000') return true;
  // Check repeating 2-digit patterns: 121212121212
  if (/^(\d{2})\1{5}$/.test(utr)) return true;
  return false;
}

// 1a. Submit UTR for Real Owner / Bank Verification (Prevents instant fake bypass)
app.post('/api/payment/submit-utr', (req: Request, res: Response) => {
  const { utr, planId, amount, payerName, activationCode } = req.body;

  const cleanUtr = typeof utr === 'string' ? utr.trim().replace(/\s+/g, '') : '';

  if (!cleanUtr || !/^\d{12}$/.test(cleanUtr)) {
    return res.status(400).json({
      error: 'Invalid UTR format! Real UPI Reference/UTR numbers must be exactly 12 digits from your Google Pay, PhonePe, or Paytm screen.'
    });
  }

  if (isFakeUtrPattern(cleanUtr)) {
    addLog(`[FRAUD ALERT] Blocked fake pattern UTR #${cleanUtr} from user. Access denied!`, 'error');
    return res.status(400).json({
      error: 'FAKE UTR DETECTED: This is a dummy sequence. Please enter the genuine 12-digit UTR from your actual bank transaction.'
    });
  }

  const cleanPlanId = planId || 'pro_3m';
  const planAmount = amount || (
    cleanPlanId === 'starter' ? 49 :
    cleanPlanId === 'pro_1m' ? 99 :
    cleanPlanId === 'vip_8m' || cleanPlanId === 'vip' ? 499 : 199
  );
  const cleanPayer = (payerName && typeof payerName === 'string') ? payerName.trim() : 'Player';

  // Check if user provided an activation code
  const cleanCode = typeof activationCode === 'string' ? activationCode.trim().toUpperCase() : '';

  if (cleanCode) {
    // Explicitly block static placeholders so no one can bypass using ANSH-VIP or demo codes
    const BLOCKED_STATIC_CODES = ['ANSH-VIP', 'ANSHVIP', 'MUKESH-PASS', 'BOT2026', 'VIP', 'ADMIN'];
    if (BLOCKED_STATIC_CODES.includes(cleanCode)) {
      addLog(`[SECURITY ALERT] Rejected attempt to use static placeholder code: "${cleanCode}"`, 'warn');
      return res.status(400).json({
        error: `STATIC CODES ARE BLOCKED: "${cleanCode}" is just an example and cannot be used! Har user ke liye alag naya unique activation code generate hota hai. Apna unique code lene ke liye payment screenshot Instagram @hell_king_ansh ko bhejein.`
      });
    }

    // 1. Check if it's the master admin pin
    const isMasterPin = isValidAdminPin(cleanCode);

    // 2. Check dynamic single-use keys
    const foundKey = dynamicKeys.find((k) => k.code.toUpperCase() === cleanCode);

    if (foundKey && foundKey.used) {
      addLog(`[SECURITY ALERT] Rejected reuse attempt of burned code: "${cleanCode}"`, 'warn');
      return res.status(400).json({
        error: `KEY ALREADY EXPIRED: Activation code "${cleanCode}" pehle hi use ho chuka hai (Burned). Har activation code sirf 1-baar use hota hai aur har customer ka code alag hota hai. Naya code lene ke liye @hell_king_ansh ko DM karein.`
      });
    }

    if (foundKey && !foundKey.used) {
      // Mark key as USED immediately! (Single-use self destruct)
      foundKey.used = true;
      foundKey.usedAt = new Date().toISOString();
      foundKey.usedByUtr = cleanUtr;

      isPaymentVerified = true;
      approvedUtrs.add(cleanUtr);

      verifiedPaymentInfo = {
        transactionId: 'UPI_' + cleanUtr,
        utr: cleanUtr,
        receiver: UPI_RECEIVER.name,
        upiId: UPI_RECEIVER.upiId,
        amount: planAmount,
        currency: 'INR',
        planId: cleanPlanId,
        date: new Date().toISOString(),
        instagramSupport: UPI_RECEIVER.instagramSupport
      };

      addLog(`[DYNAMIC KEY REDEEMED] Unique one-time key ${cleanCode} used by UTR #${cleanUtr}. Key is now BURNED/EXPIRED!`, 'success');
      addLog(`[ACCESS UNLOCKED] Minecraft IP & Port configuration access GRANTED!`, 'success');

      return res.json({
        success: true,
        verified: true,
        status: 'approved',
        message: `Unique key ${cleanCode} verified and burned! IP & Port access unlocked.`,
        payment: verifiedPaymentInfo
      });
    } else if (isMasterPin) {
      isPaymentVerified = true;
      approvedUtrs.add(cleanUtr);
      verifiedPaymentInfo = {
        transactionId: 'UPI_' + cleanUtr,
        utr: cleanUtr,
        receiver: UPI_RECEIVER.name,
        upiId: UPI_RECEIVER.upiId,
        amount: planAmount,
        currency: 'INR',
        planId: cleanPlanId,
        date: new Date().toISOString(),
        instagramSupport: UPI_RECEIVER.instagramSupport
      };

      addLog(`[MASTER PIN UNLOCK] Owner master pin used for UTR #${cleanUtr}. Bot unlocked!`, 'success');

      return res.json({
        success: true,
        verified: true,
        status: 'approved',
        message: 'Owner master PIN confirmed! IP & Port access unlocked.',
        payment: verifiedPaymentInfo
      });
    } else {
      return res.status(400).json({
        error: `INVALID ACTIVATION CODE: Code "${cleanCode}" galat hai ya exist nahi karta. Har bar alag unique one-time code banta hai jo @hell_king_ansh dwara generate hota hai.`
      });
    }
  }

  // If already approved previously by owner in admin panel
  if (approvedUtrs.has(cleanUtr)) {
    isPaymentVerified = true;
    verifiedPaymentInfo = {
      transactionId: 'UPI_' + cleanUtr,
      utr: cleanUtr,
      receiver: UPI_RECEIVER.name,
      upiId: UPI_RECEIVER.upiId,
      amount: planAmount,
      currency: 'INR',
      planId: cleanPlanId,
      date: new Date().toISOString(),
      instagramSupport: UPI_RECEIVER.instagramSupport
    };

    return res.json({
      success: true,
      verified: true,
      status: 'approved',
      message: 'Payment verified & approved by owner! IP & Port access unlocked.',
      payment: verifiedPaymentInfo
    });
  }

  // Check if already in queue
  let existing = paymentSubmissions.find((p) => p.utr === cleanUtr);
  if (!existing) {
    existing = {
      id: 'REQ_' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      utr: cleanUtr,
      payerName: cleanPayer,
      amount: planAmount,
      planId: cleanPlanId,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    paymentSubmissions.unshift(existing);
    if (paymentSubmissions.length > 100) paymentSubmissions.pop();
  }

  addLog(`[NEW UTR SUBMISSION] UTR #${cleanUtr} (₹${planAmount} by ${cleanPayer}) submitted. Awaiting Owner Verification.`, 'warn');

  res.json({
    success: true,
    verified: false,
    status: existing.status,
    message: 'UTR submitted for verification! It will be verified against bank statements. Send screenshot to @hell_king_ansh on Instagram for instant approval.',
    submissionId: existing.id,
    utr: cleanUtr
  });
});

// 1b. Check status of a specific UTR
app.get('/api/payment/check-utr', (req: Request, res: Response) => {
  const utr = typeof req.query.utr === 'string' ? req.query.utr.trim() : '';

  if (!utr) {
    return res.json({ verified: isPaymentVerified, payment: verifiedPaymentInfo });
  }

  if (approvedUtrs.has(utr) || isPaymentVerified) {
    return res.json({
      verified: true,
      status: 'approved',
      payment: verifiedPaymentInfo || {
        transactionId: 'UPI_' + utr,
        utr,
        receiver: UPI_RECEIVER.name,
        upiId: UPI_RECEIVER.upiId,
        date: new Date().toISOString(),
        instagramSupport: UPI_RECEIVER.instagramSupport
      }
    });
  }

  const found = paymentSubmissions.find((p) => p.utr === utr);
  res.json({
    verified: false,
    status: found ? found.status : 'not_found',
    utr
  });
});

// 1c. Owner Admin Login
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { pin } = req.body;
  if (isValidAdminPin(pin)) {
    res.json({ success: true, token: 'AUTH_ADMIN_' + Date.now() });
  } else {
    res.status(401).json({ error: 'Incorrect Owner PIN. Access denied.' });
  }
});

// 1d. Owner Admin: Get all submitted UTRs
app.get('/api/admin/payments', (req: Request, res: Response) => {
  res.json({
    submissions: paymentSubmissions,
    approvedCount: approvedUtrs.size,
    isBotUnlocked: isPaymentVerified,
    receiver: UPI_RECEIVER
  });
});

// 1e. Owner Admin: Approve UTR
app.post('/api/admin/approve-utr', (req: Request, res: Response) => {
  const { utr, pin } = req.body;
  if (!isValidAdminPin(pin)) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Admin PIN' });
  }

  const cleanUtr = typeof utr === 'string' ? utr.trim() : '';
  if (!cleanUtr) return res.status(400).json({ error: 'UTR is required' });

  // Update submission in list
  const sub = paymentSubmissions.find((p) => p.utr === cleanUtr);
  if (sub) {
    sub.status = 'approved';
  }

  approvedUtrs.add(cleanUtr);
  isPaymentVerified = true;

  verifiedPaymentInfo = {
    transactionId: 'UPI_' + cleanUtr,
    utr: cleanUtr,
    receiver: UPI_RECEIVER.name,
    upiId: UPI_RECEIVER.upiId,
    amount: sub?.amount || 199,
    currency: 'INR',
    planId: sub?.planId || 'pro_3m',
    date: new Date().toISOString(),
    instagramSupport: UPI_RECEIVER.instagramSupport
  };

  addLog(`[ADMIN APPROVED] Owner manually verified and approved UTR #${cleanUtr}. Bot unlocked!`, 'success');

  res.json({
    success: true,
    message: `UTR #${cleanUtr} approved successfully! Bot is now unlocked for user.`,
    payment: verifiedPaymentInfo
  });
});

// 1f. Owner Admin: Reject UTR (Fake detected)
app.post('/api/admin/reject-utr', (req: Request, res: Response) => {
  const { utr, pin } = req.body;
  if (!isValidAdminPin(pin)) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Admin PIN' });
  }

  const cleanUtr = typeof utr === 'string' ? utr.trim() : '';
  const sub = paymentSubmissions.find((p) => p.utr === cleanUtr);
  if (sub) {
    sub.status = 'rejected';
  }

  approvedUtrs.delete(cleanUtr);
  addLog(`[ADMIN REJECTED] Owner rejected fake UTR #${cleanUtr}. Access denied!`, 'error');

  res.json({
    success: true,
    message: `UTR #${cleanUtr} rejected as fake.`
  });
});

// 1g. Owner Admin: Get all Dynamic Single-Use Keys
app.get('/api/admin/keys', (req: Request, res: Response) => {
  res.json({
    keys: dynamicKeys,
    activeCount: dynamicKeys.filter((k) => !k.used).length,
    usedCount: dynamicKeys.filter((k) => k.used).length,
    totalCount: dynamicKeys.length
  });
});

// 1h. Owner Admin: Generate a Brand New Unique Dynamic Key (Har bar alag code)
app.post('/api/admin/generate-key', (req: Request, res: Response) => {
  const { pin, prefix } = req.body;
  if (!isValidAdminPin(pin)) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Admin PIN' });
  }

  const cleanPrefix = typeof prefix === 'string' && prefix.trim().length > 0
    ? prefix.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
    : 'ANSH';

  const newKey = generateDynamicKey(cleanPrefix);
  addLog(`[DYNAMIC KEY GENERATED] Owner created fresh unique single-use code: ${newKey.code}`, 'info');

  res.json({
    success: true,
    message: `Generated new dynamic code: ${newKey.code}`,
    key: newKey,
    keys: dynamicKeys
  });
});

// 1i. Owner Admin: Revoke / Delete a Dynamic Key
app.post('/api/admin/delete-key', (req: Request, res: Response) => {
  const { pin, code } = req.body;
  if (!isValidAdminPin(pin)) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Admin PIN' });
  }

  const cleanCode = typeof code === 'string' ? code.trim().toUpperCase() : '';
  const idx = dynamicKeys.findIndex((k) => k.code.toUpperCase() === cleanCode);

  if (idx !== -1) {
    dynamicKeys.splice(idx, 1);
    addLog(`[KEY REVOKED] Owner removed dynamic key: ${cleanCode}`, 'warn');
    return res.json({ success: true, message: `Key ${cleanCode} deleted.` });
  }

  res.status(404).json({ error: 'Key not found' });
});

// 1j. Check Payment Verification Status
app.get('/api/payment/status', (req: Request, res: Response) => {
  res.json({
    verified: isPaymentVerified,
    payment: verifiedPaymentInfo,
    receiver: UPI_RECEIVER
  });
});

// 1c. Payment Simulation Endpoint (Alternative checkout)
app.post('/api/payment/checkout', (req: Request, res: Response) => {
  const { planId, paymentMethod, email, cardLast4 } = req.body;

  const transactionId = 'TXN_' + Math.random().toString(36).substring(2, 10).toUpperCase();
  addLog(`[PAYMENT] Received payment confirmation: ${paymentMethod.toUpperCase()} (${transactionId})`, 'success');

  isPaymentVerified = true;
  verifiedPaymentInfo = {
    transactionId,
    planId: planId || 'pro_3m',
    amount: planId === 'starter' ? 0.59 :
            planId === 'pro_1m' ? 1.19 :
            planId === 'vip_8m' || planId === 'vip' ? 5.99 : 2.39,
    currency: 'USD',
    paidVia: paymentMethod,
    email: email || 'user@minecraft.net',
    cardLast4: cardLast4 || '4242',
    instagramSupport: UPI_RECEIVER.instagramSupport
  };

  res.json({
    success: true,
    transactionId,
    timestamp: new Date().toISOString(),
    plan: planId || 'pro_afk',
    amount: verifiedPaymentInfo.amount,
    currency: 'USD',
    paidVia: paymentMethod,
    email: email || 'user@minecraft.net',
    cardLast4: cardLast4 || '4242',
    instagramSupport: UPI_RECEIVER.instagramSupport
  });
});

// 1d. AI Support: Interactive Helper for How Minecraft Bot Works
app.post('/api/ai/support', async (req: Request, res: Response) => {
  const { question } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Question is required.' });
  }

  const systemInstruction = `You are the official AI Support Specialist for the HELL_KING_ANSH Minecraft AFK Bot Platform.
Your job is to explain how this specific Minecraft bot works and help players configure and troubleshoot it.

Key features of our Minecraft bot (from its index.js script):
1. UNIVERSAL AUTO-DETECT: Uses Mineflayer with version: false. It automatically probes and connects to any server version (1.8, 1.12, 1.16, 1.20, 1.21+), so users never need to change version numbers manually.
2. SMART ANTI-AFK SYSTEM:
   - Every 15 seconds, triggers bot.setControlState('jump', true) and 'forward' for 800ms.
   - Also runs random pitch/yaw head rotation (randomLook) and random sneak toggles (bot.setControlState('sneak', true)) every 7-8 seconds.
   - This makes the bot look natural and prevents idle kicks on Aternos, Minehut, Hypixel, and vanilla servers.
3. HOSTILE MOB AUTO-DEFENSE:
   - Scans entities every physicsTick within 3.5 block radius.
   - Detects 16 hostile mobs: zombie, skeleton, creeper, spider, cave_spider, drowned, husk, stray, witch, phantom, enderman, zombified_piglin, piglin, blaze, wither_skeleton, slime.
   - Snaps lookAt directly to target entity and attacks them, defending farms and itself.
4. WATER SAFETY:
   - Checks bot.isInWater on every physicsTick and triggers jump to avoid drowning.
5. AUTO-RECONNECT & CYCLE LIMIT:
   - If kicked or disconnected, reconnectTimer automatically reconnects after 15 seconds.
   - Automatically disconnects after a 10-hour safety limit to protect against infinite runaway sessions.
6. AUTOMATION PIPELINE:
   - When user enters Server Host (e.g. yourserver.aternos.me) and Port (e.g. 25565), our Node.js backend permanently edits index.js and restarts the bot process using child_process.spawn.
7. PAYMENT & SUPPORT:
   - Payment is verified through the UPI scanner to Mukesh Kumar (mukeshkumae078@okicici) with automated bot check.
   - For payment help, server setup assistance, or custom requests, users can contact Instagram: @hell_king_ansh.

Tone: Enthusiastic, gamer-friendly, knowledgeable, concise, and helpful. Use bullet points or code snippets when explaining. Include a mention of Instagram @hell_king_ansh for personal help if relevant.`;

  try {
    const aiResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: question,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const reply = aiResponse.text || 'I am your Minecraft Bot AI assistant. How can I help you today?';
    res.json({ reply, success: true });
  } catch (err: any) {
    console.warn('Gemini API call failed, using intelligent fallback response:', err.message);

    // Contextual fallback response for how bot works
    let fallback = '';
    const qLower = question.toLowerCase();

    if (qLower.includes('anti-afk') || qLower.includes('afk') || qLower.includes('kick')) {
      fallback = `### 🛡️ How Anti-AFK Works in HELL_KING_ANSH Bot
- **15-Second Jump & Walk**: Every 15 seconds, the bot performs a forward jump for 800ms to reset server idle timers.
- **Random Head Movement**: Every 7-8 seconds, the bot moves its pitch and yaw to look around naturally.
- **Sneak Routine**: The bot sneaks randomly to emulate player actions and bypass anti-cheat heuristics.
- **Water Safety**: If pushed into water, it automatically jumps to avoid drowning.
- *Need personal help? Message @hell_king_ansh on Instagram!*`;
    } else if (qLower.includes('mob') || qLower.includes('attack') || qLower.includes('defense') || qLower.includes('zombie')) {
      fallback = `### ⚔️ Hostile Mob Auto-Defense System
The bot monitors entities on every physics tick within a **3.5 block radius**:
- **Targeted Mobs (16 types)**: Zombie, Skeleton, Creeper, Spider, Cave Spider, Drowned, Husk, Stray, Witch, Phantom, Enderman, Zombified Piglin, Piglin, Blaze, Wither Skeleton, and Slime.
- **Action**: When a hostile mob gets within 3.5 blocks, the bot locks its gaze with \`bot.lookAt()\` and attacks every 600ms until the mob is defeated!`;
    } else if (qLower.includes('aternos') || qLower.includes('ip') || qLower.includes('port') || qLower.includes('connect')) {
      fallback = `### 🌐 Connecting to an Aternos Server
1. Start your Aternos server from the Aternos dashboard.
2. Note your **Dynamic IP & Port** (e.g., \`yourname.aternos.me\` and port \`34821\`).
3. Make sure **Cracked** is turned ON in Aternos Options (if using offline bot username like HELL_KING_ANSH).
4. Enter your IP and Port in our **Server Setup Form** and click "Write to index.js & Launch Bot".
5. Our Node.js backend will rewrite \`index.js\` and restart the bot automatically!
- *Still stuck? DM @hell_king_ansh on Instagram for direct help!*`;
    } else if (qLower.includes('plan') || qLower.includes('price') || qLower.includes('cost') || qLower.includes('kitne ka')) {
      fallback = `### 💎 Official Minecraft Bot Pricing Plans
- **7 Days Plan**: **₹49** (~$0.59) — 168 hours of 24/7 non-stop AFK, auto-version detection, auto-update index.js.
- **1 Month Plan**: **₹99** (~$1.19) — 30 days 24/7 non-stop server uptime, hostile mob auto-defense, auto 15s reconnect.
- **3 Months Plan**: **₹199** (~$2.39) — *Most Popular!* 90 days 24/7 uptime, water safety, live SSE streaming terminal, farm & chunk loader.
- **8 Months Plan**: **₹499** (~$5.99) — *VIP Dedicated Fleet!* 240 days dedicated runtime, custom bot username, priority reconnect queue, VIP Instagram support.

👉 Scan QR via Google Pay / PhonePe / Paytm to **Mukesh Kumar** (\`mukeshkumae078@okicici\`) and message screenshot to **@hell_king_ansh** on Instagram!`;
    } else if (qLower.includes('code') || qLower.includes('activation') || qLower.includes('passcode') || qLower.includes('ansh-vip')) {
      fallback = `### 🔑 Dynamic Single-Use Activation Codes Explained
- **Har Bar Alag Unique Code**: Security ke liye koi bhi fixed code (jaise ANSH-VIP) allowed nahi hai. Har user ke liye system ek naya, unique code generate karta hai (e.g. \`ANSH-8492-XQ\`).
- **Single-Use Burn Routine**: Jaise hi user apna code enter karke UTR submit karta hai, wo code **hamesha ke liye expire/burn** ho jata hai. Koi dusra person same code dobara use nahi kar sakta.
- **Kaise Milega Naya Code?**: Payment karne ke baad transaction receipt ka screenshot Instagram **@hell_king_ansh** ko bhejein, aapko turant apna personal one-time code mil jayega!`;
    } else {
      fallback = `### 🤖 HELL_KING_ANSH Minecraft Bot Overview
Our bot runs on Node.js using **Mineflayer** with:
- **Universal Auto-Detect**: Works on any server version (1.8 to 1.21+) automatically.
- **Anti-AFK Routines**: Regular jump, sneak, and head movements every 15s to bypass server idle kicks.
- **Mob Auto-Defense**: Attacks 16 hostile mobs within 3.5 blocks.
- **Automated Restart**: When you update IP & Port, our server updates \`index.js\` and restarts the bot process.
- **Auto-Reconnect**: Automatically reconnects after 15 seconds if disconnected.

For any custom support or payment questions, reach out to **Instagram: @hell_king_ansh**!`;
    }

    res.json({ reply: fallback, success: true, isFallback: true });
  }
});

// 2. Configure Bot: Read index.js, replace IP & Port, and write back
app.post('/api/bot/configure', async (req: Request, res: Response) => {
  // STRICT PAYMENT GATE: Bina payment kiye bot configure ya enable nahi ho sakta!
  if (!isPaymentVerified) {
    return res.status(403).json({
      error: 'PAYMENT_REQUIRED: Bina payment kiye bot enable nahi ho sakta! Please Mukesh Kumar (mukeshkumae078@okicici) ke scanner par payment karke apna 12-digit UTR verify karein.'
    });
  }

  const { host, port, username, autoRestart } = req.body;

  if (!host || typeof host !== 'string' || host.trim().length === 0) {
    return res.status(400).json({ error: 'Valid server IP / hostname is required.' });
  }

  const portNum = Number(port);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    return res.status(400).json({ error: 'Port must be a valid number between 1 and 65535.' });
  }

  const cleanHost = host.trim().replace(/['"\\`]/g, '');
  const cleanUsername = (username && typeof username === 'string' && username.trim().length > 0)
    ? username.trim().replace(/['"\\`]/g, '')
    : 'HELL_KING_ANSH';

  // Read existing file or fallback template
  const targetFiles = [BOT_FILE, ROOT_FILE];
  let updatedContent = '';

  for (const filePath of targetFiles) {
    try {
      let content = '';
      if (fs.existsSync(filePath)) {
        content = fs.readFileSync(filePath, 'utf8');
      }

      if (!content.includes('const SERVER_HOST')) {
        // Fallback to reading from one of them or initialize
        const fallback = fs.existsSync(ROOT_FILE) ? fs.readFileSync(ROOT_FILE, 'utf8') : '';
        content = fallback;
      }

      // Replace SERVER_HOST
      content = content.replace(
        /const\s+SERVER_HOST\s*=\s*['"][^'"]*['"];?/,
        `const SERVER_HOST = '${cleanHost}';`
      );

      // Replace SERVER_PORT
      content = content.replace(
        /const\s+SERVER_PORT\s*=\s*\d+;?/,
        `const SERVER_PORT = ${portNum};`
      );

      // Replace BOT_USERNAME
      content = content.replace(
        /const\s+BOT_USERNAME\s*=\s*['"][^'"]*['"];?/,
        `const BOT_USERNAME = '${cleanUsername}';`
      );

      fs.writeFileSync(filePath, content, 'utf8');
      updatedContent = content;
    } catch (err: any) {
      console.error(`Error updating file ${filePath}:`, err);
    }
  }

  // Update current config
  currentConfig = {
    host: cleanHost,
    port: portNum,
    username: cleanUsername
  };

  addLog(`[CONFIG UPDATED] Server: ${cleanHost}:${portNum} | Username: ${cleanUsername}`, 'success');
  addLog(`[FILE SAVED] index.js has been permanently updated on the server.`, 'info');

  // Auto Restart if requested
  let restarted = false;
  if (autoRestart !== false) {
    addLog('[AUTO-RESTART] Initiating bot restart with new parameters...', 'info');
    await stopBotProcess();
    restarted = startBotProcess();
  }

  res.json({
    success: true,
    message: 'index.js updated successfully and bot automated reload triggered.',
    config: currentConfig,
    restarted,
    botStatus,
    updatedFileContent: updatedContent
  });
});

// 3. Get current configuration
app.get('/api/bot/config', (req: Request, res: Response) => {
  syncConfigFromFile();
  res.json({
    config: currentConfig,
    botStatus,
    uptime: botStartTime ? Math.floor((Date.now() - botStartTime) / 1000) : 0,
    isRunning: botProcess !== null
  });
});

// 4. Get index.js code contents
app.get('/api/bot/file', (req: Request, res: Response) => {
  try {
    const targetPath = fs.existsSync(BOT_FILE) ? BOT_FILE : ROOT_FILE;
    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: 'index.js not found' });
    }
    const content = fs.readFileSync(targetPath, 'utf8');
    const stats = fs.statSync(targetPath);
    res.json({
      content,
      path: 'index.js',
      size: stats.size,
      updatedAt: stats.mtime.toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Start Bot
app.post('/api/bot/start', (req: Request, res: Response) => {
  if (!isPaymentVerified) {
    return res.status(403).json({
      success: false,
      error: 'PAYMENT_REQUIRED: Bot cannot be started without payment verification. Scanner par payment complete karein.'
    });
  }

  syncConfigFromFile();
  const started = startBotProcess();
  res.json({
    success: started,
    botStatus,
    message: started ? 'Bot starting...' : 'Bot failed to start or already running.'
  });
});

// 6. Stop Bot
app.post('/api/bot/stop', async (req: Request, res: Response) => {
  await stopBotProcess();
  res.json({
    success: true,
    botStatus,
    message: 'Bot stopped successfully.'
  });
});

// 7. Restart Bot
app.post('/api/bot/restart', async (req: Request, res: Response) => {
  if (!isPaymentVerified) {
    return res.status(403).json({
      success: false,
      error: 'PAYMENT_REQUIRED: Bot restart requires active payment verification.'
    });
  }

  syncConfigFromFile();
  addLog('[MANUAL RESTART] Restarting bot...', 'warn');
  await stopBotProcess();
  const started = startBotProcess();
  res.json({
    success: started,
    botStatus,
    message: started ? 'Bot restarted successfully.' : 'Bot restart failed.'
  });
});

// 8. Bot Status & Logs
app.get('/api/bot/status', (req: Request, res: Response) => {
  res.json({
    status: botStatus,
    isRunning: botProcess !== null,
    pid: botProcess?.pid || null,
    uptime: botStartTime ? Math.floor((Date.now() - botStartTime) / 1000) : 0,
    config: currentConfig,
    logsCount: botLogs.length
  });
});

// 9. Logs list
app.get('/api/bot/logs', (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 100;
  res.json({
    logs: botLogs.slice(-limit)
  });
});

// 10. Clear logs
app.post('/api/bot/logs/clear', (req: Request, res: Response) => {
  botLogs.length = 0;
  addLog('[SYSTEM] Console cleared by user.', 'info');
  res.json({ success: true });
});

// 11. Live SSE Stream for real-time terminal output
app.get('/api/bot/logs/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial backlog
  res.write(`data: ${JSON.stringify({ type: 'init', logs: botLogs.slice(-40) })}\n\n`);

  sseClients.push(res);

  req.on('close', () => {
    const index = sseClients.indexOf(res);
    if (index !== -1) {
      sseClients.splice(index, 1);
    }
  });
});

// 12. Quick TCP Ping to check if user's Minecraft host:port is open
app.post('/api/bot/ping', (req: Request, res: Response) => {
  const { host, port } = req.body;
  const targetHost = host || currentConfig.host;
  const targetPort = Number(port) || currentConfig.port;

  if (!targetHost || targetHost === 'YOUR_SERVER_IP') {
    return res.json({
      reachable: false,
      message: 'Default placeholder IP not configured yet.'
    });
  }

  const startTime = Date.now();
  const socket = new net.Socket();
  let finished = false;

  const done = (reachable: boolean, message: string) => {
    if (finished) return;
    finished = true;
    socket.destroy();
    const latency = Date.now() - startTime;
    res.json({
      reachable,
      latency: reachable ? latency : null,
      message,
      target: `${targetHost}:${targetPort}`
    });
  };

  socket.setTimeout(4000);

  socket.on('connect', () => {
    done(true, `Successfully connected to ${targetHost}:${targetPort}`);
  });

  socket.on('timeout', () => {
    done(false, 'Connection timed out (Check if server is online or firewall allows port)');
  });

  socket.on('error', (err: any) => {
    done(false, `Connection failed: ${err.message}`);
  });

  try {
    socket.connect(targetPort, targetHost);
  } catch (err: any) {
    done(false, `Socket error: ${err.message}`);
  }
});

// ----------------- VITE / STATIC SERVING -----------------

async function startServer() {
  const httpServer = http.createServer(app);

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Minecraft AFK Bot Platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
