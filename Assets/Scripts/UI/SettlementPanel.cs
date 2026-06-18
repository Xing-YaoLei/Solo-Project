using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UsedCarGame.Core;
using UsedCarGame.Data;

namespace UsedCarGame.UI
{
    public class SettlementPanel : UIPanelBase
    {
        [Header("Result Badge")]
        [SerializeField] private TMP_Text resultTitleText;
        [SerializeField] private Image resultBackgroundImage;
        [SerializeField] private TMP_Text levelNameText;

        [Header("Speed Stats (速度)")]
        [SerializeField] private TMP_Text totalTimeText;
        [SerializeField] private TMP_Text avgTimePerQuestionText;
        [SerializeField] private TMP_Text timeRemainingText;
        [SerializeField] private TMP_Text timeScoreBonusText;
        [SerializeField] private Image speedRatingFill;
        [SerializeField] private TMP_Text speedRatingText;

        [Header("Error Stats (错误次数)")]
        [SerializeField] private TMP_Text totalAnsweredText;
        [SerializeField] private TMP_Text correctCountText;
        [SerializeField] private TMP_Text errorCountText;
        [SerializeField] private TMP_Text accuracyRateText;
        [SerializeField] private Image errorRatingFill;
        [SerializeField] private TMP_Text errorRatingText;

        [Header("Consecutive Stats (连续正确)")]
        [SerializeField] private TMP_Text maxConsecutiveText;
        [SerializeField] private TMP_Text consecutiveBonusText;
        [SerializeField] private Image consecutiveRatingFill;
        [SerializeField] private TMP_Text consecutiveRatingText;

        [Header("Final Score")]
        [SerializeField] private TMP_Text finalScoreText;
        [SerializeField] private TMP_Text passConditionText;
        [SerializeField] private TMP_Text inventoryTurnoverText;

        [Header("Buttons")]
        [SerializeField] private Button retryButton;
        [SerializeField] private Button backToMenuButton;
        [SerializeField] private Button reviewButton;

        private GameSession _session;

        public override void Initialize()
        {
            base.Initialize();
            if (retryButton != null) retryButton.onClick.AddListener(OnRetryClicked);
            if (backToMenuButton != null) backToMenuButton.onClick.AddListener(OnBackToMenuClicked);
            if (reviewButton != null) reviewButton.onClick.AddListener(OnReviewClicked);
        }

        protected override void OnShow()
        {
            base.OnShow();

            if (ServiceLocator.TryGet(out _session))
            {
                DisplayResult(_session.CurrentResult, _session.CurrentLevel);
            }
        }

        private void DisplayResult(SessionResult result, LevelConfig config)
        {
            if (result == null || config == null) return;

            if (levelNameText != null) levelNameText.text = config.levelName;

            if (resultTitleText != null)
            {
                resultTitleText.text = result.isPassed ? "✓ 通过考核" : "✗ 未达标准";
                resultTitleText.color = result.isPassed ? new Color(0.1f, 0.6f, 0.2f) : new Color(0.75f, 0.2f, 0.2f);
            }

            if (resultBackgroundImage != null)
            {
                resultBackgroundImage.color = result.isPassed
                    ? new Color(0.9f, 0.98f, 0.9f, 1f)
                    : new Color(0.98f, 0.9f, 0.9f, 1f);
            }

            DisplaySpeedStats(result, config);
            DisplayErrorStats(result, config);
            DisplayConsecutiveStats(result, config);

            if (finalScoreText != null) finalScoreText.text = $"{result.finalScore} 分";

            if (passConditionText != null)
            {
                passConditionText.text =
                    $"通过条件：答对≥{config.minCorrectForPass}题  错误率≤{config.maxErrorRateForPass * 100:F0}%";
            }

            if (inventoryTurnoverText != null)
            {
                inventoryTurnoverText.text =
                    $"库存周转评级：{GetTurnoverRating(result.inventoryTurnoverRating)} ({result.inventoryTurnoverRating * 100:F0}%)";
            }
        }

