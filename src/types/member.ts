export interface Member {
  id: string;
  name: string;
  avatar: string;
  level: number;
  balance: number;
  totalSpent: number;
  visitCount: number;
  lastVisit: string;
  joinDate: string;
  phone: string;
  email: string;
  preferredDrink: string;
  visitFrequency: 'daily' | 'weekly' | 'monthly' | 'rare';
}

export interface Transaction {
  id: string;
  memberId: string;
  type: 'recharge' | 'purchase' | 'refund' | 'gift';
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
  status: 'completed' | 'pending' | 'cancelled';
  storeId?: string;
  items?: TransactionItem[];
}

export interface TransactionItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Refund {
  id: string;
  memberId: string;
  transactionId: string;
  amount: number;
  reason: string;
  detailedReason: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  handledBy?: string;
  evidence?: string[];
}

export interface Benefit {
  id: string;
  memberId: string;
  type: 'coupon' | 'discount' | 'free_drink' | 'points' | 'birthday';
  title: string;
  description: string;
  value: number;
  expireDate: string;
  isExpired: boolean;
  isUsed: boolean;
  usedAt?: string;
  minPurchase?: number;
}

export interface MemberStats {
  memberId: string;
  totalVisits: number;
  avgSpendPerVisit: number;
  last30DaysSpend: number;
  churnRisk: 'low' | 'medium' | 'high';
  renewalProbability: number;
  nextBestOffer: string;
  preferredVisitTime: string;
}
