import React from 'react';
import {
  Shield,
  Zap,
  Sword,
  Clock,
  Check,
  Sparkles,
  ArrowRight,
  Server,
  Lock,
  RotateCw,
  Terminal,
  Activity,
  Cpu,
  ExternalLink
} from 'lucide-react';
import { Plan, PaymentReceipt } from '../types.ts';

interface HomePricingProps {
  onSelectPlan: (plan: Plan) => void;
  onGoToSetup: () => void;
  receipt: PaymentReceipt | null;
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: '7 Days Plan',
    tagline: '7 Days Non-Stop AFK & Chunk Loading',
    price: 1.29,
    priceInr: 99,
    period: '7 days',
    features: [
      '7 Days (168 Hours) 24/7 Server Uptime',
      'Universal Aternos & SMP IP:Port config',
      'Auto-updating index.js file',
      'Anti-AFK jump, sneak & rotate routines',
      'Auto-detect server version',
      'Basic live terminal logs'
    ]
  },
  {
    id: 'pro_afk',
    name: '1 Month Plan',
    tagline: 'Most Popular for Aternos & SMP Servers',
    price: 2.49,
    priceInr: 199,
    period: '1 month',
    popular: true,
    features: [
      '30 Days 24/7 Non-Stop Server Uptime',
      'All 7 Days Plan features included',
      'Mob Auto-Defense (attacks 16 hostile mobs)',
      'Water anti-drown safety routine',
      'Automatic 15s reconnect on kicks',
      'Live SSE streaming terminal',
      'One-click Child Process auto-restart',
      '24/7 Farm & Chunk loader'
    ]
  },
  {
    id: 'vip',
    name: '1 Year Plan',
    tagline: 'Maximum Savings & 365 Days Dedicated Fleet',
    price: 10.99,
    priceInr: 899,
    period: '1 year',
    features: [
      '365 Days (Full Year) Uninterrupted AFK Bot',
      'All 1 Month Plan features included',
      'Custom Bot In-Game Username',
      'Dedicated node child process runtime',
      'Priority reconnect queue',
      'Direct index.js source code download',
      'VIP Discord & Instagram support'
    ]
  }
];

