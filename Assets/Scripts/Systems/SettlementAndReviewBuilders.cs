using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UsedCarGame.UI;

namespace UsedCarGame.Systems
{
    public static class SettlementBuilder
    {
        public static SettlementPanel Build(Transform parent)
        {
            var panel = RuntimeUIBuilder.CreatePanel(parent, "SettlementPanel");
            var script = panel.AddComponent<SettlementPanel>();
            UIManagerBinder.SetPanelRoot(script, panel);

            var resultTitle = RuntimeUIBuilder.AddText(panel.transform, "✓ 通过考核", 36,
                TextAlignmentOptions.Center, "ResultTitleText");
            (resultTitle.rectTransform.anchorMin, resultTitle.rectTransform.anchorMax) =
                (new Vector2(0, 0.5f), new Vector2(1, 0.5f));
            resultTitle.rectTransform.anchoredPosition = new Vector2(0, 270);
            resultTitle.fontStyle = FontStyles.Bold;
            resultTitle.color = new Color(0.1f, 0.6f, 0.2f, 1f);

            var resultBg = new GameObject("ResultBackground");
            resultBg.transform.SetParent(panel.transform, false);
            resultBg.transform.SetAsFirstSibling();
            var bgRt = resultBg.AddComponent<RectTransform>();
            bgRt.anchorMin = new Vector2(0.1f, 0.72f);
            bgRt.anchorMax = new Vector2(0.9f, 0.88f);
            bgRt.offsetMin = Vector2.zero;
            bgRt.offsetMax = Vector2.zero;
            var bgImg = resultBg.AddComponent<Image>();
            bgImg.color = new Color(0.9f, 0.98f, 0.9f, 1f);

            var levelName = RuntimeUIBuilder.AddText(panel.transform, "新手训练：入门收车", 18,
                TextAlignmentOptions.Center, "LevelNameText");
            (levelName.rectTransform.anchorMin, levelName.rectTransform.anchorMax) =
                (new Vector2(0, 0.5f), new Vector2(1, 0.5f));
            levelName.rectTransform.anchoredPosition = new Vector2(0, 230);
            levelName.color = new Color(0.4f, 0.4f, 0.45f, 1f);

            var finalScore = RuntimeUIBuilder.AddText(panel.transform, "0 分", 48,
                TextAlignmentOptions.Center, "FinalScoreText");
            (finalScore.rectTransform.anchorMin, finalScore.rectTransform.anchorMax) =
                (new Vector2(0, 0.5f), new Vector2(1, 0.5f));
            finalScore.rectTransform.anchoredPosition = new Vector2(0, 160);
            finalScore.fontStyle = FontStyles.Bold;
            finalScore.color = new Color(0.15f, 0.3f, 0.6f, 1f);

            var passCondition = RuntimeUIBuilder.AddText(panel.transform, "通过条件：答对≥7题  错误率≤30%", 14,
                TextAlignmentOptions.Center, "PassConditionText");
            (passCondition.rectTransform.anchorMin, passCondition.rectTransform.anchorMax) =
                (new Vector2(0, 0.5f), new Vector2(1, 0.5f));
            passCondition.rectTransform.anchoredPosition = new Vector2(0, 110);
            passCondition.color = new Color(0.5f, 0.5f, 0.55f, 1f);

            var columnsHolder = new GameObject("Columns");
            columnsHolder.transform.SetParent(panel.transform, false);
            var chRt = columnsHolder.AddComponent<RectTransform>();
            chRt.anchorMin = new Vector2(0.05f, 0.3f);
            chRt.anchorMax = new Vector2(0.95f, 0.6f);
            chRt.offsetMin = Vector2.zero;
            chRt.offsetMax = Vector2.zero;

            var speedCol = BuildStatColumn(columnsHolder.transform, 0, "⚡ 速度", "Speed");
            var errorCol = BuildStatColumn(columnsHolder.transform, 1, "❌ 错误", "Error");
            var consCol = BuildStatColumn(columnsHolder.transform, 2, "🔥 连击", "Consecutive");

            speedCol.mainText.text = "00:00";
            speedCol.subText1.text = "平均：0s/题";
            speedCol.subText2.text = "剩余：00:00";
            speedCol.subText3.text = "时间奖励：+0分";
            speedCol.rating.text = "速度：B";

            errorCol.mainText.text = "0/0";
            errorCol.subText1.text = "答题：0题";
            errorCol.subText2.text = "错误：0次";
            errorCol.subText3.text = "正确率：0%";
            errorCol.rating.text = "准确率：B";

            consCol.mainText.text = "0连";
            consCol.subText1.text = "最高连对：0";
            consCol.subText2.text = "连击奖励：+0分";
            consCol.subText3.text = "稳定性评级";
            consCol.rating.text = "稳定性：B";

            var turnoverText = RuntimeUIBuilder.AddText(panel.transform, "库存周转评级：良好 (60%)", 18,
                TextAlignmentOptions.Center, "InventoryTurnoverText");
            (turnoverText.rectTransform.anchorMin, turnoverText.rectTransform.anchorMax) =
                (new Vector2(0, 0.5f), new Vector2(1, 0.5f));
            turnoverText.rectTransform.anchoredPosition = new Vector2(0, -100);
            turnoverText.fontStyle = FontStyles.Bold;
            turnoverText.color = new Color(0.2f, 0.45f, 0.75f, 1f);

            var btnHolder = new GameObject("Buttons");
            btnHolder.transform.SetParent(panel.transform, false);
            var bhRt = btnHolder.AddComponent<RectTransform>();
            bhRt.anchorMin = new Vector2(0.08f, 0.06f);
            bhRt.anchorMax = new Vector2(0.92f, 0.2f);
            bhRt.offsetMin = Vector2.zero;
            bhRt.offsetMax = Vector2.zero;

            var retryBtn = RuntimeUIBuilder.AddButton(btnHolder.transform, "🔄 再试一次", "RetryButton", 22);
            var rr = retryBtn.GetComponent<RectTransform>();
            rr.anchorMin = new Vector2(0, 0);
            rr.anchorMax = new Vector2(0.32f, 1);
            rr.offsetMin = Vector2.zero;
            rr.offsetMax = Vector2.zero;
            retryBtn.GetComponent<Image>().color = new Color(0.2f, 0.72f, 0.38f, 1f);

            var reviewBtn = RuntimeUIBuilder.AddButton(btnHolder.transform, "📊 查看复盘", "ReviewButton", 20);
            var rer = reviewBtn.GetComponent<RectTransform>();
            rer.anchorMin = new Vector2(0.34f, 0);
            rer.anchorMax = new Vector2(0.65f, 1);
            rer.offsetMin = Vector2.zero;
            rer.offsetMax = Vector2.zero;

            var menuBtn = RuntimeUIBuilder.AddButton(btnHolder.transform, "🏠 返回主菜单", "BackToMenuButton", 20);
            var mr = menuBtn.GetComponent<RectTransform>();
            mr.anchorMin = new Vector2(0.67f, 0);
            mr.anchorMax = new Vector2(1, 1);
            mr.offsetMin = Vector2.zero;
            mr.offsetMax = Vector2.zero;

            UIManagerBinder.SetField(script, "resultTitleText", resultTitle);
            UIManagerBinder.SetField(script, "resultBackgroundImage", bgImg);
            UIManagerBinder.SetField(script, "levelNameText", levelName);
            UIManagerBinder.SetField(script, "finalScoreText", finalScore);
            UIManagerBinder.SetField(script, "passConditionText", passCondition);
            UIManagerBinder.SetField(script, "inventoryTurnoverText", turnoverText);
            UIManagerBinder.SetField(script, "retryButton", retryBtn);
            UIManagerBinder.SetField(script, "backToMenuButton", menuBtn);
            UIManagerBinder.SetField(script, "reviewButton", reviewBtn);

            UIManagerBinder.SetField(script, "totalTimeText", speedCol.mainText);
            UIManagerBinder.SetField(script, "avgTimePerQuestionText", speedCol.subText1);
            UIManagerBinder.SetField(script, "timeRemainingText", speedCol.subText2);
            UIManagerBinder.SetField(script, "timeScoreBonusText", speedCol.subText3);
            UIManagerBinder.SetField(script, "speedRatingFill", speedCol.fill);
            UIManagerBinder.SetField(script, "speedRatingText", speedCol.rating);

            UIManagerBinder.SetField(script, "totalAnsweredText", errorCol.subText1);
            UIManagerBinder.SetField(script, "correctCountText", errorCol.mainText);
            UIManagerBinder.SetField(script, "errorCountText", errorCol.subText2);
            UIManagerBinder.SetField(script, "accuracyRateText", errorCol.subText3);
            UIManagerBinder.SetField(script, "errorRatingFill", errorCol.fill);
            UIManagerBinder.SetField(script, "errorRatingText", errorCol.rating);

            UIManagerBinder.SetField(script, "maxConsecutiveText", consCol.subText1);
            UIManagerBinder.SetField(script, "consecutiveBonusText", consCol.subText2);
            UIManagerBinder.SetField(script, "consecutiveRatingFill", consCol.fill);
            UIManagerBinder.SetField(script, "consecutiveRatingText", consCol.rating);

            return script;
        }

