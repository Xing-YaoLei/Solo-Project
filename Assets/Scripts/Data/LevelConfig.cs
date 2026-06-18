using System;
using System.Collections.Generic;
using UnityEngine;

namespace UsedCarGame.Data
{
    [Serializable]
    [CreateAssetMenu(fileName = "NewLevelConfig", menuName = "UsedCarGame/Level Config")]
    public class LevelConfig : ScriptableObject
    {
        [Header("Basic Info")]
        public string levelId;
        public string levelName;
        public string description;
        public int difficulty;
        public Sprite previewImage;

        [Header("Time Settings")]
        public float totalTimeSeconds = 300f;
        public float warningThresholdSeconds = 60f;

        [Header("Question Pool")]
        public int questionsPerSession = 10;
        public bool randomizeOrder = true;
        public List<QuestionData> questionPool;

        [Header("Scoring")]
        public int baseCorrectScore = 100;
        public int timeBonusPerSecond = 2;
        public int consecutiveCorrectBonus = 50;
        public int errorPenalty = 50;
        public int maxConsecutiveBonusMultiplier = 5;

        [Header("Inventory Turnover Metrics")]
        public float targetInventoryDays = 14f;
        public float maxInventoryDaysForRating = 60f;

        [Header("Pass Conditions")]
        public int minCorrectForPass = 7;
        public float maxErrorRateForPass = 0.3f;

        public bool IsPass(SessionResult result)
        {
            if (result.totalAnswered == 0) return false;
            var errorRate = (float)result.errorCount / result.totalAnswered;
            return result.correctCount >= minCorrectForPass && errorRate <= maxErrorRateForPass;
        }

        public int CalculateScore(SessionResult result)
        {
            int score = result.correctCount * baseCorrectScore;
            score += Mathf.Max(0, (int)(result.timeRemaining * timeBonusPerSecond));
            score += result.maxConsecutiveCorrect * consecutiveCorrectBonus;
            score -= result.errorCount * errorPenalty;
            return Mathf.Max(0, score);
        }

        public float CalculateInventoryTurnoverRating(SessionResult result)
        {
            if (result.totalAnswered == 0) return 0f;
            float avgDecisionTime = (totalTimeSeconds - result.timeRemaining) / result.totalAnswered;
            float ratio = Mathf.Clamp01(1f - (avgDecisionTime / maxInventoryDaysForRating));
            return ratio;
        }
    }
}
