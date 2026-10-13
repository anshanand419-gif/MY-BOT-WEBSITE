import React, { useState, useEffect } from 'react';
import { FileCode, Copy, Check, Download, RotateCw, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export const CodeInspector: React.FC = () => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [fileDetails, setFileDetails] = useState<{ path: string; size: number; updatedAt: string } | null>(null);

  const fetchFile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bot/file');
      const data = await res.json();
      setContent(data.content || '');
      setFileDetails({
        path: data.path || 'index.js',
        size: data.size || 0,
        updatedAt: data.updatedAt || new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to load index.js file:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFile();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.js';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4">
      {/* Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
              SERVER DISK VERIFICATION
            </span>
            <span className="text-xs text-zinc-400">Live File System Reader</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <FileCode className="w-6 h-6 text-emerald-400" />
            <span>index.js File Inspector</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            This displays the actual <code className="text-emerald-400 font-mono">index.js</code> file currently saved on the Node.js server.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchFile}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 transition-colors cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload File</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-lg shadow-md transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download index.js</span>
          </button>
        </div>
      </div>

      {/* File Info Bar */}
      {fileDetails && (
        <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-400 font-mono">
          <div>
            <span>Path: </span>
            <span className="text-white font-semibold">/{fileDetails.path}</span>
          </div>
          <div>
            <span>Size: </span>
            <span className="text-emerald-400 font-semibold">{fileDetails.size} bytes</span>
          </div>
          <div>
            <span>Last Modified: </span>
            <span className="text-zinc-300">{new Date(fileDetails.updatedAt).toLocaleTimeString()}</span>
          </div>
        </div>
      )}

      {/* Code Viewer */}
      <div className="relative rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="font-mono text-zinc-300 font-semibold">Mineflayer AFK Engine Script</span>
          </div>
          <span className="text-[11px] text-zinc-500">Universal Auto-Detect + Mob Defense</span>
        </div>

        <pre className="p-5 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed max-h-[600px] selection:bg-emerald-500/30 selection:text-emerald-200">
          <code>{content || '// Loading index.js...'}</code>
        </pre>
      </div>
    </div>
  );
};
