import React from 'react';
import { Bot, Terminal, Server, Shield, FileCode, CheckCircle, CreditCard, Sparkles, Instagram, QrCode, MessageSquareText } from 'lucide-react';
import { PaymentReceipt } from '../types.ts';

interface HeaderProps {
  activeTab: 'home' | 'config' | 'console' | 'code';
  setActiveTab: (tab: 'home' | 'config' | 'console' | 'code') => void;
  botStatus: 'stopped' | 'starting' | 'running' | 'error';
  paymentReceipt: PaymentReceipt | null;
  onOpenPaymentModal: () => void;
  onOpenAiSupport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  botStatus,
  paymentReceipt,
  onOpenPaymentModal,
  onOpenAiSupport
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-emerald-950/40 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 shadow-lg shadow-emerald-500/20 text-white font-bold ring-1 ring-emerald-400/40">
              <Bot className="w-6 h-6 text-emerald-100" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-zinc-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-lg">HELL_KING_<span className="text-emerald-400">ANSH</span></span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">AFK 24/7</span>
              </div>
              <p className="text-xs text-zinc-400">Universal Minecraft Bot Cloud</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'home'
                  ? 'bg-emerald-500 text-zinc-950 font-semibold shadow-sm shadow-emerald-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Home &amp; Plans
            </button>

            <button
              onClick={() => setActiveTab('config')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'config'
                  ? 'bg-emerald-500 text-zinc-950 font-semibold shadow-sm shadow-emerald-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              IP &amp; Port Setup
              {paymentReceipt ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400" title="Locked until UPI payment"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('console')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'console'
                  ? 'bg-emerald-500 text-zinc-950 font-semibold shadow-sm shadow-emerald-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Live Bot Console
              {botStatus === 'running' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'code'
                  ? 'bg-emerald-500 text-zinc-950 font-semibold shadow-sm shadow-emerald-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              index.js
            </button>
          </nav>

          {/* Right Status & Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* AI Support Button */}
            <button
              onClick={onOpenAiSupport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="Ask AI how the Minecraft bot works"
            >
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">AI Support</span>
            </button>

            {/* Instagram Help Support */}
            <a
              href="https://www.instagram.com/hell_king_ansh/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-300 hover:bg-pink-500/20 text-xs font-medium transition-all"
              title="Instagram Help Support: @hell_king_ansh"
            >
              <Instagram className="w-3.5 h-3.5 text-pink-400" />
              <span>@hell_king_ansh</span>
            </a>

            {/* Bot Live Status Pill */}
            <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  botStatus === 'running'
                    ? 'bg-emerald-400 ring-2 ring-emerald-400/30 animate-pulse'
                    : botStatus === 'starting'
                    ? 'bg-amber-400 ring-2 ring-amber-400/30 animate-pulse'
                    : botStatus === 'error'
                    ? 'bg-rose-500 ring-2 ring-rose-500/30'
                    : 'bg-zinc-600'
                }`}
              />
              <span className="font-mono text-zinc-300 capitalize text-[11px] hidden sm:inline">
                {botStatus === 'running' ? 'Bot Online' : botStatus === 'starting' ? 'Connecting...' : botStatus === 'error' ? 'Error' : 'Stopped'}
              </span>
            </div>

            {/* Payment / License Status */}
            {paymentReceipt ? (
              <div
                onClick={() => setActiveTab('config')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium cursor-pointer hover:bg-emerald-500/20 transition-all"
                title="Active license verified on scanner. Click to configure IP."
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Unlocked</span>
              </div>
            ) : (
              <button
                onClick={onOpenPaymentModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>UPI Scanner</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="md:hidden border-t border-zinc-800/80 px-4 py-2 flex items-center justify-between gap-1 overflow-x-auto bg-zinc-950">
        <button
          onClick={() => setActiveTab('home')}
          className={`px-3 py-1 rounded-md text-xs whitespace-nowrap ${
            activeTab === 'home' ? 'bg-emerald-500 text-zinc-950 font-semibold' : 'text-zinc-400'
          }`}
        >
          Pricing
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`px-3 py-1 rounded-md text-xs whitespace-nowrap ${
            activeTab === 'config' ? 'bg-emerald-500 text-zinc-950 font-semibold' : 'text-zinc-400'
          }`}
        >
          IP & Port Form
        </button>
        <button
          onClick={() => setActiveTab('console')}
          className={`px-3 py-1 rounded-md text-xs whitespace-nowrap ${
            activeTab === 'console' ? 'bg-emerald-500 text-zinc-950 font-semibold' : 'text-zinc-400'
          }`}
        >
          Bot Console
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`px-3 py-1 rounded-md text-xs whitespace-nowrap ${
            activeTab === 'code' ? 'bg-emerald-500 text-zinc-950 font-semibold' : 'text-zinc-400'
          }`}
        >
          index.js
        </button>
      </div>
    </header>
  );
};
