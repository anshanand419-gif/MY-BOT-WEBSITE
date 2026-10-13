import React, { useState, useEffect } from 'react';
import {
  Server,
  Hash,
  User,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Activity,
  FileCode,
  ArrowRight,
  Loader2,
  Wifi,
  Sparkles,
  Lock,
  Play
} from 'lucide-react';
import { BotConfig, PaymentReceipt, PingResult } from '../types.ts';

interface ServerSetupFormProps {
  currentConfig: BotConfig;
  receipt: PaymentReceipt | null;
  onConfigUpdated: (config: BotConfig, restarted: boolean) => void;
  onGoToConsole: () => void;
  onOpenPaymentModal: () => void;
}

export const ServerSetupForm: React.FC<ServerSetupFormProps> = ({
  currentConfig,
  receipt,
  onConfigUpdated,
  onGoToConsole,
  onOpenPaymentModal
}) => {
  const [host, setHost] = useState(
    currentConfig.host && currentConfig.host !== 'YOUR_SERVER_IP'
      ? currentConfig.host
      : 'myserver.aternos.me'
  );
  const [port, setPort] = useState(String(currentConfig.port || 25565));
  const [username, setUsername] = useState(currentConfig.username || 'HELL_KING_ANSH');
  const [autoRestart, setAutoRestart] = useState(true);

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ping tester state
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState<PingResult | null>(null);

  useEffect(() => {
    if (currentConfig.host && currentConfig.host !== 'YOUR_SERVER_IP') {
      setHost(currentConfig.host);
    }
    if (currentConfig.port) {
      setPort(String(currentConfig.port));
    }
    if (currentConfig.username) {
      setUsername(currentConfig.username);
    }
  }, [currentConfig]);

  const handleTestPing = async () => {
    if (!host) {
      setErrorMessage('Please enter a server host to test ping.');
      return;
    }
    setPinging(true);
    setPingResult(null);

    try {
      const res = await fetch('/api/bot/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: host.trim(), port: Number(port) || 25565 })
      });
      const data = await res.json();
      setPingResult(data);
    } catch (err: any) {
      setPingResult({
        reachable: false,
        latency: null,
        message: 'Could not connect to ping probe: ' + err.message
      });
    } finally {
      setPinging(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // STRICT CHECK: Bina payment kiye bot kisi haalat me enable nahi ho sakta!
    if (!receipt) {
      setErrorMessage('Bina payment kiye bot enable nahi ho sakta! Please pehle scanner par payment karke 12-digit UTR verify karein.');
      onOpenPaymentModal();
      return;
    }

    if (!host.trim()) {
      setErrorMessage('Server IP Address or hostname is required.');
      return;
    }

    const portNum = Number(port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      setErrorMessage('Port must be a valid number between 1 and 65535.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/bot/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: host.trim(),
          port: portNum,
          username: username.trim() || 'HELL_KING_ANSH',
          autoRestart
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update configuration');
      }

      setSuccessMessage(
        autoRestart
          ? 'Successfully updated index.js! Bot child process has restarted and is connecting to your server.'
          : 'Successfully updated index.js with new IP and Port!'
      );

      onConfigUpdated(data.config, data.restarted);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while updating server files.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (presetHost: string, presetPort: string, presetUser = 'HELL_KING_ANSH') => {
    setHost(presetHost);
    setPort(presetPort);
    setUsername(presetUser);
    setPingResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Top Banner: Payment status */}
      {!receipt ? (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-zinc-900 to-zinc-900 border-2 border-amber-500/40 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    SCANNER PAYMENT REQUIRED
                  </span>
                  <span className="text-xs text-zinc-400">Access Gated</span>
                </div>
                <h3 className="text-sm font-bold text-white mt-1">
                  Pay on UPI Scanner to Access IP &amp; Port Change
                </h3>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Scan the UPI QR code to <strong>Mukesh Kumar</strong> (<code className="text-amber-300 font-mono">mukeshkumae078@okicici</code>). Our automated bot will check your UTR and instantly unlock this form.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onOpenPaymentModal}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-zinc-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all cursor-pointer whitespace-nowrap"
              >
                Open UPI Scanner →
              </button>

              <a
                href="https://www.instagram.com/hell_king_ansh/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/30 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>Help: @hell_king_ansh</span>
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-300 text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                <span>Payment Verified ({receipt.planName})</span>
                <span className="font-mono text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded text-[10px]">
                  UTR: {receipt.utr || receipt.transactionId}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Verified to {receipt.receiverName || 'Mukesh Kumar'} ({receipt.receiverUpiId || 'mukeshkumae078@okicici'}). You can now update your Minecraft IP &amp; Port below.
              </p>
            </div>
          </div>

          <a
            href="https://www.instagram.com/hell_king_ansh/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-pink-400 hover:text-pink-300 hover:underline flex items-center gap-1 whitespace-nowrap"
          >
            Support: @hell_king_ansh
          </a>
        </div>
      )}

      {/* Main Grid: Form + Live index.js Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form */}
        <div className="lg:col-span-7 space-y-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                STEP 2 OF 2
              </span>
              <span className="text-xs text-zinc-400">Server Target Details</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Configure Minecraft IP &amp; Port</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Submitting this form immediately replaces the variables inside <code className="text-emerald-400 font-mono">index.js</code> on the server and restarts the bot process.
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-2">
              Quick Autofill Presets:
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!receipt}
                onClick={() => handleApplyPreset('myserver.aternos.me', '34821')}
                className={`px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300 transition-colors ${
                  !receipt ? 'opacity-40 cursor-not-allowed' : 'hover:border-emerald-500/50 cursor-pointer'
                }`}
              >
                Aternos Server
              </button>
              <button
                type="button"
                disabled={!receipt}
                onClick={() => handleApplyPreset('play.hypixel.net', '25565')}
                className={`px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300 transition-colors ${
                  !receipt ? 'opacity-40 cursor-not-allowed' : 'hover:border-emerald-500/50 cursor-pointer'
                }`}
              >
                Hypixel (25565)
              </button>
              <button
                type="button"
                disabled={!receipt}
                onClick={() => handleApplyPreset('127.0.0.1', '25565')}
                className={`px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300 transition-colors ${
                  !receipt ? 'opacity-40 cursor-not-allowed' : 'hover:border-emerald-500/50 cursor-pointer'
                }`}
              >
                Localhost (127.0.0.1)
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Host Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Minecraft Server IP / Host</span>
                </label>
                <span className="text-[10px] text-zinc-400">e.g., yourname.aternos.me</span>
              </div>
              <input
                type="text"
                required
                disabled={!receipt}
                value={host}
                onChange={(e) => {
                  setHost(e.target.value);
                  setPingResult(null);
                }}
                placeholder="e.g., yourserver.aternos.me or 192.168.1.50"
                className={`w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 font-mono ${
                  !receipt ? 'opacity-50 cursor-not-allowed bg-zinc-900/50' : ''
                }`}
              />
            </div>

            {/* Port & Username row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Server Port</span>
                  </label>
                  <span className="text-[10px] text-zinc-400">Default: 25565</span>
                </div>
                <input
                  type="number"
                  required
                  disabled={!receipt}
                  min="1"
                  max="65535"
                  value={port}
                  onChange={(e) => {
                    setPort(e.target.value);
                    setPingResult(null);
                  }}
                  placeholder="25565"
                  className={`w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 font-mono ${
                    !receipt ? 'opacity-50 cursor-not-allowed bg-zinc-900/50' : ''
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Bot In-Game Username</span>
                  </label>
                  <span className="text-[10px] text-zinc-400">Mineflayer Bot</span>
                </div>
                <input
                  type="text"
                  required
                  disabled={!receipt}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="HELL_KING_ANSH"
                  className={`w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 font-mono ${
                    !receipt ? 'opacity-50 cursor-not-allowed bg-zinc-900/50' : ''
                  }`}
                />
              </div>
            </div>

            {/* Test Server Ping Option */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleTestPing}
                disabled={pinging || !host.trim()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-300 transition-colors disabled:opacity-40 cursor-pointer"
              >
                {pinging ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>Testing socket connection to {host}:{port}...</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Test Server Reachability (TCP Ping)</span>
                  </>
                )}
              </button>

              {pingResult && (
                <div
                  className={`mt-2 p-3 rounded-lg text-xs border flex items-start gap-2 ${
                    pingResult.reachable
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {pingResult.reachable ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold">
                      {pingResult.reachable
                        ? `Online! (${pingResult.latency}ms latency)`
                        : 'Server Unreachable / Offline'}
                    </span>
                    <p className="text-[11px] opacity-90 mt-0.5">{pingResult.message}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Auto Restart Toggle */}
            <div className="pt-2 border-t border-zinc-800/80">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoRestart}
                  onChange={(e) => setAutoRestart(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-zinc-950 border-zinc-700 focus:ring-emerald-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-white">
                    Automatically Restart Bot via child_process
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    Immediately restarts the Mineflayer node instance with the new IP &amp; Port right after writing to file.
                  </p>
                </div>
              </label>
            </div>

            {/* Error & Success Messages */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">{successMessage}</span>
                </div>
                <div className="pt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={onGoToConsole}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Open Live Bot Console</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button (Locked if no payment) */}
            {!receipt ? (
              <button
                type="button"
                onClick={onOpenPaymentModal}
                className="w-full py-4 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black rounded-xl text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Lock className="w-4 h-4 text-zinc-950" />
                <span>Pay on UPI Scanner to Enable Bot (₹199 / Mukesh Kumar)</span>
                <ArrowRight className="w-4 h-4 text-zinc-950" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 font-black rounded-xl text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Modifying index.js &amp; Reloading Child Process...</span>
                  </>
                ) : (
                  <>
                    <RotateCw className="w-4 h-4 text-zinc-950" />
                    <span>Write to index.js &amp; Launch Bot</span>
                    <ArrowRight className="w-4 h-4 text-zinc-950" />
                  </>
                )}
              </button>
            )}
          </form>
        </div>

        {/* Right Column: Real-time index.js File Diff Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-xs font-bold text-white">index.js — Live File Target</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-emerald-400 border border-zinc-800">
                Auto-Synced
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 mt-3 mb-3">
              The backend searches for the placeholders and overwrites these lines in the real server file:
            </p>

            {/* Code Block with green highlight */}
            <div className="bg-zinc-950 rounded-xl p-4 font-mono text-[11px] leading-relaxed border border-zinc-800/80 overflow-x-auto text-zinc-300">
              <div className="text-zinc-600">// index.js (Minecraft Bot Entry Point)</div>
              <div className="text-zinc-400">const mineflayer = require('mineflayer');</div>
              <div className="text-zinc-600 my-1">// Target server configuration:</div>
              <div className="bg-emerald-500/10 text-emerald-300 px-2 py-0.5 -mx-2 rounded border border-emerald-500/20 font-bold">
                const SERVER_HOST = '{host || 'YOUR_SERVER_IP'}';
              </div>
              <div className="bg-emerald-500/10 text-emerald-300 px-2 py-0.5 -mx-2 rounded border border-emerald-500/20 font-bold my-0.5">
                const SERVER_PORT = {port || 25565};
              </div>
              <div className="bg-emerald-500/10 text-emerald-300 px-2 py-0.5 -mx-2 rounded border border-emerald-500/20 font-bold">
                const BOT_USERNAME = '{username || 'HELL_KING_ANSH'}';
              </div>
              <div className="text-zinc-500 mt-2">let reconnectTimer = null;</div>
              <div className="text-zinc-500">let stopped = false;</div>
              <div className="text-zinc-500 mt-1">function startBot() {'{'}</div>
              <div className="text-zinc-500 pl-3">const bot = mineflayer.createBot({'{'}</div>
              <div className="text-emerald-400 pl-6">host: SERVER_HOST,</div>
              <div className="text-emerald-400 pl-6">port: SERVER_PORT,</div>
              <div className="text-emerald-400 pl-6">username: BOT_USERNAME,</div>
              <div className="text-zinc-500 pl-6">version: false // UNIVERSAL AUTO-DETECT</div>
              <div className="text-zinc-500 pl-3">{'}'});</div>
              <div className="text-zinc-600 pl-3">// Anti-AFK &amp; Hostile Mob Defense active</div>
              <div className="text-zinc-500">{'}'}</div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
              <span>File location: <code className="text-zinc-200">./index.js</code></span>
              <span className="text-emerald-400 font-medium">Auto-Restart Enabled</span>
            </div>
          </div>

          {/* Feature reminder cards */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs space-y-2">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>What happens next?</span>
            </div>
            <ul className="text-zinc-400 space-y-1 text-[11px] list-disc list-inside">
              <li>Backend opens and updates <code className="text-zinc-300 font-mono">index.js</code> with your IP and Port.</li>
              <li>A child process is spawned to run <code className="text-zinc-300 font-mono">node index.js</code>.</li>
              <li>The bot joins your Minecraft server and executes anti-AFK jumping and mob auto-defense.</li>
              <li>All chat messages and server status will appear in the Live Bot Console.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
