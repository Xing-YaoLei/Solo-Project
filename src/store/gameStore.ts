import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, Chapter, GameStats, LeaderboardEntry, LeaderboardType, Player } from '../types';
import { chapters as initialChapters, players as initialPlayers, tutorialSteps } from '../data/gameData';

interface GameStore extends GameState {
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
  updateStats: (chapterId: string, correct: boolean, timeSpent: number) => void;
  getStats: () => GameStats[];
  completeChapter: (chapterId: string) => void;
  nextTutorialStep: () => void;
  skipTutorial: () => void;
  resetTutorial: () => void;
  resetGame: () => void;
  getPlayer: () => Player | undefined;
  updatePlayerScore: (points: number) => void;
}

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
        set({ 
          currentAssignmentId: assignmentId,
          currentQuestionIndex: 0,
          selectedAnswers: [],
          showResult: false,
          questionStartTime: Date.now()
        });
      },

      selectAnswer: (answerIndex) => {
        const question = get().getCurrentQuestion();
        if (!question || get().showResult) return;

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
        const { selectedAnswers } = get();
        
        if (!question || selectedAnswers.length === 0) return;

        let isCorrect = false;
        if (Array.isArray(question.correctAnswer)) {
          const sortedCorrect = [...question.correctAnswer].sort();
          const sortedSelected = [...selectedAnswers].sort();
          isCorrect = sortedCorrect.length === sortedSelected.length &&
            sortedCorrect.every((val, idx) => val === sortedSelected[idx]);
        } else {
          isCorrect = selectedAnswers.length === 1 && selectedAnswers[0] === question.correctAnswer;
        }

        const timeSpent = Date.now() - get().questionStartTime;
        
        set({ showResult: true, isCorrect });
        
        if (get().currentChapterId) {
          get().updateStats(get().currentChapterId!, isCorrect, timeSpent);
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
            set((state) => ({
              chapters: state.chapters.map(chapter => {
                if (chapter.id !== currentChapterId) return chapter;
                return {
                  ...chapter,
                  assignments: chapter.assignments.map(assn => {
                    if (assn.id !== currentAssignmentId) return assn;
                    const totalPoints = assn.totalPoints;
                    const score = assn.questions.reduce((sum, q) => {
                      let correct = false;
                      if (Array.isArray(q.correctAnswer)) {
                        correct = true;
                      } else {
                        correct = true;
                      }
                      return sum + (correct ? q.points : 0);
                    }, 0);
                    return {
                      ...assn,
                      completed: true,
                      score,
                      completedAt: Date.now(),
                      timeSpent: Date.now() - state.gameStartTime
                    };
                  }),
                  progress: Math.min(100, chapter.progress + (100 / chapter.assignments.length))
                };
              })
            }));
          }
          get().completeChapter(currentChapterId!);
        }
      },

      prevQuestion: () => {
        if (get().currentQuestionIndex > 0) {
          set({ 
            currentQuestionIndex: get().currentQuestionIndex - 1,
            selectedAnswers: [],
            showResult: false,
            questionStartTime: Date.now()
          });
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
        let players = [...get().players];
        
        const playerStats = get().stats.filter(s => s.chapterId === chapterId);
        const playerStatMap = new Map(playerStats.map(s => [s.chapterId, s]));

        const entries = players.map(player => {
          let value: number;
          if (chapterId) {
            const stat = playerStatMap.get(chapterId);
            if (type === 'completionRate') {
              value = stat?.completionRate || 0;
            } else {
              value = stat?.timeSpent || 999999;
            }
          } else {
            if (type === 'completionRate') {
              value = player.completionRate;
            } else {
              value = player.totalTime;
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

      updateStats: (chapterId: string, correct: boolean, timeSpent: number) => {
        set((state) => {
          const existingStatIndex = state.stats.findIndex(s => s.chapterId === chapterId);
          const chapter = state.chapters.find(c => c.id === chapterId);
          
          if (existingStatIndex >= 0) {
            const stat = state.stats[existingStatIndex];
            const newCorrect = stat.correctAnswers + (correct ? 1 : 0);
            const newTotal = stat.totalQuestions + 1;
            return {
              stats: state.stats.map((s, i) => 
                i === existingStatIndex
                  ? {
                      ...s,
                      totalQuestions: newTotal,
                      correctAnswers: newCorrect,
                      completionRate: Math.round((newCorrect / newTotal) * 100),
                      timeSpent: s.timeSpent + timeSpent,
                      attempts: s.attempts + 1,
                      lastPlayedAt: Date.now()
                    }
                  : s
              )
            };
          } else {
            const totalQuestions = chapter?.assignments.reduce(
              (sum, a) => sum + a.questions.length, 0
            ) || 0;
            
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
          }
        });
      },

      getStats: () => get().stats,

      completeChapter: (chapterId) => {
        set((state) => {
          const chapterIndex = state.chapters.findIndex(c => c.id === chapterId);
          const chapter = state.chapters[chapterIndex];
          
          const allAssignmentsCompleted = chapter.assignments.every(a => a.completed);
          
          if (allAssignmentsCompleted && chapterIndex < state.chapters.length - 1) {
            return {
              chapters: state.chapters.map((c, i) => {
                if (i === chapterIndex) {
                  return { ...c, completed: true, progress: 100 };
                }
                if (i === chapterIndex + 1) {
                  return { ...c, unlocked: true };
                }
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
          stats: [],
          gameStartTime: Date.now(),
          questionStartTime: Date.now()
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
      }
    }),
    {
      name: 'fitness-puzzle-game-storage'
    }
  )
);
