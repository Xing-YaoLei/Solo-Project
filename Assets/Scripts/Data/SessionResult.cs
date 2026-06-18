using System;
using System.Collections.Generic;

namespace UsedCarGame.Data
{
    [Serializable]
    public class QuestionResult
    {
        public string questionId;
        public QuestionType type;
        public DecisionAction playerDecision;
        public DecisionAction correctDecision;
        public bool isCorrect;
        public float timeSpentSeconds;
    }

    [Serializable]
    public class SessionResult
    {
        public string levelId;
        public string levelName;
        public int totalQuestions;
        public int totalAnswered;
        public int correctCount;
        public int errorCount;
        public int maxConsecutiveCorrect;
        public int currentConsecutiveCorrect;
        public float totalTimeSeconds;
        public float timeRemaining;
        public int finalScore;
        public bool isPassed;
        public float avgTimePerQuestion;
        public float accuracyRate;
        public float inventoryTurnoverRating;
        public List<QuestionResult> questionResults;
        public DateTime startTime;
        public DateTime endTime;

        public SessionResult()
        {
            questionResults = new List<QuestionResult>();
            startTime = DateTime.Now;
        }

        public void CalculateFinal(LevelConfig config)
        {
            endTime = DateTime.Now;
            totalAnswered = questionResults.Count;
            correctCount = 0;
            errorCount = 0;
            maxConsecutiveCorrect = 0;
            currentConsecutiveCorrect = 0;

            foreach (var qr in questionResults)
            {
                if (qr.isCorrect)
                {
                    correctCount++;
                    currentConsecutiveCorrect++;
                    if (currentConsecutiveCorrect > maxConsecutiveCorrect)
                    {
                        maxConsecutiveCorrect = currentConsecutiveCorrect;
                    }
                }
                else
                {
                    errorCount++;
                    currentConsecutiveCorrect = 0;
                }
            }

            avgTimePerQuestion = totalAnswered > 0
                ? (totalTimeSeconds - timeRemaining) / totalAnswered
                : 0f;

            accuracyRate = totalAnswered > 0
                ? (float)correctCount / totalAnswered
                : 0f;

            isPassed = config.IsPass(this);
            finalScore = config.CalculateScore(this);
            inventoryTurnoverRating = config.CalculateInventoryTurnoverRating(this);
        }
    }
}
