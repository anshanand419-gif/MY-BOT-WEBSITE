export interface Plan {
  id: string;
  name: string;
  tagline: string;
  price: number;
  priceInr: number;
  period: string;
  popular?: boolean;
  features: string[];
}

export interface PaymentReceipt {
  transactionId: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  method: 'upi_scanner' | 'stripe' | 'paypal';
  date: string;
  email?: string;
  cardLast4?: string;
  utr?: string;
  receiverName?: string;
  receiverUpiId?: string;
  instagramSupport?: string;
}

export interface BotConfig {
  host: string;
  port: number;
  username: string;
}

export interface BotStatusResponse {
  status: 'stopped' | 'starting' | 'running' | 'error';
  isRunning: boolean;
  pid: number | null;
  uptime: number;
  config: BotConfig;
  logsCount: number;
}

export interface BotLog {
  id: string;
  time: string;
  type: 'info' | 'chat' | 'mob' | 'warn' | 'error' | 'success';
  text: string;
}

export interface PingResult {
  reachable: boolean;
  latency: number | null;
  message: string;
  target?: string;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface DynamicKey {
  code: string;
  createdAt: string;
  used: boolean;
  usedAt?: string;
  usedByUtr?: string;
}
