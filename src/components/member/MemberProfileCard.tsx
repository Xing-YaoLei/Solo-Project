import { motion } from 'framer-motion';
import { User, Phone, Mail, Calendar, Coffee, Star, TrendingUp } from 'lucide-react';
import type { Member, MemberStats } from '@/types/member';
import { formatDate } from '@/utils/scoring';

interface MemberProfileCardProps {
  member: Member;
  stats?: MemberStats;
}

const levelLabels: Record<number, string> = {
  1: '新会员',
  2: '银卡会员',
  3: '金卡会员',
  4: '钻石会员',
};

const levelColors: Record<number, string> = {
  1: 'from-gray-400 to-gray-500',
  2: 'from-gray-300 to-gray-400',
  3: 'from-yellow-400 to-yellow-600',
  4: 'from-cyan-400 to-blue-500',
};

const churnRiskColors: Record<string, string> = {
  low: 'text-[#66BB6A]',
  medium: 'text-[#FFA726]',
  high: 'text-[#EF5350]',
};

const churnRiskLabels: Record<string, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};

export function MemberProfileCard({ member, stats }: MemberProfileCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#3E2723]/90 backdrop-blur-md rounded-2xl p-6 text-[#FFF8E1] shadow-2xl border border-[#5D4037]/50"
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-[#FFCC80]/20 flex items-center justify-center text-5xl">
            {member.avatar}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br ${levelColors[member.level]} flex items-center justify-center`}>
            <Star className="w-4 h-4 text-white" fill="white" />
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-[#FFF8E1]">{member.name}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${levelColors[member.level]} text-white font-semibold`}>
              {levelLabels[member.level]}
            </span>
          </div>
          <p className="text-sm text-[#8D6E63] mb-3">
            加入时间：{formatDate(member.joinDate)}
          </p>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-2 bg-[#4E342E]/50 rounded-lg">
              <p className="text-2xl font-bold text-[#FFD54F]">¥{member.balance.toFixed(0)}</p>
              <p className="text-xs text-[#8D6E63]">储值余额</p>
            </div>
            <div className="text-center p-2 bg-[#4E342E]/50 rounded-lg">
              <p className="text-2xl font-bold text-[#FFCC80]">{member.visitCount}</p>
              <p className="text-xs text-[#8D6E63]">到店次数</p>
            </div>
            <div className="text-center p-2 bg-[#4E342E]/50 rounded-lg">
              <p className="text-2xl font-bold text-[#FF8F00]">¥{member.totalSpent}</p>
              <p className="text-xs text-[#8D6E63]">累计消费</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 p-3 bg-[#4E342E]/30 rounded-lg">
          <Phone className="w-4 h-4 text-[#8D6E63]" />
          <span className="text-sm text-[#A1887F]">{member.phone}</span>
        </div>
        <div className="flex items-center gap-2 p-3 bg-[#4E342E]/30 rounded-lg">
          <Mail className="w-4 h-4 text-[#8D6E63]" />
          <span className="text-sm text-[#A1887F]">{member.email}</span>
        </div>
        <div className="flex items-center gap-2 p-3 bg-[#4E342E]/30 rounded-lg">
          <Coffee className="w-4 h-4 text-[#8D6E63]" />
          <span className="text-sm text-[#A1887F]">偏好：{member.preferredDrink}</span>
        </div>
        <div className="flex items-center gap-2 p-3 bg-[#4E342E]/30 rounded-lg">
          <Calendar className="w-4 h-4 text-[#8D6E63]" />
          <span className="text-sm text-[#A1887F]">最近：{formatDate(member.lastVisit)}</span>
        </div>
      </div>

      {stats && (
        <div className="p-4 bg-[#FF8F00]/10 rounded-xl border border-[#FF8F00]/30">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-[#FF8F00]" />
            <span className="font-semibold text-[#FFCC80]">会员分析</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-[#8D6E63] mb-1">流失风险</p>
              <p className={`font-bold ${churnRiskColors[stats.churnRisk]}`}>
                {churnRiskLabels[stats.churnRisk]}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#8D6E63] mb-1">续费率预测</p>
              <p className="font-bold text-[#66BB6A]">{stats.renewalProbability}%</p>
            </div>
            <div>
              <p className="text-xs text-[#8D6E63] mb-1">次均消费</p>
              <p className="font-bold text-[#FFF8E1]">¥{stats.avgSpendPerVisit.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-[#8D6E63] mb-1">近30天消费</p>
              <p className="font-bold text-[#FFF8E1]">¥{stats.last30DaysSpend}</p>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-[#5D4037]/50">
            <p className="text-xs text-[#8D6E63] mb-1">推荐策略</p>
            <p className="text-sm text-[#FFCC80]">{stats.nextBestOffer}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
