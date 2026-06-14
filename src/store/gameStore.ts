import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, Chapter, GameStats, LeaderboardEntry, LeaderboardType, Player, Question } from '../types';
import { chapters as initialChapters, players as initialPlayers, tutorialSteps } from '../data/gameData';

interface AnswerRecord {
  questionId: string;
  isCorrect: boolean;
  selectedAnswers: number[];
  timeSpent: number;
}

interface AssignmentProgress {
  assignmentId: string;
  answers: AnswerRecord[];
  totalTimeSpent: number;
}

interface GameStore extends GameState {
  assignmentProgress: Record<string, AssignmentProgress>;
  setView: (view: GameState['currentView']) => void;
  selectChapter: (chapterId: string) => void;
  selectAssignment: (assignmentId: string) => void;
  selectAnswer: (answerIndex: number) => void;
  submitAnswer: () => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  getCurrentChapter: () => Chapter | undefined;
  getCurrentAssignment: () => Chapter['assignments'][0] | undefined;
  getCurrentQuestion: () => Chapter['assignments'][0]['questions'][0] | undefined;
  getLeaderboard: (type: LeaderboardType, chapterId?: string) => LeaderboardEntry[];
  updateStats: (chapterId: string, correct: boolean, timeSpent: number, questionId: string) => void;
  getStats: () => GameStats[];
  completeChapter: (chapterId: string) => void;
  nextTutorialStep: () => void;
  skipTutorial: () => void;
  resetTutorial: () => void;
  resetGame: () => void;
  getPlayer: () => Player | undefined;
  updatePlayerScore: (points: number) => void;
  updatePlayerCompletionStats: () => void;
  isQuestionAnswered: (questionId: string) => boolean;
}