        private class StatColumnResult
        {
            public TMP_Text mainText;
            public TMP_Text subText1;
            public TMP_Text subText2;
            public TMP_Text subText3;
            public Image fill;
            public TMP_Text rating;
        }

        private static StatColumnResult BuildStatColumn(Transform parent, int index,
            string title, string prefix)
        {
            var result = new StatColumnResult();

            var col = new GameObject($"{prefix}Column");
            col.transform.SetParent(parent, false);
            var colRt = col.AddComponent<RectTransform>();
            colRt.anchorMin = new Vector2(index * 0.34f, 0);
            colRt.anchorMax = new Vector2((index + 1) * 0.34f, 1);
            colRt.offsetMin = new Vector2(6, 0);
            colRt.offsetMax = new Vector2(-6, 0);
            col.AddComponent<Image>().color = Color.white;

            var titleText = RuntimeUIBuilder.AddText(col.transform, title, 18);
            (titleText.rectTransform.anchorMin, titleText.rectTransform.anchorMax) =
                (new Vector2(0, 0.5f), new Vector2(1, 0.5f));
            titleText.rectTransform.anchoredPosition = new Vector2(0, 85);
            titleText.fontStyle = FontStyles.Bold;

            var main = RuntimeUIBuilder.AddText(col.transform, "--", 26);
            (main.rectTransform.anchorMin, main.rectTransform.anchorMax) =
                (new Vector2(0, 0.5f), new Vector2(1, 0.5f));
            main.rectTransform.anchoredPosition = new Vector2(0, 45);
            main.fontStyle = FontStyles.Bold;
            main.color = new Color(0.15f, 0.3f, 0.6f, 1f);
            result.mainText = main;

            var s1 = RuntimeUIBuilder.AddText(col.transform, "--", 13);
            (s1.rectTransform.anchorMin, s1.rectTransform.anchorMax) =
                (new Vector2(0, 0.5f), new Vector2(1, 0.5f));
            s1.rectTransform.anchoredPosition = new Vector2(0, 12);
            s1.color = new Color(0.45f, 0.45f, 0.5f, 1f);
            result.subText1 = s1;

            var s2 = RuntimeUIBuilder.AddText(col.transform, "--", 13);
            (s2.rectTransform.anchorMin, s2.rectTransform.anchorMax) =
                (new Vector2(0, 0.5f), new Vector2(1, 0.5f));
            s2.rectTransform.anchoredPosition = new Vector2(0, -10);
            s2.color = new Color(0.45f, 0.45f, 0.5f, 1f);
            result.subText2 = s2;

            var s3 = RuntimeUIBuilder.AddText(col.transform, "--", 13);
            (s3.rectTransform.anchorMin, s3.rectTransform.anchorMax) =
                (new Vector2(0, 0.5f), new Vector2(1, 0.5f));
            s3.rectTransform.anchoredPosition = new Vector2(0, -32);
            s3.color = new Color(0.45f, 0.45f, 0.5f, 1f);
            result.subText3 = s3;

            var fillBg = new GameObject("FillBg");
            fillBg.transform.SetParent(col.transform, false);
            var fbgImg = fillBg.AddComponent<Image>();
            fbgImg.color = new Color(0.85f, 0.85f, 0.9f, 1f);
            var fbgRt = fbgImg.rectTransform;
            fbgRt.anchorMin = new Vector2(0.12f, 0.2f);
            fbgRt.anchorMax = new Vector2(0.88f, 0.26f);
            fbgRt.offsetMin = Vector2.zero;
            fbgRt.offsetMax = Vector2.zero;

            var fillGo = new GameObject("Fill");
            fillGo.transform.SetParent(col.transform, false);
            var fillImg = fillGo.AddComponent<Image>();
            fillImg.color = new Color(0.3f, 0.7f, 0.45f, 1f);
            var fRt = fillImg.rectTransform;
            fRt.anchorMin = new Vector2(0.12f, 0.2f);
            fRt.anchorMax = new Vector2(0.12f, 0.26f);
            fRt.pivot = new Vector2(0, 0.5f);
            fRt.offsetMin = Vector2.zero;
            fRt.offsetMax = Vector2.zero;
            fRt.sizeDelta = new Vector2(0, 0);
            result.fill = fillImg;

            var rating = RuntimeUIBuilder.AddText(col.transform, "评级：B", 16);
            (rating.rectTransform.anchorMin, rating.rectTransform.anchorMax) =
                (new Vector2(0, 0.5f), new Vector2(1, 0.5f));
            rating.rectTransform.anchoredPosition = new Vector2(0, -65);
            rating.fontStyle = FontStyles.Bold;
            rating.color = new Color(0.2f, 0.45f, 0.75f, 1f);
            result.rating = rating;

            return result;
        }
    }