        private void DisplaySpeedStats(SessionResult result, LevelConfig config)
        {
            var timeUsed = result.totalTimeSeconds - result.timeRemaining;

            if (totalTimeText != null)
            {
                totalTimeText.text = FormatTime(timeUsed);
            }

            if (avgTimePerQuestionText != null)
            {
                avgTimePerQuestionText.text = $"{result.avgTimePerQuestion:F1} 秒/题";
            }

            if (timeRemainingText != null)
            {
                timeRemainingText.text = $"剩余 {FormatTime(result.timeRemaining)}";
            }

            var timeBonus = Mathf.Max(0, (int)(result.timeRemaining * config.timeBonusPerSecond));
            if (timeScoreBonusText != null)
            {
                timeScoreBonusText.text = $"时间奖励：+{timeBonus} 分";
            }

            float speedRatio = result.totalAnswered > 0
                ? Mathf.Clamp01(1f - (result.avgTimePerQuestion / (config.totalTimeSeconds / config.questionsPerSession)))
                : 0f;

            if (speedRatingFill != null)
            {
                speedRatingFill.fillAmount = speedRatio;
                speedRatingFill.color = speedRatio >= 0.7f ? new Color(0.1f, 0.6f, 0.2f)
                    : speedRatio >= 0.4f ? new Color(0.9f, 0.6f, 0.1f)
                    : new Color(0.75f, 0.2f, 0.2f);
            }

            if (speedRatingText != null)
            {
                speedRatingText.text = GetRatingLabel(speedRatio, "速度");
            }
        }

        private void DisplayErrorStats(SessionResult result, LevelConfig config)
        {
            if (totalAnsweredText != null)
            {
                totalAnsweredText.text = $"答题：{result.totalAnswered} / {result.totalQuestions}";
            }

            if (correctCountText != null)
            {
                correctCountText.text = $"✓ 正确：{result.correctCount}";
                correctCountText.color = new Color(0.1f, 0.6f, 0.2f);
            }

            if (errorCountText != null)
            {
                errorCountText.text = $"✗ 错误：{result.errorCount}";
                errorCountText.color = new Color(0.75f, 0.2f, 0.2f);
            }

            if (accuracyRateText != null)
            {
                accuracyRateText.text = $"正确率：{result.accuracyRate * 100:F1}%";
            }

            float errorRatio = Mathf.Clamp01(1f - (float)result.errorCount / Mathf.Max(1, config.questionsPerSession));

            if (errorRatingFill != null)
            {
                errorRatingFill.fillAmount = errorRatio;
                errorRatingFill.color = errorRatio >= 0.8f ? new Color(0.1f, 0.6f, 0.2f)
                    : errorRatio >= 0.5f ? new Color(0.9f, 0.6f, 0.1f)
                    : new Color(0.75f, 0.2f, 0.2f);
            }

            if (errorRatingText != null)
            {
                errorRatingText.text = GetRatingLabel(errorRatio, "准确率");
            }
        }

        private void DisplayConsecutiveStats(SessionResult result, LevelConfig config)
        {
            if (maxConsecutiveText != null)
            {
                maxConsecutiveText.text = $"最高连对：{result.maxConsecutiveCorrect} 题";
            }

            var consecutiveBonus = result.maxConsecutiveCorrect * config.consecutiveCorrectBonus;
            if (consecutiveBonusText != null)
            {
                consecutiveBonusText.text = $"连击奖励：+{consecutiveBonus} 分";
            }

            float consecutiveRatio = Mathf.Clamp01((float)result.maxConsecutiveCorrect / Mathf.Max(1, config.questionsPerSession));

            if (consecutiveRatingFill != null)
            {
                consecutiveRatingFill.fillAmount = consecutiveRatio;
                consecutiveRatingFill.color = consecutiveRatio >= 0.6f ? new Color(0.1f, 0.6f, 0.2f)
                    : consecutiveRatio >= 0.3f ? new Color(0.9f, 0.6f, 0.1f)
                    : new Color(0.75f, 0.2f, 0.2f);
            }

            if (consecutiveRatingText != null)
            {
                consecutiveRatingText.text = GetRatingLabel(consecutiveRatio, "稳定性");
            }
        }

        private static string FormatTime(float seconds)
        {
            var m = Mathf.FloorToInt(seconds / 60f);
            var s = Mathf.FloorToInt(seconds % 60f);
            return $"{m:00}:{s:00}";
        }

        private static string GetRatingLabel(float ratio, string label)
        {
            if (ratio >= 0.85f) return $"{label}：S";
            if (ratio >= 0.7f) return $"{label}：A";
            if (ratio >= 0.5f) return $"{label}：B";
            if (ratio >= 0.3f) return $"{label}：C";
            return $"{label}：D";
        }

        private static string GetTurnoverRating(float ratio)
        {
            if (ratio >= 0.85f) return "极佳";
            if (ratio >= 0.7f) return "优秀";
            if (ratio >= 0.5f) return "良好";
            if (ratio >= 0.3f) return "一般";
            return "待改进";
        }

        private void OnRetryClicked()
        {
            GameManager.Instance?.RetryLevel();
        }

        private void OnBackToMenuClicked()
        {
            GameManager.Instance?.ReturnToMainMenu();
        }

        private void OnReviewClicked()
        {
            GameManager.Instance?.OpenReview();
        }
    }
}
