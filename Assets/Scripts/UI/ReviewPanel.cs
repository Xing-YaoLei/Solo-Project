using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UsedCarGame.Core;
using UsedCarGame.Data;

namespace UsedCarGame.UI
{
    public class ReviewPanel : UIPanelBase
    {
        [Header("Overview")]
        [SerializeField] private TMP_Text totalSessionsText;
        [SerializeField] private TMP_Text passRateText;
        [SerializeField] private TMP_Text avgScoreText;
        [SerializeField] private TMP_Text avgInventoryTurnoverText;

        [Header("Level Comparison")]
        [SerializeField] private Transform levelComparisonContainer;
        [SerializeField] private GameObject levelComparisonRowPrefab;

        [Header("Session History")]
        [SerializeField] private Transform sessionHistoryContainer;
        [SerializeField] private GameObject sessionHistoryItemPrefab;

        [Header("Buttons")]
        [SerializeField] private Button backButton;
        [SerializeField] private Button clearHistoryButton;

        private GameSession _session;
        private readonly List<GameObject> _spawnedLevelRows = new List<GameObject>();
        private readonly List<GameObject> _spawnedSessionItems = new List<GameObject>();

        public override void Initialize()
        {
            base.Initialize();
            if (backButton != null) backButton.onClick.AddListener(OnBackClicked);
            if (clearHistoryButton != null) clearHistoryButton.onClick.AddListener(OnClearHistoryClicked);
        }

        protected override void OnShow()
        {
            base.OnShow();
            if (ServiceLocator.TryGet(out _session))
            {
                DisplayReview();
            }
        }

        private void DisplayReview()
        {
            var history = _session.History;
            DisplayOverview(history);
            DisplayLevelComparison(history);
            DisplaySessionHistory(history);
        }

        private void DisplayOverview(IReadOnlyList<SessionResult> history)
        {
            if (totalSessionsText != null)
            {
                totalSessionsText.text = $"总练习次数：{history.Count} 局";
            }

            if (history.Count == 0)
            {
                if (passRateText != null) passRateText.text = "通过率：--";
                if (avgScoreText != null) avgScoreText.text = "平均分数：--";
                if (avgInventoryTurnoverText != null) avgInventoryTurnoverText.text = "平均周转评级：--";
                return;
            }

            int passed = 0;
            int totalScore = 0;
            float totalTurnover = 0f;

            foreach (var r in history)
            {
                if (r.isPassed) passed++;
                totalScore += r.finalScore;
                totalTurnover += r.inventoryTurnoverRating;
            }

            if (passRateText != null)
            {
                float passRate = (float)passed / history.Count;
                passRateText.text = $"通过率：{passRate * 100:F1}% ({passed}/{history.Count})";
                passRateText.color = passRate >= 0.7f ? new Color(0.1f, 0.6f, 0.2f) : new Color(0.75f, 0.2f, 0.2f);
            }

            if (avgScoreText != null)
            {
                avgScoreText.text = $"平均分数：{totalScore / history.Count} 分";
            }

            if (avgInventoryTurnoverText != null)
            {
                float avg = totalTurnover / history.Count;
                avgInventoryTurnoverText.text = $"平均周转评级：{GetTurnoverLabel(avg)} ({avg * 100:F0}%)";
            }
        }

        private void DisplayLevelComparison(IReadOnlyList<SessionResult> history)
        {
            foreach (var go in _spawnedLevelRows)
            {
                if (go != null) Destroy(go);
            }
            _spawnedLevelRows.Clear();

            if (levelComparisonContainer == null) return;

            var levelStats = new Dictionary<string, LevelStat>();
            foreach (var r in history)
            {
                if (!levelStats.ContainsKey(r.levelId))
                {
                    levelStats[r.levelId] = new LevelStat
                    {
                        levelName = r.levelName,
                        levelId = r.levelId
                    };
                }
                levelStats[r.levelId].AddSession(r);
            }

            if (levelStats.Count == 0)
            {
                var empty = Instantiate(levelComparisonRowPrefab, levelComparisonContainer);
                _spawnedLevelRows.Add(empty);
                var text = empty.GetComponentInChildren<TMP_Text>();
                if (text != null) text.text = "暂无数据，快去练习吧！";
                return;
            }

            foreach (var stat in levelStats.Values)
            {
                var row = Instantiate(levelComparisonRowPrefab, levelComparisonContainer);
                _spawnedLevelRows.Add(row);

                var texts = row.GetComponentsInChildren<TMP_Text>();
                var images = row.GetComponentsInChildren<Image>();

                foreach (var t in texts)
                {
                    if (t.name.Contains("LevelName")) t.text = stat.levelName;
                    else if (t.name.Contains("Count")) t.text = $"{stat.SessionCount}局";
                    else if (t.name.Contains("PassRate")) t.text = $"{stat.PassRate * 100:F0}%";
                    else if (t.name.Contains("AvgScore")) t.text = $"{stat.AvgScore}分";
                    else if (t.name.Contains("AvgTime")) t.text = $"{stat.AvgTimePerQuestion:F1}s/题";
                    else if (t.name.Contains("Accuracy")) t.text = $"{stat.AvgAccuracy * 100:F0}%";
                    else if (t.name.Contains("Turnover")) t.text = GetTurnoverLabel(stat.AvgTurnover);
                    else if (t.name.Contains("Consecutive")) t.text = $"{stat.AvgMaxConsecutive:F0}连";
                }

                foreach (var img in images)
                {
                    if (img.name.Contains("TurnoverBar"))
                    {
                        img.fillAmount = Mathf.Clamp01(stat.AvgTurnover);
                        img.color = stat.AvgTurnover >= 0.7f ? new Color(0.1f, 0.6f, 0.2f)
                            : stat.AvgTurnover >= 0.5f ? new Color(0.9f, 0.6f, 0.1f)
                            : new Color(0.75f, 0.2f, 0.2f);
                    }
                    else if (img.name.Contains("AccuracyBar"))
                    {
                        img.fillAmount = Mathf.Clamp01(stat.AvgAccuracy);
                        img.color = stat.AvgAccuracy >= 0.8f ? new Color(0.1f, 0.6f, 0.2f)
                            : stat.AvgAccuracy >= 0.6f ? new Color(0.9f, 0.6f, 0.1f)
                            : new Color(0.75f, 0.2f, 0.2f);
                    }
                }
            }
        }

