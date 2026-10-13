import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Play,
  Square,
  RotateCw,
  Trash2,
  Download,
  Activity,
  Server,
  Shield,
  Clock,
  Cpu,
  ArrowDownCircle,
  Copy,
  Check,
  Sword,
  Sparkles,
  Wifi,
  Lock
} from 'lucide-react';
import { BotConfig, BotLog, BotStatusResponse, PaymentReceipt } from '../types.ts';

interface BotConsoleProps {
  currentConfig: BotConfig;
  paymentReceipt: PaymentReceipt | null;
  onGoToSetup: () => void;
  onOpenPaymentModal: () => void;
}

export const BotConsole: React.FC<BotConsoleProps> = ({
  currentConfig,
  paymentReceipt,
  onGoToSetup,
  onOpenPaymentModal
}) => {
  const [logs, setLogs] = useState<BotLog[]>([]);
  const [botStatus, setBotStatus] = useState<'stopped' | 'starting' | 'running' | 'error'>('stopped');
  const [pid, setPid] = useState<number | null>(null);
  const [uptime, setUptime] = useState<number>(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState<'all' | 'chat' | 'mob' | 'error'>('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const terminalContainerRef = useRef<HTMLDivElement>(null);

  // Poll status every 2 seconds
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/bot/status');
      const data: BotStatusResponse = await res.json();
      setBotStatus(data.status);
      setPid(data.pid);
      setUptime(data.uptime);
    } catch (err) {
      console.error('Failed to fetch bot status:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2500);
    return () => clearInterval(interval);
  }, []);

  // SSE Stream for live logs
  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource('/api/bot/logs/stream');

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'init' && Array.isArray(parsed.logs)) {
            setLogs(parsed.logs);
          } else if (parsed.text) {
            setLogs((prev) => {
              if (prev.some((l) => l.id === parsed.id)) return prev;
              return [...prev.slice(-300), parsed];
            });
          }
        } catch {
          // ignore parsing error
        }
      };

      eventSource.onerror = () => {
        // Fallback polling if SSE disconnects
        fetch('/api/bot/logs?limit=80')
          .then((r) => r.json())
          .then((d) => setLogs(d.logs || []))
          .catch(() => {});
      };
    } catch {
      // Fallback
    }

    return () => {
      eventSource?.close();
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Format uptime
  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Actions
  const handleStart = async () => {
    if (!paymentReceipt) {
      alert('PAYMENT REQUIRED: Bina payment kiye bot start nahi ho sakta! Please Mukesh Kumar ke scanner par payment karke 12-digit UTR verify karein.');
      onOpenPaymentModal();
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/bot/start', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to start bot');
      }
      await fetchStatus();
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    setActionLoading(true);
    try {
      await fetch('/api/bot/stop', { method: 'POST' });
      await fetchStatus();
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestart = async () => {
    if (!paymentReceipt) {
      alert('PAYMENT REQUIRED: Bina payment kiye bot restart nahi ho sakta! Please pehle scanner par payment complete karein.');
      onOpenPaymentModal();
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/bot/restart', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to restart bot');
      }
      await fetchStatus();
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearLogs = async () => {
    await fetch('/api/bot/logs/clear', { method: 'POST' });
    setLogs([]);
  };

  const handleDownloadLogs = () => {
    const text = logs.map((l) => `[${l.time}] [${l.type.toUpperCase()}] ${l.text}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minecraft-bot-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.time}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    if (filter === 'chat') return log.type === 'chat';
    if (filter === 'mob') return log.type === 'mob';
    if (filter === 'error') return log.type === 'error' || log.type === 'warn';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4">
      {/* Top Status & Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Status Card */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Process Status</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                botStatus === 'running'
                  ? 'bg-emerald-400 ring-4 ring-emerald-400/20 animate-pulse'
                  : botStatus === 'starting'
                  ? 'bg-amber-400 ring-4 ring-amber-400/20 animate-pulse'
                  : botStatus === 'error'
                  ? 'bg-rose-500 ring-4 ring-rose-500/20'
                  : 'bg-zinc-600'
              }`}
            />
            <span className="text-lg font-bold text-white capitalize">
              {botStatus === 'running' ? 'Connected' : botStatus === 'starting' ? 'Spawning...' : botStatus === 'error' ? 'Error' : 'Stopped'}
            </span>
          </div>
          <div className="text-[11px] text-zinc-500 font-mono mt-1">
            PID: {pid || 'None'}
          </div>
        </div>

        {/* Target Server Card */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Target Host:Port</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-emerald-300 font-mono truncate" title={`${currentConfig.host}:${currentConfig.port}`}>
            {currentConfig.host}:{currentConfig.port}
          </div>
          <button
            onClick={onGoToSetup}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline mt-1 block"
          >
            Change IP/Port →
          </button>
        </div>

        {/* Bot Identity Card */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>In-Game Bot</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-white font-mono">
            {currentConfig.username}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
            <Sword className="w-3 h-3 text-emerald-400" />
            <span>Mob Defense Active</span>
          </div>
        </div>

        {/* Uptime Card */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Current Uptime</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-mono font-bold text-white">
            {formatUptime(uptime)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Max limit: 10 hrs / cycle
          </div>
        </div>
      </div>

      {/* Terminal Container */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Terminal Header & Toolbar */}
        <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Console Title & Tabs */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="font-mono text-xs font-bold text-zinc-300 ml-2 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                Mineflayer Live Console (STDOUT / STDERR)
              </span>
            </div>

            {/* Filter pills */}
            <div className="hidden sm:flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-[11px]">
              {(['all', 'chat', 'mob', 'error'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilter(mode)}
                  className={`px-2.5 py-0.5 rounded capitalize transition-colors ${
                    filter === mode
                      ? 'bg-zinc-800 text-emerald-400 font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Start / Stop / Restart Controls */}
            {botStatus === 'stopped' || botStatus === 'error' ? (
              <button
                onClick={handleStart}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-lg shadow-sm shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Bot</span>
              </button>
            ) : (
              <button
                onClick={handleStop}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Bot</span>
              </button>
            )}

            <button
              onClick={handleRestart}
              disabled={actionLoading}
              title="Restarts Node child process with current index.js"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 transition-all cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
              <span>Restart</span>
            </button>

            {/* Clear / Copy / Download tools */}
            <button
              onClick={handleCopyLogs}
              title="Copy all logs to clipboard"
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleDownloadLogs}
              title="Download console logs"
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleClearLogs}
              title="Clear terminal window"
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 border border-zinc-800 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setAutoScroll(!autoScroll)}
              title="Toggle Auto-Scroll"
              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                autoScroll
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500'
              }`}
            >
              <ArrowDownCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Terminal Screen */}
        <div
          ref={terminalContainerRef}
          className="h-[460px] overflow-y-auto p-4 font-mono text-xs leading-relaxed space-y-1 bg-zinc-950 text-zinc-300 selection:bg-emerald-500/30 selection:text-emerald-200"
        >
          {filteredLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2">
              <Terminal className="w-8 h-8 opacity-40" />
              <p className="text-xs">Console is waiting for logs...</p>
              <p className="text-[11px] text-zinc-500">
                Click "Start Bot" or update IP &amp; Port in Setup tab to trigger automated deployment.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              let color = 'text-zinc-300';
              let badgeColor = 'bg-zinc-800 text-zinc-400';

              if (log.type === 'success') {
                color = 'text-emerald-400 font-semibold';
                badgeColor = 'bg-emerald-500/20 text-emerald-300';
              } else if (log.type === 'chat') {
                color = 'text-sky-300';
                badgeColor = 'bg-sky-500/20 text-sky-300';
              } else if (log.type === 'mob') {
                color = 'text-amber-300 font-medium';
                badgeColor = 'bg-amber-500/20 text-amber-300';
              } else if (log.type === 'warn') {
                color = 'text-amber-400';
                badgeColor = 'bg-amber-500/20 text-amber-400';
              } else if (log.type === 'error') {
                color = 'text-rose-400';
                badgeColor = 'bg-rose-500/20 text-rose-300';
              }

              return (
                <div key={log.id} className="flex items-start gap-2 group hover:bg-zinc-900/50 py-0.5 px-1 rounded">
                  <span className="text-[10px] text-zinc-600 select-none shrink-0 font-mono">
                    [{log.time}]
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded select-none shrink-0 ${badgeColor}`}>
                    {log.type}
                  </span>
                  <span className={`break-all ${color}`}>{log.text}</span>
                </div>
              );
            })
          )}
          <div ref={logsEndRef} />
        </div>

        {/* Terminal Footer info */}
        <div className="px-4 py-2 bg-zinc-900/90 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Auto-reconnect on disconnect (15s)
            </span>
            <span className="hidden sm:inline">Anti-AFK Jump cycle: Every 15s</span>
          </div>
          <div>
            <span>Showing {filteredLogs.length} events</span>
          </div>
        </div>
      </div>
    </div>
  );
};