    public static class ReviewBuilder
    {
        public static ReviewPanel Build(Transform parent)
        {
            var panel = RuntimeUIBuilder.CreatePanel(parent, "ReviewPanel");
            var script = panel.AddComponent<ReviewPanel>();
            UIManagerBinder.SetPanelRoot(script, panel);

            var title = RuntimeUIBuilder.AddText(panel.transform, "📊 复盘中心", 32);
            (title.rectTransform.anchorMin, title.rectTransform.anchorMax) =
                (new Vector2(0, 0.5f), new Vector2(1, 0.5f));
            title.rectTransform.anchoredPosition = new Vector2(0, 290);
            title.fontStyle = FontStyles.Bold;

            var overview = new GameObject("Overview");
            overview.transform.SetParent(panel.transform, false);
            var ovRt = overview.AddComponent<RectTransform>();
            ovRt.anchorMin = new Vector2(0.05f, 0.76f);
            ovRt.anchorMax = new Vector2(0.95f, 0.88f);
            ovRt.offsetMin = Vector2.zero;
            ovRt.offsetMax = Vector2.zero;
            overview.AddComponent<Image>().color = Color.white;

            var t1 = RuntimeUIBuilder.AddText(overview.transform, "总练习次数：0局", 16,
                TextAlignmentOptions.Left, "TotalSessionsText");
            SetTextAnchor(t1, 0.03f, 0.55f, 0.47f, 1f);

            var t2 = RuntimeUIBuilder.AddText(overview.transform, "通过率：--", 16,
                TextAlignmentOptions.Center, "PassRateText");
            SetTextAnchor(t2, 0.3f, 0.55f, 0.7f, 1f);

            var t3 = RuntimeUIBuilder.AddText(overview.transform, "平均分数：--", 16,
                TextAlignmentOptions.Right, "AvgScoreText");
            SetTextAnchor(t3, 0.53f, 0.55f, 0.97f, 1f);

            var t4 = RuntimeUIBuilder.AddText(overview.transform, "平均周转评级：--", 16,
                TextAlignmentOptions.Center, "AvgInventoryTurnoverText");
            SetTextAnchor(t4, 0.03f, 0f, 0.97f, 0.45f);
            t4.color = new Color(0.2f, 0.45f, 0.75f, 1f);
            t4.fontStyle = FontStyles.Bold;

            var compLabel = RuntimeUIBuilder.AddText(panel.transform, "▎ 各关卡库存周转对比", 18,
                TextAlignmentOptions.Left);
            SetTextAnchor(compLabel, 0.05f, 0.7f, 0.95f, 0.74f);
            compLabel.fontStyle = FontStyles.Bold;

            var compContainer = new GameObject("LevelComparisonContainer");
            compContainer.transform.SetParent(panel.transform, false);
            var ccRt = compContainer.AddComponent<RectTransform>();
            ccRt.anchorMin = new Vector2(0.05f, 0.45f);
            ccRt.anchorMax = new Vector2(0.95f, 0.68f);
            ccRt.offsetMin = Vector2.zero;
            ccRt.offsetMax = Vector2.zero;
            compContainer.AddComponent<Image>().color = new Color(0.98f, 0.98f, 1f, 1f);

            var rowPrefab = new GameObject("LevelComparisonRowPrefab");
            rowPrefab.SetActive(false);
            rowPrefab.AddComponent<RectTransform>().sizeDelta = new Vector2(0, 50);
            rowPrefab.AddComponent<Image>().color = new Color(0.95f, 0.95f, 1f, 1f);

            var histLabel = RuntimeUIBuilder.AddText(panel.transform, "▎ 历史记录", 18,
                TextAlignmentOptions.Left);
            SetTextAnchor(histLabel, 0.05f, 0.4f, 0.95f, 0.44f);
            histLabel.fontStyle = FontStyles.Bold;

            var histContainer = new GameObject("SessionHistoryContainer");
            histContainer.transform.SetParent(panel.transform, false);
            var hcRt = histContainer.AddComponent<RectTransform>();
            hcRt.anchorMin = new Vector2(0.05f, 0.13f);
            hcRt.anchorMax = new Vector2(0.95f, 0.38f);
            hcRt.offsetMin = Vector2.zero;
            hcRt.offsetMax = Vector2.zero;
            histContainer.AddComponent<Image>().color = new Color(0.98f, 0.98f, 1f, 1f);

            var sessionItemPrefab = new GameObject("SessionHistoryItemPrefab");
            sessionItemPrefab.SetActive(false);
            sessionItemPrefab.AddComponent<RectTransform>().sizeDelta = new Vector2(0, 40);
            sessionItemPrefab.AddComponent<Image>().color = Color.white;

            var backBtn = RuntimeUIBuilder.AddButton(panel.transform, "← 返回主菜单", "BackButton", 18);
            var brt = backBtn.GetComponent<RectTransform>();
            brt.anchorMin = new Vector2(0, 0);
            brt.anchorMax = new Vector2(0, 0);
            brt.pivot = new Vector2(0, 0);
            brt.anchoredPosition = new Vector2(30, 25);
            brt.sizeDelta = new Vector2(220, 50);

            var clearBtn = RuntimeUIBuilder.AddButton(panel.transform, "🗑 清空历史", "ClearHistoryButton", 16);
            var crt = clearBtn.GetComponent<RectTransform>();
            crt.anchorMin = new Vector2(1, 0);
            crt.anchorMax = new Vector2(1, 0);
            crt.pivot = new Vector2(1, 0);
            crt.anchoredPosition = new Vector2(-30, 25);
            crt.sizeDelta = new Vector2(180, 44);
            clearBtn.GetComponent<Image>().color = new Color(0.7f, 0.35f, 0.35f, 1f);

            UIManagerBinder.SetField(script, "totalSessionsText", t1);
            UIManagerBinder.SetField(script, "passRateText", t2);
            UIManagerBinder.SetField(script, "avgScoreText", t3);
            UIManagerBinder.SetField(script, "avgInventoryTurnoverText", t4);
            UIManagerBinder.SetField(script, "levelComparisonContainer", ccRt);
            UIManagerBinder.SetField(script, "levelComparisonRowPrefab", rowPrefab);
            UIManagerBinder.SetField(script, "sessionHistoryContainer", hcRt);
            UIManagerBinder.SetField(script, "sessionHistoryItemPrefab", sessionItemPrefab);
            UIManagerBinder.SetField(script, "backButton", backBtn);
            UIManagerBinder.SetField(script, "clearHistoryButton", clearBtn);

            return script;
        }

        private static void SetTextAnchor(TMP_Text text, float xMin, float yMin, float xMax, float yMax)
        {
            var rt = text.rectTransform;
            rt.anchorMin = new Vector2(xMin, yMin);
            rt.anchorMax = new Vector2(xMax, yMax);
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
        }
    }
}
