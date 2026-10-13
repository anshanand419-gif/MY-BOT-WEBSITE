/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { HomePricing } from './components/HomePricing.tsx';
import { ServerSetupForm } from './components/ServerSetupForm.tsx';
import { BotConsole } from './components/BotConsole.tsx';
import { CodeInspector } from './components/CodeInspector.tsx';
import { UpiScannerModal } from './components/UpiScannerModal.tsx';
import { AiSupportDrawer } from './components/AiSupportDrawer.tsx';
import { AdminPanelModal } from './components/AdminPanelModal.tsx';
import { Plan, PaymentReceipt, BotConfig, BotStatusResponse } from './types.ts';
import { Shield, Sparkles, Terminal, Server, CheckCircle2, Bot, Instagram, QrCode, MessageSquareText, ExternalLink } from 'lucide-react';

const DEFAULT_PLAN: Plan = {
  id: 'pro_afk',
  name: '1 Month Plan',
  tagline: 'Most Popular for Aternos & SMP Servers',
  price: 2.49,
  priceInr: 199,
  period: '1 month',
  popular: true,
  features: [
    'Universal Minecraft Auto-detect',
    'Smart anti-AFK jumping & sneak routine',
    'Hostile mob defense (16 mobs)',
    'Water anti-drown safety routine',
    '15-second automatic reconnect',
    'Real-time child process terminal logs'
  ]
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'config' | 'console' | 'code'>('home');
  const [botConfig, setBotConfig] = useState<BotConfig>({
    host: 'YOUR_SERVER_IP',
    port: 25565,
    username: 'HELL_KING_ANSH'
  });
  const [botStatus, setBotStatus] = useState<'stopped' | 'starting' | 'running' | 'error'>('stopped');
  const [paymentReceipt, setPaymentReceipt] = useState<PaymentReceipt | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAiSupportOpen, setIsAiSupportOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan>(DEFAULT_PLAN);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const INSTAGRAM_ID = 'hell_king_ansh';

  // Show temporary toast message
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch initial config and payment status from server
  useEffect(() => {
    // 1. Fetch bot config
    fetch('/api/bot/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.config) {
          setBotConfig(data.config);
        }
        if (data.botStatus) {
          setBotStatus(data.botStatus);
        }
      })
      .catch((err) => console.error('Failed to fetch config:', err));

    // 2. Fetch payment verification status
    fetch('/api/payment/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.verified && data.payment) {
          setPaymentReceipt({
            transactionId: data.payment.transactionId,
            planId: data.payment.planId,
            planName: data.payment.planId === 'starter' ? '7 Days Plan' : data.payment.planId === 'vip' ? '1 Year Plan' : '1 Month Plan',
            amount: data.payment.amount,
            currency: data.payment.currency || 'INR',
            method: 'upi_scanner',
            date: data.payment.date,
            utr: data.payment.utr,
            receiverName: data.payment.receiver,
            receiverUpiId: data.payment.upiId,
            instagramSupport: data.payment.instagramSupport
          });
        }
      })
      .catch(() => {});
  }, []);

  // Handle plan selection from Home page
  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsCheckoutOpen(true);
  };

  // Handle payment success from scanner
  const handlePaymentSuccess = (receipt: PaymentReceipt) => {
    setPaymentReceipt(receipt);
    setIsCheckoutOpen(false);
    showToast(`Payment Verified by Automated Bot! Welcome to ${receipt.planName}. IP & Port access unlocked!`);
    // Automatically navigate to Server IP & Port form as requested!
    setActiveTab('config');
  };

  // Handle bot config updated
  const handleConfigUpdated = (newConfig: BotConfig, restarted: boolean) => {
    setBotConfig(newConfig);
    showToast('index.js updated on server!');
    if (restarted) {
      setBotStatus('starting');
      // Automatically navigate to live console to see the bot connecting
      setTimeout(() => {
        setActiveTab('console');
      }, 800);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-zinc-900 border border-emerald-500/40 text-emerald-300 shadow-2xl text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        botStatus={botStatus}
        paymentReceipt={paymentReceipt}
        onOpenPaymentModal={() => {
          setSelectedPlan(DEFAULT_PLAN);
          setIsCheckoutOpen(true);
        }}
        onOpenAiSupport={() => setIsAiSupportOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'home' && (
          <HomePricing
            onSelectPlan={handleSelectPlan}
            onGoToSetup={() => setActiveTab('config')}
            receipt={paymentReceipt}
          />
        )}

        {activeTab === 'config' && (
          <ServerSetupForm
            currentConfig={botConfig}
            receipt={paymentReceipt}
            onConfigUpdated={handleConfigUpdated}
            onGoToConsole={() => setActiveTab('console')}
            onOpenPaymentModal={() => {
              setSelectedPlan(DEFAULT_PLAN);
              setIsCheckoutOpen(true);
            }}
          />
        )}

        {activeTab === 'console' && (
          <BotConsole
            currentConfig={botConfig}
            paymentReceipt={paymentReceipt}
            onGoToSetup={() => setActiveTab('config')}
            onOpenPaymentModal={() => {
              setSelectedPlan(DEFAULT_PLAN);
              setIsCheckoutOpen(true);
            }}
          />
        )}

        {activeTab === 'code' && (
          <CodeInspector />
        )}
      </main>

      {/* Floating Action Buttons for AI Support & Instagram Help */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-2.5 items-end">
        {/* Instagram Support Button */}
        <a
          href="https://www.instagram.com/hell_king_ansh/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white font-bold text-xs shadow-xl shadow-pink-600/30 hover:scale-105 active:scale-95 transition-all group"
        >
          <Instagram className="w-4 h-4" />
          <span className="hidden sm:inline">Help: @{INSTAGRAM_ID}</span>
          <span className="sm:hidden">Help</span>
          <ExternalLink className="w-3 h-3 opacity-80" />
        </a>

        {/* AI Support Button */}
        <button
          type="button"
          onClick={() => setIsAiSupportOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-zinc-950 font-black text-xs shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
        >
          <Bot className="w-4 h-4 fill-current" />
          <span>Ask AI: How Bot Works</span>
          <span className="w-2 h-2 rounded-full bg-emerald-950 animate-ping" />
        </button>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8 px-4 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-300">HELL_KING_ANSH Minecraft AFK Bot</span>
            <span>·</span>
            <span>Mineflayer Engine</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-zinc-400">
            <button onClick={() => setActiveTab('home')} className="hover:text-emerald-400 transition-colors cursor-pointer">Plans</button>
            <button onClick={() => setActiveTab('config')} className="hover:text-emerald-400 transition-colors cursor-pointer">Server Setup</button>
            <button onClick={() => setActiveTab('console')} className="hover:text-emerald-400 transition-colors cursor-pointer">Console</button>
            <button onClick={() => setActiveTab('code')} className="hover:text-emerald-400 transition-colors cursor-pointer">index.js</button>
            <button onClick={() => setIsAiSupportOpen(true)} className="text-emerald-400 hover:underline cursor-pointer flex items-center gap-1">
              <Bot className="w-3.5 h-3.5" />
              <span>AI Support</span>
            </button>
            <a
              href="https://www.instagram.com/hell_king_ansh/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>@{INSTAGRAM_ID}</span>
            </a>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="text-zinc-500 hover:text-red-400 font-mono text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Owner Admin Portal (Mukesh Kumar / Ansh)"
            >
              <Shield className="w-3.5 h-3.5 text-red-500" />
              <span>Owner Admin (Approve UTRs)</span>
            </button>
            <span>Verified via UPI (Mukesh Kumar)</span>
          </div>
        </div>
      </footer>

      {/* Mandatory UPI QR Code Scanner & Automated Money Check Modal */}
      <UpiScannerModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        selectedPlan={selectedPlan}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* AI Support Drawer (explaining how bot works) */}
      <AiSupportDrawer
        isOpen={isAiSupportOpen}
        onClose={() => setIsAiSupportOpen(false)}
      />

      {/* Owner Admin Approval Modal */}
      <AdminPanelModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onAdminApprovedPayment={() => {
          fetch('/api/payment/status')
            .then((r) => r.json())
            .then((data) => {
              if (data.verified && data.payment) {
                setPaymentReceipt({
                  transactionId: data.payment.transactionId,
                  planId: data.payment.planId,
                  planName: data.payment.planId === 'starter' ? '7 Days Plan' : data.payment.planId === 'vip' ? '1 Year Plan' : '1 Month Plan',
                  amount: data.payment.amount,
                  currency: 'INR',
                  method: 'upi_scanner',
                  date: data.payment.date,
                  utr: data.payment.utr,
                  receiverName: data.payment.receiver,
                  receiverUpiId: data.payment.upiId,
                  instagramSupport: data.payment.instagramSupport
                });
                showToast('Payment Approved by Owner! Bot access is now unlocked!');
                setActiveTab('config');
              }
            });
        }}
      />
    </div>
  );
}
