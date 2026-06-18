using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UsedCarGame.Core;
using UsedCarGame.Data;

namespace UsedCarGame.Core
{
    public class GameSession
    {
        public LevelConfig CurrentLevel { get; private set; }
        public SessionResult CurrentResult { get; private set; }
        public QuestionData CurrentQuestion { get; private set; }
        public int CurrentQuestionIndex { get; private set; }
        public float TimeRemaining { get; private set; }
        public bool IsRunning { get; private set; }

        private List<QuestionData> _sessionQuestions;
        private float _questionStartTime;
        private readonly List<SessionResult> _history = new List<SessionResult>();

        public event Action OnSessionStarted;
        public event Action<QuestionData, int, int> OnQuestionChanged;
        public event Action<QuestionResult, int, int> OnQuestionAnswered;
        public event Action<float> OnTimeUpdated;
        public event Action<SessionResult> OnSessionCompleted;
        public event Action OnSessionFailed;

        public IReadOnlyList<SessionResult> History => _history;

        public IEnumerator StartNewSession(string levelAddress)
        {
            var provider = ServiceLocator.Get<LevelDataProvider>();
            LevelConfig config = null;
            yield return provider.LoadLevel(levelAddress, c => config = c);

            if (config == null)
            {
                Debug.LogError($"[GameSession] Failed to load level: {levelAddress}");
                OnSessionFailed?.Invoke();
                yield break;
            }

            CurrentLevel = config;
            InitializeSession();
            OnSessionStarted?.Invoke();

            if (_sessionQuestions.Count > 0)
            {
                StartQuestion(0);
            }
            else
            {
                CompleteSession();
            }
        }

        private void InitializeSession()
        {
            CurrentResult = new SessionResult
            {
                levelId = CurrentLevel.levelId,
                levelName = CurrentLevel.levelName,
                totalQuestions = CurrentLevel.questionsPerSession,
                totalTimeSeconds = CurrentLevel.totalTimeSeconds
            };

            TimeRemaining = CurrentLevel.totalTimeSeconds;

            _sessionQuestions = new List<QuestionData>(CurrentLevel.questionPool);
            if (CurrentLevel.randomizeOrder)
            {
                Shuffle(_sessionQuestions);
            }

            if (_sessionQuestions.Count > CurrentLevel.questionsPerSession)
            {
                _sessionQuestions.RemoveRange(CurrentLevel.questionsPerSession,
                    _sessionQuestions.Count - CurrentLevel.questionsPerSession);
            }

            CurrentResult.totalQuestions = _sessionQuestions.Count;
            IsRunning = true;
        }

        public void ResetSession()
        {
            if (CurrentLevel == null) return;
            InitializeSession();
            OnSessionStarted?.Invoke();
            if (_sessionQuestions.Count > 0)
            {
                StartQuestion(0);
            }
        }

        private void StartQuestion(int index)
        {
            CurrentQuestionIndex = index;
            CurrentQuestion = _sessionQuestions[index];
            _questionStartTime = Time.unscaledTime;
            OnQuestionChanged?.Invoke(CurrentQuestion, index + 1, _sessionQuestions.Count);
        }

        public void SubmitAnswer(DecisionAction decision)
        {
            if (!IsRunning || CurrentQuestion == null) return;

            var timeSpent = Time.unscaledTime - _questionStartTime;
            var isCorrect = decision == CurrentQuestion.correctDecision;

            var result = new QuestionResult
            {
                questionId = CurrentQuestion.questionId,
                type = CurrentQuestion.type,
                playerDecision = decision,
                correctDecision = CurrentQuestion.correctDecision,
                isCorrect = isCorrect,
                timeSpentSeconds = timeSpent
            };

            CurrentResult.questionResults.Add(result);

            var audio = ServiceLocator.Get<AudioService>();
            var vibration = ServiceLocator.Get<VibrationService>();
            if (audio != null) { }
            if (vibration != null) { }

            if (isCorrect)
            {
                vibration?.VibrateShort();
            }
            else
            {
                vibration?.VibrateMedium();
            }

            OnQuestionAnswered?.Invoke(result, CurrentQuestionIndex + 1, _sessionQuestions.Count);

            if (CurrentQuestionIndex + 1 >= _sessionQuestions.Count)
            {
                CompleteSession();
            }
            else
            {
                StartQuestion(CurrentQuestionIndex + 1);
            }
        }

        public void Tick(float deltaTime)
        {
            if (!IsRunning) return;

            TimeRemaining -= deltaTime;
            if (TimeRemaining <= 0f)
            {
                TimeRemaining = 0f;
                OnTimeUpdated?.Invoke(TimeRemaining);
                CompleteSession();
                return;
            }

            OnTimeUpdated?.Invoke(TimeRemaining);
        }

        private void CompleteSession()
        {
            if (!IsRunning) return;

            IsRunning = false;
            CurrentResult.timeRemaining = TimeRemaining;
            CurrentResult.CalculateFinal(CurrentLevel);
            _history.Add(CurrentResult);
            OnSessionCompleted?.Invoke(CurrentResult);

            var playfab = ServiceLocator.TryGet(out UsedCarGame.Services.IPlayFabService pfService);
            if (playfab && pfService != null)
            {
                pfService.SubmitSessionResult(CurrentResult);
            }
        }

        public void AbortSession()
        {
            IsRunning = false;
            CurrentLevel = null;
            CurrentQuestion = null;
            CurrentResult = null;
        }

        public List<SessionResult> GetHistoryForLevel(string levelId)
        {
            return _history.FindAll(r => r.levelId == levelId);
        }

        public void ClearHistory()
        {
            _history.Clear();
        }

        private static void Shuffle<T>(List<T> list)
        {
            var rng = new System.Random();
            var n = list.Count;
            while (n > 1)
            {
                n--;
                var k = rng.Next(n + 1);
                (list[k], list[n]) = (list[n], list[k]);
            }
        }
    }
}
