import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, History, Play } from 'lucide-react';
import {
  members,
  getMemberStatsById,
  getTransactionsByMemberId,
  getRefundsByMemberId,
  getBenefitsByMemberId,
} from '@/data/mockMembers';
import { MemberProfileCard } from '@/components/member/MemberProfileCard';
import { TransactionList } from '@/components/member/TransactionList';
import { ReplayPlayer } from '@/components/member/ReplayPlayer';
import { storage } from '@/utils/storage';
import type { GameRecord } from '@/types/game';
import type { Member } from '@/types/member';
import type { MemberStats, Transaction, Refund, Benefit } from '@/types/member';

type TabType = 'info' | 'transactions' | 'replays';

export default function MemberProfile() {
  const navigate = useNavigate();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [memberStats, setMemberStats] = useState<MemberStats | null>(null);
  const [memberRefunds, setMemberRefunds] = useState<Refund[]>([]);
  const [memberBenefits, setMemberBenefits] = useState<Benefit[]>([]);
  const [memberRecords, setMemberRecords] = useState<GameRecord[]>([]);

  useEffect(() => {
    if (selectedMember) {
      const stats = getMemberStatsById(selectedMember.id);
      const refunds = getRefundsByMemberId(selectedMember.id);
      const benefits = getBenefitsByMemberId(selectedMember.id);
      const allRecords = storage.loadRecords<GameRecord[]>([]);

      setMemberStats(stats || null);
      setMemberRefunds(refunds);
      setMemberBenefits(benefits);
      setMemberRecords(allRecords);
    }
  }, [selectedMember]);

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'info', label: '会员信息', icon: Users },
    { id: 'transactions', label: '交易记录', icon: History },
    { id: 'replays', label: '失败回放', icon: Play },
  ];

  const levelLabels: Record<number, string> = {
    1: '新会员',
    2: '银卡',
    3: '金卡',
    4: '钻石',
  };

  const levelColors: Record<number, string> = {
    1: 'from-gray-400 to-gray-500',
    2: 'from-gray-300 to-gray-400',
    3: 'from-yellow-400 to-yellow-600',
    4: 'from-cyan-400 to-blue-500',
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-[#3E2723] via-[#4E342E] to-[#3E2723] overflow-hidden">
      <div className="relative z-10 w-full h-full flex flex-col p-6">
        <div className="flex items-center justify-between mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass-light hover:bg-[#FFF8E1]/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </motion.button>

          <h1 className="text-3xl font-bold text-gradient">会员档案</h1>

          <div className="w-24" />
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden">
          <div className="w-72 flex-shrink-0">
            <h2 className="text-lg font-semibold text-[#FFF8E1] mb-4">会员列表</h2>
            <div className="space-y-3 overflow-y-auto scrollbar-thin h-[calc(100%-40px)] pr-2">
              {members.map((member, index) => {
                const stats = getMemberStatsById(member.id);
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    onClick={() => setSelectedMember(member)}
                    className={`glass-card rounded-xl p-4 cursor-pointer transition-all duration-300 ${
                      selectedMember?.id === member.id ? 'ring-2 ring-[#FF8F00]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-[#FFCC80]/20 flex items-center justify-center text-2xl">
                          {member.avatar}
                        </div>
                        <div
                          className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br ${levelColors[member.level]} flex items-center justify-center`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#FFF8E1] truncate">{member.name}</p>
                        <p className="text-xs text-[#8D6E63]">
                          {levelLabels[member.level]} · ¥{member.balance.toFixed(0)}
                        </p>
                      </div>
                      <ChurnRiskBadge status={stats?.churnRisk || 'low'} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <AnimatePresence mode="wait">
              {selectedMember ? (
                <motion.div
                  key={selectedMember.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col h-full"
                >
                  <div className="flex gap-2 mb-6">
                    {tabs.map((tab) => (
                      <motion.button
                        key={tab.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                          activeTab === tab.id
                            ? 'bg-[#FF8F00] text-[#3E2723] font-semibold'
                            : 'glass-light text-[#8D6E63] hover:text-[#FFF8E1]'
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                      </motion.button>
                    ))}
                  </div>

                  <div className="flex-1 overflow-y-auto scrollbar-thin pr-2">
                    <AnimatePresence mode="wait">
                      {activeTab === 'info' && (
                        <motion.div
                          key="info"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                        >
                          <MemberProfileCard member={selectedMember} stats={memberStats || undefined} />
                        </motion.div>
                      )}

                      {activeTab === 'transactions' && (
                        <motion.div
                          key="transactions"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="space-y-6"
                        >
                          <TransactionList member={selectedMember} />

                          {memberRefunds.length > 0 && (
                            <div className="glass-card rounded-2xl p-6">
                              <h3 className="text-lg font-semibold text-[#FFF8E1] mb-4">退款记录</h3>
                              <div className="space-y-3">
                                {memberRefunds.map((refund) => (
                                  <div
                                    key={refund.id}
                                    className="p-4 bg-[#4E342E]/50 rounded-xl border border-[#5D4037]/50"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div>
                                        <p className="font-medium text-[#FFF8E1]">{refund.reason}</p>
                                        <p className="text-sm text-[#8D6E63]">
                                          {new Date(refund.createdAt).toLocaleDateString()}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-lg font-bold text-[#66BB6A]">+¥{refund.amount.toFixed(2)}</p>
                                        <p
                                          className={`text-xs px-2 py-0.5 rounded ${
                                            refund.status === 'completed'
                                              ? 'bg-[#66BB6A]/20 text-[#66BB6A]'
                                              : 'bg-[#FFA726]/20 text-[#FFA726]'
                                          }`}
                                        >
                                          {refund.status === 'completed' ? '已完成' : '处理中'}
                                        </p>
                                      </div>
                                    </div>
                                    <p className="text-sm text-[#A1887F] mt-2">{refund.detailedReason}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {memberBenefits.length > 0 && (
                            <div className="glass-card rounded-2xl p-6">
                              <h3 className="text-lg font-semibold text-[#FFF8E1] mb-4">权益信息</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {memberBenefits.map((benefit) => (
                                  <div
                                    key={benefit.id}
                                    className={`p-4 rounded-xl border ${
                                      benefit.isExpired
                                        ? 'bg-[#5D4037]/30 border-[#5D4037]/50 opacity-60'
                                        : 'bg-[#FF8F00]/10 border-[#FF8F00]/30'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <h4 className="font-semibold text-[#FFF8E1]">{benefit.title}</h4>
                                      <span
                                        className={`text-xs px-2 py-0.5 rounded ${
                                          benefit.isExpired
                                            ? 'bg-[#8D6E63]/20 text-[#8D6E63]'
                                            : benefit.isUsed
                                            ? 'bg-[#66BB6A]/20 text-[#66BB6A]'
                                            : 'bg-[#FF8F00]/20 text-[#FF8F00]'
                                        }`}
                                      >
                                        {benefit.isExpired ? '已过期' : benefit.isUsed ? '已使用' : '可用'}
                                      </span>
                                    </div>
                                    <p className="text-sm text-[#A1887F] mb-2">{benefit.description}</p>
                                    <div className="flex items-center justify-between text-xs text-[#8D6E63]">
                                      <span>价值: ¥{benefit.value}</span>
                                      <span>到期: {new Date(benefit.expireDate).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {activeTab === 'replays' && (
                        <motion.div
                          key="replays"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="glass-card rounded-2xl p-6"
                        >
                          <h3 className="text-lg font-semibold text-[#FFF8E1] mb-4">失败回放记录</h3>
                          <p className="text-sm text-[#8D6E63] mb-6">
                            查看与该会员相关任务的失败决策回放，分析犹豫点和错误原因。
                          </p>

                          {memberRecords.length > 0 ? (
                            <div className="space-y-4">
                              {memberRecords.map((record, index) => (
                                <div
                                  key={record.id}
                                  className="p-4 bg-[#4E342E]/50 rounded-xl border border-[#5D4037]/50"
                                >
                                  <div className="flex items-center justify-between mb-4">
                                    <div>
                                      <p className="font-medium text-[#FFF8E1]">游戏记录 #{index + 1}</p>
                                      <p className="text-sm text-[#8D6E63]">
                                        {new Date(record.playedAt).toLocaleString()}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-lg font-bold text-[#FF8F00]">{record.score} 分</p>
                                      <p className="text-xs text-[#8D6E63]">
                                        正确 {record.correctCount}/{record.correctCount + record.wrongCount}
                                      </p>
                                    </div>
                                  </div>
                                  <ReplayPlayer recordId={record.id} />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12 text-[#8D6E63]">
                              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p>暂无游戏记录</p>
                              <p className="text-xs mt-1">完成游戏后会在这里显示相关记录</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex items-center justify-center"
                >
                  <div className="text-center text-[#8D6E63]">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">请从左侧选择一位会员</p>
                    <p className="text-sm">查看详细档案和游戏记录</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChurnRiskBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    low: 'bg-[#66BB6A]',
    medium: 'bg-[#FFA726]',
    high: 'bg-[#EF5350]',
  };

  return (
    <div
      className="w-3 h-3 rounded-full"
      style={{ backgroundColor: colors[status] || colors.low }}
    />
  );
}