export const HomePricing: React.FC<HomePricingProps> = ({
  onSelectPlan,
  onGoToSetup,
  receipt
}) => {
  return (
    <div className="space-y-16 py-6">
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto px-4">
        {/* Glow backdrop */}
        <div className="absolute inset-0 -top-16 -z-10 flex items-center justify-center">
          <div className="w-[500px] h-[300px] bg-gradient-to-tr from-emerald-600/20 via-emerald-400/10 to-transparent blur-3xl rounded-full" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Automated Mineflayer Bot Deployment Platform</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
          Keep Your Minecraft Server <br />
          <span className="bg-gradient-to-r from-emerald-400 via-green-300 to-teal-400 bg-clip-text text-transparent">
            Active 24/7 Without Getting Kicked
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-zinc-300 max-w-2xl mx-auto leading-relaxed">
          Pay seamlessly with Stripe or PayPal, enter your Minecraft server IP &amp; Port, and our backend
          instantly modifies <code className="text-emerald-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 font-mono text-sm">index.js</code> and
          restarts the bot process on our high-speed Node.js cloud runtime.
        </p>

        {/* Hero Quick Action */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {receipt ? (
            <button
              onClick={onGoToSetup}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-zinc-950 font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5 cursor-pointer text-sm"
            >
              <Server className="w-4 h-4" />
              <span>Configure Server IP &amp; Port Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => onSelectPlan(PLANS[1])}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-zinc-950 font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5 cursor-pointer text-sm"
            >
              <Zap className="w-4 h-4" />
              <span>Get Pro Access — $4.99</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onGoToSetup}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-semibold rounded-xl transition-all cursor-pointer text-sm"
          >
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Server IP &amp; Port Form</span>
          </button>
        </div>

        {/* Quick Features Row */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-1">
              <RotateCw className="w-4 h-4" />
              <span>Universal Auto-Detect</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Matches any Minecraft server version automatically without manual protocol switching.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-1">
              <Zap className="w-4 h-4" />
              <span>Smart Anti-AFK</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Random look pitches, jump routines, and sneak toggles every 15s to bypass anti-cheat kicks.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-1">
              <Sword className="w-4 h-4" />
              <span>Hostile Mob Defense</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Locks onto &amp; attacks zombies, skeletons, creepers &amp; 13+ hostile mobs within 3.5 blocks.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-1">
              <Cpu className="w-4 h-4" />
              <span>Auto child_process</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Backend modifies <code className="text-zinc-200">index.js</code> and triggers live process reloads.
            </p>
          </div>
        </div>
      </section>

      {/* Active License Banner if paid */}
      {receipt && (
        <div className="max-w-4xl mx-auto px-4">
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Payment Verified: {receipt.planName}</span>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                    {receipt.transactionId}
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Paid via {receipt.method.toUpperCase()} (${receipt.amount}). You are ready to configure IP and Port!
                </p>
              </div>
            </div>
            <button
              onClick={onGoToSetup}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              Open IP &amp; Port Setup →
            </button>
          </div>
        </div>
      )}

      {/* Pricing Section */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Choose Your AFK Bot Plan</h2>
          <p className="text-zinc-400 text-sm mt-2">
            Instant activation with Stripe or PayPal simulation. Enter your server info immediately after payment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {PLANS.map((plan) => {
            const isPopular = plan.popular;
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-2xl p-6 transition-all ${
                  isPopular
                    ? 'bg-zinc-900 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/10'
                    : 'bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-zinc-950 text-[10px] font-extrabold tracking-wider uppercase rounded-full shadow-md">
                    MOST POPULAR CHOICE
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  </div>
                  <p className="text-xs text-zinc-400 mb-6">{plan.tagline}</p>

                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-3xl sm:text-4xl font-black text-white">₹{plan.priceInr}</span>
                    <span className="text-xs text-zinc-400 font-mono">(${plan.price} USD)</span>
                    <span className="text-xs text-zinc-400">/{plan.period}</span>
                  </div>

                  <div className="border-t border-zinc-800/80 pt-5 space-y-3">
                    <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider text-[10px]">
                      Included Features:
                    </div>
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-zinc-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  <button
                    onClick={() => onSelectPlan(plan)}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isPopular
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/25'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                    }`}
                  >
                    <span>Pay on UPI Scanner (₹{plan.priceInr})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <p className="text-[10px] text-zinc-500 text-center mt-2">
                    Scannable via Google Pay / PhonePe / Paytm to Mukesh Kumar
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4-Step Workflow Walkthrough */}
      <section className="max-w-5xl mx-auto px-4 py-8 border-t border-zinc-800/60">
        <h2 className="text-xl font-bold text-white text-center mb-8">How The Automation Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 relative">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center mb-3">
              1
            </span>
            <h4 className="text-sm font-semibold text-white mb-1">Instant Checkout</h4>
            <p className="text-xs text-zinc-400">
              Click Buy Access and complete the payment simulation via Stripe Card or PayPal.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 relative">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center mb-3">
              2
            </span>
            <h4 className="text-sm font-semibold text-white mb-1">Enter IP &amp; Port</h4>
            <p className="text-xs text-zinc-400">
              Submit your Minecraft Server address (e.g., Aternos host and custom port number).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 relative">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center mb-3">
              3
            </span>
            <h4 className="text-sm font-semibold text-white mb-1">Backend Rewrites index.js</h4>
            <p className="text-xs text-zinc-400">
              Node.js backend permanently replaces placeholder variables inside the server's <code className="text-emerald-400">index.js</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 relative">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center mb-3">
              4
            </span>
            <h4 className="text-sm font-semibold text-white mb-1">Automatic Child Process</h4>
            <p className="text-xs text-zinc-400">
              Bot spawns with Node.js child_process, connects to your server, and streams live terminal logs.
            </p>
          </div>
        </div>

        {/* Support & Contact Card */}
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-zinc-900 to-zinc-900 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/30 text-pink-400 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.449-1.44z"/>
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Direct Payment &amp; Setup Help Support</span>
                <span className="text-[10px] bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded font-mono">Instagram: @hell_king_ansh</span>
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Have questions regarding the UPI scanner, server port forwarding, or bot setup? Reach out directly!
              </p>
            </div>
          </div>

          <a
            href="https://www.instagram.com/hell_king_ansh/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-pink-500/20 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <span>Message @hell_king_ansh</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>
    </div>
  );
};
