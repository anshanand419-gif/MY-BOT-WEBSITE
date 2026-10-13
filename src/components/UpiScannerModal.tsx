import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Bot,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Clock,
  Instagram,
  Key,
  ShieldAlert
} from 'lucide-react';
import { Plan, PaymentReceipt } from '../types.ts';

interface UpiScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: Plan;
  onPaymentSuccess: (receipt: PaymentReceipt) => void;
}

export const UpiScannerModal: React.FC<UpiScannerModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  onPaymentSuccess
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [payerName, setPayerName] = useState<string>('');
  const [activationCode, setActivationCode] = useState<string>('');
  const [showCodeInput, setShowCodeInput] = useState<boolean>(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedInsta, setCopiedInsta] = useState(false);

  // Verification states
  const [botState, setBotState] = useState<'idle' | 'scanning' | 'pending_approval' | 'verified' | 'error'>('idle');
  const [botLogMessage, setBotLogMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const UPI_ID = 'mukeshkumae078@okicici';
  const RECEIVER_NAME = 'Mukesh Kumar';
  const INSTAGRAM_ID = 'hell_king_ansh';
  const AMOUNT_INR = selectedPlan.priceInr || (selectedPlan.id === 'starter' ? 99 : selectedPlan.id === 'vip' ? 899 : 199);

  // Generate UPI QR code on mount or when plan changes
  useEffect(() => {
    const upiString = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(RECEIVER_NAME)}&am=${AMOUNT_INR}&cu=INR&tn=${encodeURIComponent('Minecraft Bot ' + selectedPlan.name)}`;
    QRCode.toDataURL(upiString, {
      width: 320,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code:', err));
  }, [selectedPlan, AMOUNT_INR]);

  // Clean up polling timer
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const copyUpiId = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const copyInstagram = () => {
    navigator.clipboard.writeText(INSTAGRAM_ID);
    setCopiedInsta(true);
    setTimeout(() => setCopiedInsta(false), 2000);
  };

  // Submit UTR for real bank reconciliation & owner verification
  const handleVerifyPayment = async () => {
    const targetUtr = utrNumber.trim().replace(/\s+/g, '');

    // Strictly enforce 12 numeric digits
    if (!targetUtr || !/^\d{12}$/.test(targetUtr)) {
      setErrorMessage('Invalid UTR! Please enter the exact 12-digit numeric Reference / UTR Number from your Google Pay, PhonePe, or Paytm receipt (e.g., 428190284719).');
      return;
    }

    setErrorMessage('');
    setBotState('scanning');
    setBotLogMessage('Validating UTR sequence with bank settlement server...');

    try {
      const res = await fetch('/api/payment/submit-utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utr: targetUtr,
          amount: AMOUNT_INR,
          planId: selectedPlan.id,
          payerName: payerName || 'Minecraft Player',
          activationCode: activationCode.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit UTR for verification.');
      }

      if (data.verified && data.status === 'approved') {
        // Immediate approval via valid activation code
        setBotState('verified');
        setBotLogMessage(`Payment of ₹${AMOUNT_INR} Confirmed by Owner! Unlocking IP & Port Access...`);

        setTimeout(() => {
          const receipt: PaymentReceipt = {
            transactionId: data.payment?.transactionId || 'UPI_' + targetUtr,
            planId: selectedPlan.id,
            planName: selectedPlan.name,
            amount: AMOUNT_INR,
            currency: 'INR',
            method: 'upi_scanner',
            date: new Date().toLocaleString(),
            utr: targetUtr,
            receiverName: RECEIVER_NAME,
            receiverUpiId: UPI_ID,
            instagramSupport: INSTAGRAM_ID
          };
          onPaymentSuccess(receipt);
        }, 1400);
      } else {
        // Queued for bank reconciliation / owner review
        setBotState('pending_approval');
        setBotLogMessage(`UTR #${targetUtr} submitted. Verifying against Mukesh Kumar's bank statement...`);

        // Start polling for owner approval
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        pollTimerRef.current = setInterval(async () => {
          try {
            const checkRes = await fetch(`/api/payment/check-utr?utr=${targetUtr}`);
            const checkData = await checkRes.json();

            if (checkData.verified && checkData.status === 'approved') {
              if (pollTimerRef.current) clearInterval(pollTimerRef.current);
              setBotState('verified');
              setBotLogMessage(`Payment of ₹${AMOUNT_INR} Approved by Owner! Unlocking...`);

              setTimeout(() => {
                const receipt: PaymentReceipt = {
                  transactionId: 'UPI_' + targetUtr,
                  planId: selectedPlan.id,
                  planName: selectedPlan.name,
                  amount: AMOUNT_INR,
                  currency: 'INR',
                  method: 'upi_scanner',
                  date: new Date().toLocaleString(),
                  utr: targetUtr,
                  receiverName: RECEIVER_NAME,
                  receiverUpiId: UPI_ID,
                  instagramSupport: INSTAGRAM_ID
                };
                onPaymentSuccess(receipt);
              }, 1200);
            } else if (checkData.status === 'rejected') {
              if (pollTimerRef.current) clearInterval(pollTimerRef.current);
              setBotState('error');
              setErrorMessage('Payment Rejected: This UTR was marked as fake / not found in bank statement. DM @hell_king_ansh on Instagram for help.');
            }
          } catch {
            // ignore poll errors
          }
        }, 2500);
      }
    } catch (err: any) {
      setBotState('error');
      setErrorMessage(err.message || 'Verification failed. Please double-check your UTR or DM @hell_king_ansh on Instagram.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-4">
        {/* Header with Help Contact */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-zinc-900 border-b border-zinc-800">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md">
              MANDATORY UPI SCANNER
            </span>
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Real Bank Statement Reconciliation Active</span>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Scan to Pay &amp; Unlock Server Access
          </h2>
          <p className="text-xs text-zinc-300 mt-1 max-w-lg">
            Payment on this scanner is strictly required. Fake UTRs will be rejected. Genuine payments are verified directly against bank statements.
          </p>

          {/* Instagram Help Badge */}
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-semibold">
            <Instagram className="w-4 h-4 text-pink-400 shrink-0" />
            <span>Fast Approval &amp; Help:</span>
            <a
              href="https://www.instagram.com/hell_king_ansh/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:underline flex items-center gap-1 font-bold"
            >
              @{INSTAGRAM_ID}
              <ExternalLink className="w-3 h-3 text-pink-400" />
            </a>
            <button
              onClick={copyInstagram}
              className="p-1 hover:text-white transition-colors"
              title="Copy Instagram ID"
            >
              {copiedInsta ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: Exact UPI Scanner Card */}
            <div className="md:col-span-6 flex flex-col items-center">
              <div className="w-full max-w-[280px] bg-white rounded-3xl p-5 shadow-2xl text-zinc-900 border border-zinc-200 text-center relative overflow-hidden">
                {/* Receiver Info */}
                <div className="flex items-center justify-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-full bg-[#EA4335] text-white font-bold flex items-center justify-center text-base shadow-sm">
                    M
                  </div>
                  <div className="text-left">
                    <h3 className="font-extrabold text-sm text-zinc-900 leading-tight">
                      {RECEIVER_NAME}
                    </h3>
                    <p className="text-[10px] text-zinc-500">Verified Merchant</p>
                  </div>
                </div>

                {/* QR Code Container with Google Pay loop in center */}
                <div className="relative mx-auto my-1 flex items-center justify-center bg-white p-1 rounded-2xl">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="UPI QR Scanner"
                      className="w-56 h-56 object-contain rounded-xl"
                    />
                  ) : (
                    <div className="w-56 h-56 bg-zinc-100 flex items-center justify-center text-xs text-zinc-400">
                      Generating QR...
                    </div>
                  )}

                  {/* Google Pay Center Logo badge */}
                  <div className="absolute inset-0 m-auto w-11 h-11 bg-white rounded-full shadow-lg border border-zinc-200 flex items-center justify-center p-1.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center relative overflow-hidden">
                      <svg viewBox="0 0 48 48" className="w-7 h-7">
                        <path fill="#4285F4" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.3 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.9 6.1C12.4 13.4 17.7 9.5 24 9.5z"/>
                        <path fill="#34A853" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.5c-.5 2.8-2.1 5.2-4.5 6.8l7 5.4c4.1-3.8 7.1-9.4 7.1-16.7z"/>
                        <path fill="#FBBC05" d="M10.5 28.6c-.6-1.7-.9-3.6-.9-5.6s.3-3.9.9-5.6L2.6 11.3C.9 14.7 0 18.7 0 23s.9 8.3 2.6 11.7l7.9-6.1z"/>
                        <path fill="#EA4335" d="M24 48c6.5 0 12-2.1 16-5.8l-7-5.4c-2.2 1.5-5 2.4-9 2.4-6.3 0-11.6-3.9-13.5-9.4L2.6 36C6.6 43.6 14.6 48 24 48z"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* UPI ID text */}
                <div className="mt-2 text-center">
                  <div className="text-[11px] font-mono font-semibold text-zinc-700 bg-zinc-100 py-1 px-2 rounded-lg border border-zinc-200 flex items-center justify-center gap-1.5">
                    <span>UPI ID:</span>
                    <span className="font-bold text-zinc-900">{UPI_ID}</span>
                    <button
                      type="button"
                      onClick={copyUpiId}
                      className="p-1 hover:text-emerald-600 transition-colors cursor-pointer"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] font-medium text-zinc-600 mt-2">
                  Scan to pay with any UPI app
                </p>

                {/* Mobile Pay with UPI intent button */}
                <a
                  href={`upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(RECEIVER_NAME)}&am=${AMOUNT_INR}&cu=INR`}
                  className="mt-3 w-full py-2 px-3 bg-zinc-950 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-zinc-800 transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pay with UPI (Mobile App)</span>
                </a>
              </div>
            </div>

            {/* Right: Plan Info & Bank Reconciliation Box */}
            <div className="md:col-span-6 space-y-4">
              {/* Selected Plan Badge */}
              <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">Selected Plan</span>
                  <h4 className="text-sm font-bold text-white">{selectedPlan.name}</h4>
                  <p className="text-[11px] text-zinc-400">{selectedPlan.tagline}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-emerald-400">₹{AMOUNT_INR}</span>
                  <span className="text-[10px] text-zinc-500 block">INR</span>
                </div>
              </div>

              {/* Bank Reconciliation Box */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Bank Statement UTR Verification</span>
                </div>

                <p className="text-[11px] text-zinc-400">
                  After paying on the scanner, enter the genuine <strong>12-digit UPI UTR</strong>. Fake or dummy sequences will not be approved.
                </p>

                {/* UTR Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    UPI Reference / UTR Number (12 Digits)
                  </label>
                  <input
                    type="text"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g., 428190284719"
                    maxLength={12}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                {/* Optional Payer Name */}
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Your Name (as shown in UPI app)
                  </label>
                  <input
                    type="text"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="Name shown in Google Pay / PhonePe"
                    className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Dynamic One-Time Activation Passcode */}
                <div>
                  {!showCodeInput ? (
                    <button
                      type="button"
                      onClick={() => setShowCodeInput(true)}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1 cursor-pointer"
                    >
                      <Key className="w-3 h-3" />
                      <span>Have a One-Time Activation Code from Instagram @{INSTAGRAM_ID}?</span>
                    </button>
                  ) : (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                          <Key className="w-3 h-3" />
                          <span>One-Time Activation Passcode</span>
                        </label>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          Single-Use Only
                        </span>
                      </div>
                      <input
                        type="text"
                        value={activationCode}
                        onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                        placeholder="Enter unique code (e.g. ANSH-8492-XQ)"
                        className="w-full px-3.5 py-2 bg-zinc-900 border border-emerald-500/50 rounded-xl text-xs font-mono font-bold text-emerald-300 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      {activationCode.trim().toUpperCase() === 'ANSH-VIP' && (
                        <p className="text-[11px] text-rose-400 font-medium">
                          ⚠️ &quot;ANSH-VIP&quot; is just a placeholder example and cannot be used. Har user ke liye har bar alag unique code banta hai jo 1-baar use hote hi burn ho jata hai.
                        </p>
                      )}
                      <p className="text-[10px] text-zinc-400 leading-tight">
                        🔒 <strong>High Security:</strong> Har customer ka code har bar alag hota hai aur sirf ek baar use ho sakta hai. Apna naya code lene ke liye Instagram <strong className="text-pink-300">@{INSTAGRAM_ID}</strong> ko payment screenshot bhejein.
                      </p>
                    </div>
                  )}
                </div>

                {/* Status / Pending Feedback */}
                {botState === 'pending_approval' && (
                  <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs space-y-2.5 animate-in fade-in">
                    <div className="flex items-center gap-2 text-amber-300 font-semibold">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                      <span>Verifying with Bank Statement...</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      UTR <strong>#{utrNumber}</strong> is submitted. Owner is matching it against ICICI settlement logs.
                    </p>
                    <div className="pt-1">
                      <a
                        href="https://www.instagram.com/hell_king_ansh/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 px-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                      >
                        <Instagram className="w-3.5 h-3.5" />
                        <span>Send Screenshot to @{INSTAGRAM_ID} for 1-Sec Approval</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

                {botState === 'verified' && (
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-bold">{botLogMessage}</span>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Submit Verification Button */}
                <button
                  type="button"
                  onClick={handleVerifyPayment}
                  disabled={botState === 'scanning' || botState === 'verified'}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-zinc-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-zinc-950" />
                  <span>
                    {activationCode.trim() ? 'Unlock with Activation Code' : 'Submit UTR for Bank Verification'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Help & Instagram Support Banner */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Payment directly routed to <strong>{RECEIVER_NAME}</strong> ({UPI_ID}).
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-400 text-[11px]">Send Screenshot:</span>
              <a
                href="https://www.instagram.com/hell_king_ansh/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-sm transition-all"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>DM @{INSTAGRAM_ID}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
