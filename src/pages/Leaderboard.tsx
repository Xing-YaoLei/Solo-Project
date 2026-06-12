import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Trophy,
  Medal,
  TrendingUp,
  Users,
  Star,
  Crown,
  Award,
} from 'lucide-react';
import { leaderboardData } from '@/data/mockTasks';
import { storage } from '@/utils/storage';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { LeaderboardEntry, GameRecord } from '@/types/game';

export default function Leaderboard() {
  const navigate = useNavigate();
  const { player } = usePlayerStore();
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [selectedTab, setSelectedTab] = useState<'score' | 'renewal' | 'levels'>('score');

  useEffect(() => {
    const savedRecords = storage.loadRecords<GameRecord[]>([]);
    setRecords(savedRecords);
  }, []);

  const playerBestScore = records.length > 0 ? Math.max(...records.map((r) => r.score)) : 0;
  const playerTotalScore = records.reduce((sum, r) => sum + r.score, 0);
  const playerCompletedLevels = new Set(records.map((r) => r.levelId)).size;
  const playerRenewalRate =
    records.length > 0
      ? Math.round(
          records.reduce((sum, r) => {
            const total = r.correctCount + r.wrongCount;
            return sum + (total > 0 ? (r.correctCount / total) * 100 : 0);
          }, 0) / records.length
        )
      : 0;

  const playerEntry: LeaderboardEntry = {
    id: 'player',
    playerName: player?.name || '你',
    score: playerTotalScore,
    completedLevels: playerCompletedLevels,
    renewalRate: playerRenewalRate,
    rank: 0,
  };

  const sortedByScore = [...leaderboardData, playerEntry]
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  const sortedByRenewal = [...leaderboardData, playerEntry]
    .sort((a, b) => b.renewalRate - a.renewalRate)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  const sortedByLevels = [...leaderboardData, playerEntry]
    .sort((a, b) => b.completedLevels - a.completedLevels)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  const getCurrentData = () => {
    switch (selectedTab) {
      case 'score':
        return sortedByScore;
      case 'renewal':
        return sortedByRenewal;
      case 'levels':
        return sortedByLevels;
      default:
        return sortedByScore;
    }
  };

  const getValueLabel = () => {
    switch (selectedTab) {
      case 'score':
        return '总积分';
      case 'renewal':
        return '续费率';
      case 'levels':
        return '通关数';
      default:
        return '总积分';
    }
  };

  const getValue = (entry: LeaderboardEntry) => {
    switch (selectedTab) {
      case 'score':
        return entry.score;
      case 'renewal':
        return `${entry.renewalRate}%`;
      case 'levels':
        return entry.completedLevels;
      default:
        return entry.score;
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-[#FFD700]" />;
      case 2:
        return <Medal className="w-6 h-6 text-[#C0C0C0]" />;
      case 3:
        return <Medal className="w-6 h-6 text-[#CD7F32]" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-[#8D6E63]">{rank}</span>;
    }
  };

  const getRankBg = (rank: number, isPlayer: boolean) => {
    if (isPlayer) return 'bg-[#FF8F00]/20 border-[#FF8F00]';
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-[#FFD700]/20 to-[#FFB300]/20 border-[#FFD700]/50';
      case 2:
        return 'bg-gradient-to-r from-[#C0C0C0]/20 to-[#E0E0E0]/20 border-[#C0C0C0]/50';
      case 3:
        return 'bg-gradient-to-r from-[#CD7F32]/20 to-[#DEB887]/20 border-[#CD7F32]/50';
      default:
        return 'bg-[#4E342E]/50 border-[#5D4037]/50';
    }
  };

  const topThree = getCurrentData().slice(0, 3);
  const restList = getCurrentData().slice(3);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-[#3E2723] via-[#4E342E] to-[#3E2723] overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-1/4 w-64 h-64 rounded-full bg-[#FF8F00]/5 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full bg-[#66BB6A]/5 blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
        />
      </div>

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

          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gradient">排行榜</h1>
            <Trophy className="w-7 h-7 text-[#FFD700]" />
          </div>

          <div className="w-24" />
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {[
            { id: 'score', label: '积分榜', icon: Star },
            { id: 'renewal', label: '续费率榜', icon: TrendingUp },
            { id: 'levels', label: '通关榜', icon: Award },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                selectedTab === tab.id
                  ? 'bg-[#FF8F00] text-[#3E2723] font-semibold shadow-lg shadow-[#FF8F00]/30'
                  : 'glass-light text-[#8D6E63] hover:text-[#FFF8E1]'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </motion.button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin pr-2">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end justify-center gap-4 mb-8 pt-8">
              {[1, 0, 2].map((position) => {
                const entry = topThree[position];
                if (!entry) return null;
                const isPlayer = entry.id === 'player';
                const heights = ['h-32', 'h-40', 'h-24'];
                const heightClass = heights[position];

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: position * 0.1, type: 'spring' }}
                    className="flex flex-col items-center"
                  >
                    <div className="mb-3 relative">
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
                          isPlayer
                            ? 'bg-gradient-to-br from-[#FF8F00] to-[#FFB300]'
                            : 'bg-[#5D4037]'
                        }`}
                      >
                        {entry.playerName.charAt(0)}
                      </div>
                      <div className="absolute -top-2 -right-2">
                        {getRankIcon(entry.rank)}
                      </div>
                    </div>
                    <p className={`font-bold mb-1 ${isPlayer ? 'text-[#FF8F00]' : 'text-[#FFF8E1]'}`}>
                      {entry.playerName}
                    </p>
                    <p className="text-xs text-[#8D6E63] mb-2">{getValueLabel()}</p>
                    <p
                      className={`text-2xl font-bold ${
                        isPlayer ? 'text-[#FF8F00]' : 'text-[#FFD54F]'
                      }`}
                    >
                      {getValue(entry)}
                    </p>
                    <div
                      className={`w-24 ${heightClass} mt-4 rounded-t-2xl ${
                        isPlayer
                          ? 'bg-gradient-to-t from-[#FF8F00]/30 to-[#FF8F00]/10 border-2 border-[#FF8F00]/50'
                          : position === 1
                          ? 'bg-gradient-to-t from-[#FFD700]/30 to-[#FFD700]/10 border-2 border-[#FFD700]/50'
                          : position === 0
                          ? 'bg-gradient-to-t from-[#C0C0C0]/30 to-[#C0C0C0]/10 border-2 border-[#C0C0C0]/50'
                          : 'bg-gradient-to-t from-[#CD7F32]/30 to-[#CD7F32]/10 border-2 border-[#CD7F32]/50'
                      } flex items-start justify-center pt-3`}
                    >
                      <span className="text-3xl font-bold text-[#FFF8E1]/50">#{entry.rank}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="glass-card rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-[#FFF8E1] mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#FF8F00]" />
                我的排名
              </h3>
              <div
                className={`p-4 rounded-xl border-2 ${getRankBg(
                  getCurrentData().find((e) => e.id === 'player')?.rank || 0,
                  true
                )}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF8F00] to-[#FFB300] flex items-center justify-center text-xl font-bold text-[#3E2723]">
                      {player?.name.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-bold text-[#FFF8E1]">{player?.name || '你'}</p>
                      <p className="text-sm text-[#8D6E63]">当前排名</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-[#FF8F00]">
                      #{getCurrentData().find((e) => e.id === 'player')?.rank || '-'}
                    </p>
                    <p className="text-sm text-[#8D6E63]">
                      {getValueLabel()}: {getValue(playerEntry)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-[#FFF8E1] mb-4">全部排名</h3>
              <div className="space-y-3">
                {restList.map((entry, index) => {
                  const isPlayer = entry.id === 'player';
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-xl border transition-all hover:scale-[1.01] ${getRankBg(
                        entry.rank,
                        isPlayer
                      )}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {getRankIcon(entry.rank)}
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                              isPlayer
                                ? 'bg-gradient-to-br from-[#FF8F00] to-[#FFB300] text-[#3E2723]'
                                : 'bg-[#5D4037] text-[#FFF8E1]'
                            }`}
                          >
                            {entry.playerName.charAt(0)}
                          </div>
                          <div>
                            <p
                              className={`font-medium ${
                                isPlayer ? 'text-[#FF8F00]' : 'text-[#FFF8E1]'
                              }`}
                            >
                              {entry.playerName}
                              {isPlayer && <span className="ml-2 text-xs text-[#FF8F00]">(我)</span>}
                            </p>
                            <p className="text-xs text-[#8D6E63]">
                              通关 {entry.completedLevels} 关 · 续费率 {entry.renewalRate}%
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-xl font-bold ${
                              isPlayer ? 'text-[#FF8F00]' : 'text-[#FFD54F]'
                            }`}
                          >
                            {getValue(entry)}
                          </p>
                          <p className="text-xs text-[#8D6E63]">{getValueLabel()}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
