import React, { useState } from 'react';
import { X, CreditCard, Lock, ShieldCheck, CheckCircle2, Sparkles, Tag, ArrowRight, Loader2 } from 'lucide-react';
import { Plan, PaymentReceipt } from '../types.ts';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: Plan;
  onPaymentSuccess: (receipt: PaymentReceipt) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  onPaymentSuccess
}) => {
  const [method, setMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('player@minecraft.net');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardHolder, setCardHolder] = useState('Minecraft Gamer');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('888');
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  if (!isOpen) return null;

  const handleApplyCoupon = () => {
    if (coupon.trim().toUpperCase() === 'MINECRAFT50' || coupon.trim().toUpperCase() === 'AFK50') {
      setDiscount(0.5);
      setCouponSuccess('50% Discount applied!');
      setCouponError('');
    } else if (coupon.trim().toUpperCase() === 'FREEPASS') {
      setDiscount(1);
      setCouponSuccess('100% Promo applied! Free checkout.');
      setCouponError('');
    } else {
      setCouponError('Invalid coupon. Try "MINECRAFT50" or "AFK50"');
      setCouponSuccess('');
    }
  };

  const finalPrice = Math.max(0, Number((selectedPlan.price * (1 - discount)).toFixed(2)));

  const handleStripePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.id,
          paymentMethod: 'stripe',
          email,
          cardLast4: cardNumber.replace(/\D/g, '').slice(-4) || '4242'
        })
      });
      const data = await res.json();

      setTimeout(() => {
        setLoading(false);
        const receipt: PaymentReceipt = {
          transactionId: data.transactionId || 'TXN_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          amount: finalPrice,
          currency: 'USD',
          method: 'stripe',
          date: new Date().toLocaleString(),
          email,
          cardLast4: '4242'
        };
        onPaymentSuccess(receipt);
      }, 1200);
    } catch {
      setLoading(false);
      // Fallback local receipt
      const receipt: PaymentReceipt = {
        transactionId: 'TXN_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        amount: finalPrice,
        currency: 'USD',
        method: 'stripe',
        date: new Date().toLocaleString(),
        email,
        cardLast4: '4242'
      };
      onPaymentSuccess(receipt);
    }
  };

  const handlePayPalPay = async () => {
    setLoading(true);

    try {
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.id,
          paymentMethod: 'paypal',
          email
        })
      });
      const data = await res.json();

      setTimeout(() => {
        setLoading(false);
        const receipt: PaymentReceipt = {
          transactionId: data.transactionId || 'PAYPAL_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          amount: finalPrice,
          currency: 'USD',
          method: 'paypal',
          date: new Date().toLocaleString(),
          email: 'paypal-sandbox@example.com'
        };
        onPaymentSuccess(receipt);
      }, 1400);
    } catch {
      setLoading(false);
      const receipt: PaymentReceipt = {
        transactionId: 'PAYPAL_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        amount: finalPrice,
        currency: 'USD',
        method: 'paypal',
        date: new Date().toLocaleString(),
        email: 'paypal-sandbox@example.com'
      };
      onPaymentSuccess(receipt);
    }
  };

  const fillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardHolder('Alex Minecraft');
    setExpiry('11/29');
    setCvc('999');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="relative p-6 bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-zinc-900 border-b border-zinc-800">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
              SECURE CHECKOUT
            </span>
            <div className="flex items-center gap-1 text-[11px] text-zinc-400">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>256-Bit SSL Encrypted</span>
            </div>
          </div>
          <h2 className="text-xl font-bold text-white">Unlock Minecraft Bot Hosting</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Deploy your 24/7 AFK bot with automatic IP/Port configuration &amp; universal auto-connect.
          </p>
        </div>

        {/* Selected Plan Summary Banner */}
        <div className="px-6 py-3.5 bg-zinc-950 border-b border-zinc-800/80 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-white flex items-center gap-2">
              <span>{selectedPlan.name}</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                {selectedPlan.tagline}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400">Auto-renewal optional · Cancel anytime</div>
          </div>
          <div className="text-right">
            {discount > 0 && (
              <span className="text-xs line-through text-zinc-500 mr-2">${selectedPlan.price}</span>
            )}
            <span className="text-lg font-extrabold text-emerald-400">
              ${finalPrice}
            </span>
            <span className="text-[10px] text-zinc-400 block">{selectedPlan.period}</span>
          </div>
        </div>

        {/* Method Switcher */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMethod('stripe')}
              className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all ${
                method === 'stripe'
                  ? 'bg-zinc-800 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/40'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Credit / Debit Card (Stripe)</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('paypal')}
              className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all ${
                method === 'paypal'
                  ? 'bg-zinc-800 border-sky-500 text-white shadow-sm ring-1 ring-sky-500/40'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              <span className="font-extrabold text-[#0079C1]">Pay</span>
              <span className="font-extrabold text-[#00457C]">Pal</span>
              <span>Express</span>
            </button>
          </div>

          {/* Stripe Form */}
          {method === 'stripe' ? (
            <form onSubmit={handleStripePay} className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-300">Card Information</label>
                <button
                  type="button"
                  onClick={fillTestCard}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Use Test Card
                </button>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Email for Receipt</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="player@minecraft.net"
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                  />
                  <div className="absolute right-3 top-2.5 flex items-center gap-1.5 text-[10px] text-zinc-400">
                    <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">VISA</span>
                    <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">MC</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[11px] text-zinc-400 mb-1">Expiry</label>
                  <input
                    type="text"
                    required
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-center"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[11px] text-zinc-400 mb-1">CVC</label>
                  <input
                    type="text"
                    required
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    placeholder="123"
                    className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-center"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[11px] text-zinc-400 mb-1">Postal Code</label>
                  <input
                    type="text"
                    defaultValue="10001"
                    className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-center"
                  />
                </div>
              </div>

              {/* Coupon Code section */}
              <div className="pt-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
                    <input
                      type="text"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      placeholder="Promo code (try MINECRAFT50)"
                      className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono uppercase"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 rounded-lg transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {couponSuccess && (
                  <p className="text-[11px] text-emerald-400 mt-1 font-medium">{couponSuccess}</p>
                )}
                {couponError && (
                  <p className="text-[11px] text-rose-400 mt-1">{couponError}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-zinc-950 font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Processing Stripe Authorization...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-zinc-950" />
                    <span>Pay ${finalPrice} &amp; Configure Server IP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* PayPal Simulation View */
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-center space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 text-[#0079C1] border border-[#0079C1]/30">
                  <span className="font-extrabold text-lg">PP</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">PayPal One-Touch Checkout</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Connect your PayPal account or pay via PayPal Credit without sharing card details.
                  </p>
                </div>

                <div className="p-3 bg-zinc-900 rounded-lg text-left text-xs border border-zinc-800">
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span>Payment amount:</span>
                    <span className="text-white font-mono font-bold">${finalPrice} USD</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Sandbox account:</span>
                    <span className="text-emerald-400 font-mono">sandbox-payer@minebot.net</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePayPalPay}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#FFC439] hover:bg-[#F2BA36] text-[#003087] font-bold rounded-xl text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#003087]" />
                      <span>Connecting with PayPal...</span>
                    </>
                  ) : (
                    <>
                      <span className="font-extrabold">Pay</span>
                      <span className="font-extrabold text-[#0079C1]">Pal</span>
                      <span>— Complete Purchase (${finalPrice})</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMethod('stripe')}
                  className="text-xs text-zinc-400 hover:text-white underline"
                >
                  Prefer credit card? Switch to Stripe
                </button>
              </div>
            </div>
          )}

          {/* Trust badges */}
          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-center gap-4 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Instant Deployment
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Anti-Ban Protection
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              Universal Support
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