const checkAnswerCorrect = (question: Question, selected: number[]): boolean => {
  if (Array.isArray(question.correctAnswer)) {
    const sortedCorrect = [...question.correctAnswer].sort();
    const sortedSelected = [...selected].sort();
    return sortedCorrect.length === sortedSelected.length &&
      sortedCorrect.every((val, idx) => val === sortedSelected[idx]);
  }
  return selected.length === 1 && selected[0] === question.correctAnswer;
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      currentView: 'menu',
      currentChapterId: null,
      currentAssignmentId: null,
      currentQuestionIndex: 0,
      selectedAnswers: [],
      showResult: false,
      isCorrect: false,
      tutorialStep: 0,
      showTutorial: true,
      chapters: initialChapters,
      players: initialPlayers,
      stats: [],
      gameStartTime: Date.now(),
      questionStartTime: Date.now(),
      assignmentProgress: {},

      setView: (view) => set({ currentView: view }),

      selectChapter: (chapterId) => {
        const chapter = get().chapters.find(c => c.id === chapterId);
        if (chapter && chapter.unlocked) {
          set({
            currentChapterId: chapterId,
            currentAssignmentId: null,
            currentQuestionIndex: 0,
            selectedAnswers: [],
            showResult: false
          });
        }
      },

      selectAssignment: (assignmentId) => {
        if (!assignmentId) {
          set({
            currentAssignmentId: null,
            currentQuestionIndex: 0,
            selectedAnswers: [],
            showResult: false
          });
          return;
        }
        set((state) => ({
          currentAssignmentId: assignmentId,
          currentQuestionIndex: 0,
          selectedAnswers: [],
          showResult: false,
          questionStartTime: Date.now(),
          assignmentProgress: {
            ...state.assignmentProgress,
            [assignmentId]: state.assignmentProgress[assignmentId] || {
              assignmentId,
              answers: [],
              totalTimeSpent: 0
            }
          }
        }));
      },

      isQuestionAnswered: (questionId) => {
        const assignmentId = get().currentAssignmentId;
        if (!assignmentId) return false;
        const progress = get().assignmentProgress[assignmentId];
        return progress?.answers.some(a => a.questionId === questionId) || false;
      },

      selectAnswer: (answerIndex) => {
        const question = get().getCurrentQuestion();
        if (!question || get().showResult) return;
        if (get().isQuestionAnswered(question.id)) return;

        if (question.type === 'single' || question.type === 'schedule') {
          set({ selectedAnswers: [answerIndex] });
        } else {
          set((state) => {
            const isSelected = state.selectedAnswers.includes(answerIndex);
            return {
              selectedAnswers: isSelected
                ? state.selectedAnswers.filter(i => i !== answerIndex)
                : [...state.selectedAnswers, answerIndex]
            };
          });
        }
      },

      submitAnswer: () => {
        const question = get().getCurrentQuestion();
        const { selectedAnswers, currentAssignmentId, currentChapterId } = get();

        if (!question || selectedAnswers.length === 0 || !currentAssignmentId) return;
        if (get().isQuestionAnswered(question.id)) return;

        const isCorrect = checkAnswerCorrect(question, selectedAnswers);
        const timeSpent = Date.now() - get().questionStartTime;

        const record: AnswerRecord = {
          questionId: question.id,
          isCorrect,
          selectedAnswers: [...selectedAnswers],
          timeSpent
        };

        set((state) => {
          const prev = state.assignmentProgress[currentAssignmentId] || {
            assignmentId: currentAssignmentId,
            answers: [],
            totalTimeSpent: 0
          };
          return {
            showResult: true,
            isCorrect,
            assignmentProgress: {
              ...state.assignmentProgress,
              [currentAssignmentId]: {
                ...prev,
                answers: [...prev.answers, record],
                totalTimeSpent: prev.totalTimeSpent + timeSpent
              }
            }
          };
        });

        if (currentChapterId) {
          get().updateStats(currentChapterId, isCorrect, timeSpent, question.id);
        }

        if (isCorrect) {
          get().updatePlayerScore(question.points);
        }
      },

      nextQuestion: () => {
        const assignment = get().getCurrentAssignment();
        if (!assignment) return;

        const nextIndex = get().currentQuestionIndex + 1;
        if (nextIndex < assignment.questions.length) {
          set({
            currentQuestionIndex: nextIndex,
            selectedAnswers: [],
            showResult: false,
            questionStartTime: Date.now()
          });
        } else {
          const { currentChapterId, currentAssignmentId } = get();
          if (currentChapterId && currentAssignmentId) {
            const progress = get().assignmentProgress[currentAssignmentId];

            const score = assignment.questions.reduce((sum, q) => {
              const record = progress?.answers.find(a => a.questionId === q.id);
              return sum + (record?.isCorrect ? q.points : 0);
            }, 0);

            const assignmentTime = progress?.totalTimeSpent || 0;

            set((state) => ({
              chapters: state.chapters.map(chapter => {
                if (chapter.id !== currentChapterId) return chapter;
                return {
                  ...chapter,
                  assignments: chapter.assignments.map(assn => {
                    if (assn.id !== currentAssignmentId) return assn;
                    return {
                      ...assn,
                      completed: true,
                      score,
                      completedAt: Date.now(),
                      timeSpent: assignmentTime
                    };
                  }),
                  progress: Math.min(100, chapter.progress + (100 / chapter.assignments.length))
                };
              })
            }));

            get().updatePlayerCompletionStats();
          }
          get().completeChapter(currentChapterId!);
        }
      },

      prevQuestion: () => {
        if (get().currentQuestionIndex > 0) {
          const assignment = get().getCurrentAssignment();
          const prevIndex = get().currentQuestionIndex - 1;
          const prevQ = assignment?.questions[prevIndex];

          if (prevQ && get().isQuestionAnswered(prevQ.id)) {
            const progress = get().assignmentProgress[get().currentAssignmentId!];
            const record = progress?.answers.find(a => a.questionId === prevQ.id);
            set({
              currentQuestionIndex: prevIndex,
              selectedAnswers: record?.selectedAnswers || [],
              showResult: true,
              isCorrect: record?.isCorrect || false,
              questionStartTime: Date.now()
            });
          } else {
            set({
              currentQuestionIndex: prevIndex,
              selectedAnswers: [],
              showResult: false,
              questionStartTime: Date.now()
            });
          }
        }
      },

      getCurrentChapter: () => {
        return get().chapters.find(c => c.id === get().currentChapterId);
      },

      getCurrentAssignment: () => {
        const chapter = get().getCurrentChapter();
        return chapter?.assignments.find(a => a.id === get().currentAssignmentId);
      },

      getCurrentQuestion: () => {
        const assignment = get().getCurrentAssignment();
        return assignment?.questions[get().currentQuestionIndex];
      },

      getLeaderboard: (type: LeaderboardType, chapterId?: string) => {
        const { players, stats } = get();

        const entries: LeaderboardEntry[] = players.map(player => {
          let value: number;
          let playerCompletionRate = 0;
          let playerTotalTime = 0;

          if (player.id === 'player') {
            const playerStats = chapterId
              ? stats.filter(s => s.chapterId === chapterId)
              : stats;

            const totalQ = playerStats.reduce((s, st) => s + st.totalQuestions, 0);
            const totalC = playerStats.reduce((s, st) => s + st.correctAnswers, 0);
            playerCompletionRate = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0;
            playerTotalTime = playerStats.reduce((s, st) => s + st.timeSpent, 0);

            if (chapterId && playerStats.length === 0) {
              if (type === 'completionRate') {
                value = 0;
              } else {
                value = Number.MAX_SAFE_INTEGER;
              }
            } else if (type === 'completionRate') {
              value = playerCompletionRate;
            } else {
              value = totalQ > 0 ? playerTotalTime : Number.MAX_SAFE_INTEGER;
            }
          } else {
            if (chapterId) {
              const chapterIndex = parseInt(chapterId.replace('chapter-', '')) - 1;
              const baseRate = Math.max(30, player.completionRate - chapterIndex * 8);
              const baseTime = player.totalTime + chapterIndex * 120000;
              
              if (type === 'completionRate') {
                value = Math.min(100, baseRate);
              } else {
                value = baseTime;
              }
            } else {
              if (type === 'completionRate') {
                value = player.completionRate;
              } else {
                value = player.totalTime > 0 ? player.totalTime : 999999999;
              }
            }
          }

          return {
            playerId: player.id,
            playerName: player.name,
            avatar: player.avatar,
            value,
            rank: 0,
            chapterId
          };
        });

        if (type === 'completionRate') {
          entries.sort((a, b) => b.value - a.value);
        } else {
          entries.sort((a, b) => a.value - b.value);
        }

        return entries.map((entry, index) => ({ ...entry, rank: index + 1 }));
      },

      updateStats: (chapterId: string, correct: boolean, timeSpent: number, _questionId: string) => {
        set((state) => {
          const existingStatIndex = state.stats.findIndex(s => s.chapterId === chapterId);
          const chapter = state.chapters.find(c => c.id === chapterId);

          if (existingStatIndex >= 0) {
            const stat = state.stats[existingStatIndex];
            const newCorrect = stat.correctAnswers + (correct ? 1 : 0);
            const newTotal = stat.totalQuestions + 1;
            const newCompletionRate = Math.round((newCorrect / newTotal) * 100);

            return {
              stats: state.stats.map((s, i) =>
                i === existingStatIndex
                  ? {
                      ...s,
                      totalQuestions: newTotal,
                      correctAnswers: newCorrect,
                      completionRate: newCompletionRate,
                      timeSpent: s.timeSpent + timeSpent,
                      averageScore: Math.round((s.averageScore * (newTotal - 1) + (correct ? 100 : 0)) / newTotal),
                      attempts: s.attempts + 1,
                      lastPlayedAt: Date.now()
                    }
                  : s
              )
            };
          }

          return {
            stats: [
              ...state.stats,
              {
                chapterId,
                chapterTitle: chapter?.title || '',
                completionRate: correct ? 100 : 0,
                totalQuestions: 1,
                correctAnswers: correct ? 1 : 0,
                timeSpent,
                averageScore: correct ? 100 : 0,
                attempts: 1,
                lastPlayedAt: Date.now()
              }
            ]
          };
        });

        get().updatePlayerCompletionStats();
      },

      getStats: () => get().stats,

      completeChapter: (chapterId) => {
        set((state) => {
          const chapterIndex = state.chapters.findIndex(c => c.id === chapterId);
          if (chapterIndex < 0) return state;
          const chapter = state.chapters[chapterIndex];
          const allAssignmentsCompleted = chapter.assignments.every(a => a.completed);

          if (allAssignmentsCompleted && chapterIndex < state.chapters.length - 1) {
            return {
              chapters: state.chapters.map((c, i) => {
                if (i === chapterIndex) return { ...c, completed: true, progress: 100 };
                if (i === chapterIndex + 1) return { ...c, unlocked: true };
                return c;
              })
            };
          }
          return state;
        });
      },

      nextTutorialStep: () => {
        const { tutorialStep } = get();
        if (tutorialStep < tutorialSteps.length - 1) {
          set({ tutorialStep: tutorialStep + 1 });
        } else {
          set({ showTutorial: false });
        }
      },

      skipTutorial: () => set({ showTutorial: false }),

      resetTutorial: () => set({ showTutorial: true, tutorialStep: 0 }),

      resetGame: () => {
        set({
          currentView: 'menu',
          currentChapterId: null,
          currentAssignmentId: null,
          currentQuestionIndex: 0,
          selectedAnswers: [],
          showResult: false,
          isCorrect: false,
          chapters: initialChapters,
          players: initialPlayers,
          stats: [],
          gameStartTime: Date.now(),
          questionStartTime: Date.now(),
          assignmentProgress: {}
        });
      },

      getPlayer: () => get().players.find(p => p.id === 'player'),

      updatePlayerScore: (points: number) => {
        set((state) => ({
          players: state.players.map(p =>
            p.id === 'player'
              ? { ...p, totalScore: p.totalScore + points }
              : p
          )
        }));
      },

      updatePlayerCompletionStats: () => {
        set((state) => {
          const playerStats = state.stats;
          const totalQ = playerStats.reduce((s, st) => s + st.totalQuestions, 0);
          const totalC = playerStats.reduce((s, st) => s + st.correctAnswers, 0);
          const totalTime = playerStats.reduce((s, st) => s + st.timeSpent, 0);
          const completionRate = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0;
          const level = Math.floor(state.players.find(p => p.id === 'player')!.totalScore / 100) + 1;

          return {
            players: state.players.map(p =>
              p.id === 'player'
                ? { ...p, completionRate, totalTime, level }
                : p
            )
          };
        });
      }
    }),
    {
      name: 'fitness-puzzle-game-storage'
    }
  )
);