        private void DisplaySessionHistory(IReadOnlyList<SessionResult> history)
        {
            foreach (var go in _spawnedSessionItems)
            {
                if (go != null) Destroy(go);
            }
            _spawnedSessionItems.Clear();

            if (sessionHistoryContainer == null) return;

            for (int i = history.Count - 1; i >= 0; i--)
            {
                var r = history[i];
                var item = Instantiate(sessionHistoryItemPrefab, sessionHistoryContainer);
                _spawnedSessionItems.Add(item);

                var texts = item.GetComponentsInChildren<TMP_Text>();
                foreach (var t in texts)
                {
                    if (t.name.Contains("LevelName")) t.text = r.levelName;
                    else if (t.name.Contains("Date")) t.text = r.endTime.ToString("MM/dd HH:mm");
                    else if (t.name.Contains("Score")) t.text = $"{r.finalScore}分";
                    else if (t.name.Contains("Result"))
                    {
                        t.text = r.isPassed ? "✓ 通过" : "✗ 未通过";
                        t.color = r.isPassed ? new Color(0.1f, 0.6f, 0.2f) : new Color(0.75f, 0.2f, 0.2f);
                    }
                    else if (t.name.Contains("Turnover")) t.text = GetTurnoverLabel(r.inventoryTurnoverRating);
                    else if (t.name.Contains("Accuracy")) t.text = $"{r.accuracyRate * 100:F0}%";
                    else if (t.name.Contains("Consecutive")) t.text = $"{r.maxConsecutiveCorrect}连";
                    else if (t.name.Contains("Time"))
                    {
                        var used = r.totalTimeSeconds - r.timeRemaining;
                        t.text = $"{used:F0}s";
                    }
                }
            }
        }

        private static string GetTurnoverLabel(float ratio)
        {
            if (ratio >= 0.85f) return "周转极佳";
            if (ratio >= 0.7f) return "周转优秀";
            if (ratio >= 0.5f) return "周转良好";
            if (ratio >= 0.3f) return "周转一般";
            return "周转待改进";
        }

        private void OnBackClicked()
        {
            GameManager.Instance?.ReturnToMainMenu();
        }

        private void OnClearHistoryClicked()
        {
            if (_session != null)
            {
                _session.ClearHistory();
                DisplayReview();
            }
        }

        private class LevelStat
        {
            public string levelId;
            public string levelName;
            public int SessionCount;
            public int PassedCount;
            public int TotalScore;
            public float TotalTurnover;
            public float TotalAccuracy;
            public float TotalTimePerQuestion;
            public int TotalMaxConsecutive;

            public float PassRate => SessionCount > 0 ? (float)PassedCount / SessionCount : 0f;
            public int AvgScore => SessionCount > 0 ? TotalScore / SessionCount : 0;
            public float AvgTurnover => SessionCount > 0 ? TotalTurnover / SessionCount : 0f;
            public float AvgAccuracy => SessionCount > 0 ? TotalAccuracy / SessionCount : 0f;
            public float AvgTimePerQuestion => SessionCount > 0 ? TotalTimePerQuestion / SessionCount : 0f;
            public float AvgMaxConsecutive => SessionCount > 0 ? (float)TotalMaxConsecutive / SessionCount : 0f;

            public void AddSession(SessionResult r)
            {
                SessionCount++;
                if (r.isPassed) PassedCount++;
                TotalScore += r.finalScore;
                TotalTurnover += r.inventoryTurnoverRating;
                TotalAccuracy += r.accuracyRate;
                TotalTimePerQuestion += r.avgTimePerQuestion;
                TotalMaxConsecutive += r.maxConsecutiveCorrect;
            }
        }
    }
}
