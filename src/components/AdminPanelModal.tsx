import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  ShieldCheck,
  Check,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Key,
  Users,
  Copy,
  Instagram,
  ExternalLink,
  Trash2,
  Sparkles,
  Flame,
  CheckCircle,
  Plus
} from 'lucide-react';
import { DynamicKey } from '../types.ts';

interface Submission {
  id: string;
  utr: string;
  payerName: string;
  amount: number;
  planId: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminApprovedPayment: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  onAdminApprovedPayment
}) => {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [dynamicKeys, setDynamicKeys] = useState<DynamicKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedPrefix, setSelectedPrefix] = useState<'ANSH' | 'VIP' | 'MK'>('ANSH');
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [justGeneratedCode, setJustGeneratedCode] = useState<string | null>(null);

  const fetchAdminData = async (adminPin: string) => {
    setLoading(true);
    try {
      // 1. Fetch UTR Submissions
      const resSubmissions = await fetch('/api/admin/payments');
      const dataSubmissions = await resSubmissions.json();
      setSubmissions(dataSubmissions.submissions || []);

      // 2. Fetch Dynamic Single-Use Keys
      const resKeys = await fetch('/api/admin/keys');
      const dataKeys = await resKeys.json();
      setDynamicKeys(dataKeys.keys || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchAdminData(pin);
      const interval = setInterval(() => fetchAdminData(pin), 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, isAuthenticated, pin]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid Admin PIN');
      }

      setIsAuthenticated(true);
      fetchAdminData(pin.trim());
    } catch (err: any) {
      setError(err.message || 'Incorrect Owner PIN. Access denied.');
    }
  };

  const handleGenerateKey = async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/admin/generate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: pin.trim(),
          prefix: selectedPrefix
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate key');
      }

      if (data.key) {
        setJustGeneratedCode(data.key.code);
        setDynamicKeys(data.keys || []);
        setTimeout(() => setJustGeneratedCode(null), 4000);
      }
    } catch (err: any) {
      setError(err.message || 'Could not generate dynamic key.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteKey = async (code: string) => {
    try {
      const res = await fetch('/api/admin/delete-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim(), code })
      });
      if (res.ok) {
        setDynamicKeys((prev) => prev.filter((k) => k.code !== code));
      }
    } catch {
      // ignore
    }
  };

  const handleApprove = async (utr: string) => {
    try {
      const res = await fetch('/api/admin/approve-utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utr, pin: pin.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        fetchAdminData(pin.trim());
        onAdminApprovedPayment();
      } else {
        alert(data.error || 'Approval failed');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async (utr: string) => {
    try {
      const res = await fetch('/api/admin/reject-utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utr, pin: pin.trim() })
      });
      if (res.ok) {
        fetchAdminData(pin.trim());
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const activeKeys = dynamicKeys.filter((k) => !k.used);
  const usedKeys = dynamicKeys.filter((k) => k.used);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-red-950/70 via-zinc-900 to-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
                  OWNER VERIFICATION PORTAL
                </span>
                <span className="text-xs text-zinc-400">Mukesh Kumar / Ansh</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Dynamic Key Generator &amp; Bank UTR Approval
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {!isAuthenticated ? (
            /* Login PIN Form */
            <form onSubmit={handleLogin} className="max-w-md mx-auto space-y-4 py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto text-emerald-400">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Enter Owner PIN to Access</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Only the owner (Mukesh Kumar / Ansh) can generate dynamic activation keys and approve UTRs.
                </p>
              </div>

              <div>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter Secret Owner PIN"
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-center text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
              </div>

              {error && (
                <p className="text-xs text-rose-400 font-medium">{error}</p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
              >
                Login to Owner Portal
              </button>

              <p className="text-[11px] text-zinc-500 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3 text-zinc-500" />
                <span>Authorized Owner Access Only</span>
              </p>
            </form>
          ) : (
            /* Authenticated Portal Dashboard */
            <div className="space-y-6">
              {/* Dynamic Single-Use Key Generator Box */}
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Dynamic Single-Use Key Generator</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">
                          Har Bar Alag Code
                        </span>
                      </h3>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Har customer ke liye ek naya unique code generate karein. Jaise hi user isse redeem karega, ye code <strong>BURN / EXPIRE</strong> ho jayega.
                      </p>
                    </div>
                  </div>

                  <span className="text-xs text-emerald-400 font-mono font-bold shrink-0">
                    {activeKeys.length} Ready / {usedKeys.length} Burned
                  </span>
                </div>

                {/* Generator Controls */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
                    <span className="text-[11px] text-zinc-500 px-2 font-medium">Prefix:</span>
                    {(['ANSH', 'VIP', 'MK'] as const).map((pref) => (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => setSelectedPrefix(pref)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                          selectedPrefix === pref
                            ? 'bg-emerald-500 text-zinc-950 shadow'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {pref}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateKey}
                    disabled={generating}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-zinc-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4 text-zinc-950" />
                    <span>{generating ? 'Generating...' : `Generate New Unique Code (${selectedPrefix}-XXXX-XX)`}</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Just Generated Notification */}
                {justGeneratedCode && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between animate-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-2 font-mono">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Fresh One-Time Code Created:</span>
                      <strong className="text-white bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40 text-sm">
                        {justGeneratedCode}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyCode(justGeneratedCode)}
                      className="px-2.5 py-1 bg-emerald-500 text-zinc-950 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      {copiedCode === justGeneratedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode === justGeneratedCode ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                  </div>
                )}

                {/* Active Dynamic Keys (Ready to send on Instagram) */}
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-bold text-zinc-300 flex items-center justify-between">
                    <span>Active One-Time Codes (Send to Instagram Payer @hell_king_ansh):</span>
                    <span className="text-zinc-500">Click to copy</span>
                  </div>

                  {activeKeys.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-500 bg-zinc-900/50 rounded-xl border border-zinc-800">
                      No active codes left. Click "+ Generate New Unique Code" above to create one.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {activeKeys.map((keyObj) => (
                        <div
                          key={keyObj.code}
                          className="p-2.5 rounded-xl bg-zinc-900 border border-emerald-500/30 hover:border-emerald-500/70 flex items-center justify-between gap-2 transition-all group"
                        >
                          <div className="truncate">
                            <span className="text-xs font-mono font-black text-emerald-300 block tracking-wide">
                              {keyObj.code}
                            </span>
                            <span className="text-[10px] text-zinc-500 block">
                              Created {new Date(keyObj.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => copyCode(keyObj.code)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-zinc-300 transition-colors cursor-pointer"
                              title="Copy code for Instagram customer"
                            >
                              {copiedCode === keyObj.code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400 group-hover:text-zinc-950" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteKey(keyObj.code)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete code"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Used / Burned Keys Log */}
                {usedKeys.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-zinc-900">
                    <span className="text-[11px] font-bold text-zinc-500 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-rose-500" />
                      <span>Burned &amp; Expired Keys ({usedKeys.length}) - Cannot be reused:</span>
                    </span>
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                      {usedKeys.map((k) => (
                        <span
                          key={k.code}
                          className="px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-500 line-through flex items-center gap-1.5"
                          title={`Redeemed by UTR #${k.usedByUtr || 'N/A'} at ${k.usedAt ? new Date(k.usedAt).toLocaleTimeString() : 'N/A'}`}
                        >
                          <span>{k.code}</span>
                          <span className="text-rose-500 no-underline font-sans font-bold text-[9px] uppercase">
                            Burned
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Pending Submissions Queue */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-red-400" />
                    <span>Submitted UTR Queue ({submissions.length})</span>
                  </h3>
                  <button
                    onClick={() => fetchAdminData(pin)}
                    disabled={loading}
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {submissions.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-xs bg-zinc-950 rounded-2xl border border-zinc-800">
                    No UTRs submitted yet. When users scan the QR and enter their 12-digit UTR, they will appear here for your approval.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto">
                    {submissions.map((sub) => (
                      <div
                        key={sub.id}
                        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                          sub.status === 'approved'
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : sub.status === 'rejected'
                            ? 'bg-rose-950/20 border-rose-500/30'
                            : 'bg-zinc-950 border-zinc-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 font-mono font-bold text-white">
                            <span>UTR: {sub.utr}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                                sub.status === 'approved'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : sub.status === 'rejected'
                                  ? 'bg-rose-500/20 text-rose-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {sub.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-3">
                            <span>Payer: <strong>{sub.payerName}</strong></span>
                            <span>Amount: <strong className="text-emerald-400">₹{sub.amount}</strong></span>
                            <span>{new Date(sub.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>

                        {/* Owner action buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {sub.status !== 'approved' && (
                            <button
                              onClick={() => handleApprove(sub.utr)}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                            >
                              Approve &amp; Unlock
                            </button>
                          )}
                          {sub.status !== 'rejected' && (
                            <button
                              onClick={() => handleReject(sub.utr)}
                              className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                            >
                              Reject Fake
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
