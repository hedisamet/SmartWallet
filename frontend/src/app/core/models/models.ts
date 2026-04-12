// ── Auth Models ──────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  fullName: string;
  role: string;
  expiresAt: string;
}

// ── Wallet Models ────────────────────────────────────────────
export interface WalletBalance {
  walletId: string;
  balance: number;
  currency: string;
  isLocked: boolean;
  updatedAt: string;
}

export interface DepositRequest {
  amount: number;
  currency: string;
}

// ── Transfer Models ──────────────────────────────────────────
export interface TransferRequest {
  receiverWalletId: string;
  amount: number;
  currency: string;
  description?: string;
}

export interface TransferResult {
  transactionId: string;
  status: TransactionStatus;
  amount: number;
  currency: string;
  completedAt: string;
}

// ── Transaction Models ───────────────────────────────────────
export type TransactionStatus = 'Pending' | 'Success' | 'Failed';
export type TransactionType   = 'Transfer' | 'Deposit' | 'Withdrawal';

export interface Transaction {
  id: string;
  idempotencyKey: string;
  senderWalletId: string;
  senderName?: string;
  receiverWalletId: string;
  receiverName?: string;
  amount: number;
  currency: string;
  type: TransactionType;
  status: TransactionStatus;
  failureReason?: string;
  description?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Admin Models ─────────────────────────────────────────────
export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  walletId?: string;
  balance?: number;
  currency?: string;
}

// ── API Error ────────────────────────────────────────────────
export interface ApiError {
  error: string;
  statusCode?: number;
}
