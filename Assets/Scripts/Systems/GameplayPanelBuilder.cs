using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UsedCarGame.UI;

namespace UsedCarGame.Systems
{
    public static class GameplayBuilder
    {
        public static GameplayPanel Build(Transform parent)
        {
            var panel = RuntimeUIBuilder.CreatePanel(parent, "GameplayPanel");
            var script = panel.AddComponent<GameplayPanel>();
            UIManagerBinder.SetPanelRoot(script, panel);

            var topBar = CreatePanelSection(panel.transform, "TopBar", 0, 1, 80, new Color(0.9f, 0.93f, 0.97f, 1f));

            var levelName = RuntimeUIBuilder.AddText(topBar.transform, "新手训练：入门收车", 18,
                TextAlignmentOptions.Left, "LevelNameText");
            SetTextAnchor(levelName, 0.02f, 0.65f, 0.45f, 1f);

            var timer = RuntimeUIBuilder.AddText(topBar.transform, "03:00", 30,
                TextAlignmentOptions.Center, "TimerText");
            SetTextAnchor(timer, 0.4f, 0.3f, 0.6f, 1f);
            timer.fontStyle = FontStyles.Bold;

            var progress = RuntimeUIBuilder.AddText(topBar.transform, "1/5", 16,
                TextAlignmentOptions.Right, "ProgressText");
            SetTextAnchor(progress, 0.55f, 0.65f, 0.9f, 1f);

            var pauseBtn = RuntimeUIBuilder.AddButton(topBar.transform, "⏸", "PauseButton", 16);
            var prt = pauseBtn.GetComponent<RectTransform>();
            prt.anchorMin = new Vector2(0.93f, 0.5f);
            prt.anchorMax = new Vector2(0.93f, 0.5f);
            prt.anchoredPosition = Vector2.zero;
            prt.sizeDelta = new Vector2(44, 44);

            var statsBar = CreatePanelSection(panel.transform, "StatsBar", -80, 1, 36, new Color(0.97f, 0.97f, 1f, 1f));
            statsBar.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, -80);

            var consecutive = RuntimeUIBuilder.AddText(statsBar.transform, "🔥 连击：0", 14,
                TextAlignmentOptions.Left, "ConsecutiveText");
            SetTextAnchor(consecutive, 0.05f, 0f, 0.35f, 1f);

            var errors = RuntimeUIBuilder.AddText(statsBar.transform, "❌ 错误：0", 14,
                TextAlignmentOptions.Right, "ErrorCountText");
            SetTextAnchor(errors, 0.65f, 0f, 0.95f, 1f);

            var timerFillGo = new GameObject("TimerFill");
            timerFillGo.transform.SetParent(topBar.transform, false);
            timerFillGo.transform.SetAsFirstSibling();
            var timerFillImg = timerFillGo.AddComponent<Image>();
            timerFillImg.color = new Color(0.3f, 0.8f, 0.45f, 0.25f);
            var tfRt = timerFillImg.rectTransform;
            tfRt.anchorMin = Vector2.zero;
            tfRt.anchorMax = Vector2.one;
            tfRt.offsetMin = Vector2.zero;
            tfRt.offsetMax = Vector2.zero;
            tfRt.pivot = new Vector2(0, 0.5f);

            var vehicleInfo = CreatePanelSection(panel.transform, "VehicleInfo", -125, 1, 100, new Color(0.98f, 0.98f, 1f, 1f));

            var brandModel = RuntimeUIBuilder.AddText(vehicleInfo.transform, "大众 朗逸 2019款 1.5L 自动舒适版", 22,
                TextAlignmentOptions.Left, "VehicleBrandModelText");
            SetTextAnchor(brandModel, 0.03f, 0.5f, 0.6f, 1f);
            brandModel.fontStyle = FontStyles.Bold;

            var yearMileage = RuntimeUIBuilder.AddText(vehicleInfo.transform, "2019年 | 45,000公里 | 白色", 14,
                TextAlignmentOptions.Left, "VehicleYearMileageText");
            SetTextAnchor(yearMileage, 0.03f, 0f, 0.6f, 0.5f);
            yearMileage.color = new Color(0.4f, 0.4f, 0.45f, 1f);

            var plateVin = RuntimeUIBuilder.AddText(vehicleInfo.transform, "京A·12345  |  VIN: LFV...", 14,
                TextAlignmentOptions.Left, "VehiclePlateVinText");
            SetTextAnchor(plateVin, 0.03f, 0f, 0.6f, 0.25f);
            plateVin.color = new Color(0.5f, 0.5f, 0.55f, 1f);

            var askedPrice = RuntimeUIBuilder.AddText(vehicleInfo.transform, "卖家报价：¥85,000", 20,
                TextAlignmentOptions.Right, "AskedPriceText");
            SetTextAnchor(askedPrice, 0.55f, 0.45f, 0.97f, 1f);
            askedPrice.color = new Color(0.85f, 0.25f, 0.2f, 1f);
            askedPrice.fontStyle = FontStyles.Bold;

            var marketPrice = RuntimeUIBuilder.AddText(vehicleInfo.transform, "市场参考价：¥82,000", 14,
                TextAlignmentOptions.Right, "MarketPriceText");
            SetTextAnchor(marketPrice, 0.55f, 0f, 0.97f, 0.4f);
            marketPrice.color = new Color(0.4f, 0.4f, 0.45f, 1f);

            var tabsBar = CreatePanelSection(panel.transform, "TabsBar", -235, 1, 50, new Color(0.93f, 0.93f, 0.95f, 1f));

            var tabLabels = new[] { "📈 报价历史", "📋 金融资料", "📑 车辆档案", "🔍 检测报告" };
            var tabBtns = new Button[4];
            for (int i = 0; i < 4; i++)
            {
                var tabBtn = RuntimeUIBuilder.AddButton(tabsBar.transform, tabLabels[i], $"TabBtn_{i}", 14);
                var trt = tabBtn.GetComponent<RectTransform>();
                trt.anchorMin = new Vector2(i * 0.25f, 0.1f);
                trt.anchorMax = new Vector2((i + 1) * 0.25f, 0.9f);
                trt.offsetMin = new Vector2(4, 0);
                trt.offsetMax = new Vector2(-4, 0);
                tabBtns[i] = tabBtn;
            }

            var contentArea = new GameObject("ContentArea");
            contentArea.transform.SetParent(panel.transform, false);
            var caRt = contentArea.AddComponent<RectTransform>();
            caRt.anchorMin = new Vector2(0.05f, 0.2f);
            caRt.anchorMax = new Vector2(0.95f, 0.65f);
            caRt.offsetMin = Vector2.zero;
            caRt.offsetMax = Vector2.zero;
            var caBg = contentArea.AddComponent<Image>();
            caBg.color = Color.white;

            var priceContent = CreateTabContent(contentArea.transform, "PriceHistoryContent", true);
            var priceContainer = new GameObject("PriceHistoryContainer");
            priceContainer.transform.SetParent(priceContent.transform, false);
            var phcRt = priceContainer.AddComponent<RectTransform>();
            phcRt.anchorMin = new Vector2(0.03f, 0.1f);
            phcRt.anchorMax = new Vector2(0.97f, 0.9f);
            phcRt.offsetMin = Vector2.zero;
            phcRt.offsetMax = Vector2.zero;

            var phEntryPrefab = new GameObject("PriceHistoryEntryPrefab");
            phEntryPrefab.SetActive(false);
            var ephRt = phEntryPrefab.AddComponent<RectTransform>();
            ephRt.sizeDelta = new Vector2(0, 50);
            phEntryPrefab.AddComponent<Image>().color = new Color(0.96f, 0.97f, 1f, 1f);

            var finContent = CreateTabContent(contentArea.transform, "FinancialDocContent", false);
            AddInfoRow(finContent.transform, "车主：", "--", "FinOwnerNameText", 0.85f);
            AddInfoRow(finContent.transform, "证件类型：", "--", "FinDocTypeText", 0.75f);
            AddInfoRow(finContent.transform, "贷款：", "无贷款", "FinLoanStatusText", 0.65f);
            AddInfoRow(finContent.transform, "出险记录：", "无", "FinAccidentText", 0.55f);
            AddInfoRow(finContent.transform, "抵押：", "未抵押", "FinMortgageText", 0.45f);
            AddInfoRow(finContent.transform, "备注：", "--", "FinFlagsText", 0.35f);

            var recContent = CreateTabContent(contentArea.transform, "VehicleRecordContent", false);
            AddInfoRow(recContent.transform, "过户次数：", "--", "RecOwnershipCountText", 0.85f);
            AddInfoRow(recContent.transform, "首次上牌：", "--", "RecFirstRegisterText", 0.75f);
            AddInfoRow(recContent.transform, "最近过户：", "--", "RecLastTransferText", 0.65f);
            AddInfoRow(recContent.transform, "保险：", "--", "RecInsuranceText", 0.55f);
            AddInfoRow(recContent.transform, "违章：", "--", "RecViolationsText", 0.45f);
            AddInfoRow(recContent.transform, "", "", "RecTransferCountText", 0.35f);

            var inspContent = CreateTabContent(contentArea.transform, "InspectionReportContent", false);
            AddInfoRow(inspContent.transform, "检测师：", "--", "InspInspectorNameText", 0.9f);
            AddInfoRow(inspContent.transform, "检测日期：", "--", "InspDateText", 0.8f);
            AddInfoRow(inspContent.transform, "综合评分：", "--", "InspOverallScoreText", 0.7f);
            AddInfoRow(inspContent.transform, "重大问题：", "--", "InspMajorIssuesText", 0.6f);
            AddInfoRow(inspContent.transform, "总结：", "--", "InspSummaryText", 0.5f);

            var inspItemsContainer = new GameObject("InspItemsContainer");
            inspItemsContainer.transform.SetParent(inspContent.transform, false);
            var iicRt = inspItemsContainer.AddComponent<RectTransform>();
            iicRt.anchorMin = new Vector2(0.03f, 0.1f);
            iicRt.anchorMax = new Vector2(0.97f, 0.4f);
            iicRt.offsetMin = Vector2.zero;
            iicRt.offsetMax = Vector2.zero;

            var inspItemPrefab = new GameObject("InspItemPrefab");
            inspItemPrefab.SetActive(false);
            inspItemPrefab.AddComponent<RectTransform>().sizeDelta = new Vector2(0, 40);
            inspItemPrefab.AddComponent<Image>().color = new Color(0.98f, 0.94f, 0.94f, 1f);

            var actionBar = CreatePanelSection(panel.transform, "ActionBar", 0, 0, 100, new Color(0.93f, 0.93f, 0.95f, 1f));
            var abRt = actionBar.GetComponent<RectTransform>();
            abRt.anchorMin = new Vector2(0.05f, 0.05f);
            abRt.anchorMax = new Vector2(0.95f, 0.16f);
            abRt.pivot = new Vector2(0.5f, 0);
            abRt.offsetMin = Vector2.zero;
            abRt.offsetMax = Vector2.zero;
            abRt.anchoredPosition = Vector2.zero;

            var approveBtn = RuntimeUIBuilder.AddButton(actionBar.transform, "✓ 批准收购", "ApproveButton", 22);
            var approveRt = approveBtn.GetComponent<RectTransform>();
            approveRt.anchorMin = new Vector2(0, 0.15f);
            approveRt.anchorMax = new Vector2(0.32f, 0.85f);
            approveRt.offsetMin = Vector2.zero;
            approveRt.offsetMax = Vector2.zero;
            approveBtn.GetComponent<Image>().color = new Color(0.2f, 0.72f, 0.38f, 1f);

            var rejectBtn = RuntimeUIBuilder.AddButton(actionBar.transform, "✗ 拒绝收购", "RejectButton", 22);
            var rejectRt = rejectBtn.GetComponent<RectTransform>();
            rejectRt.anchorMin = new Vector2(0.34f, 0.15f);
            rejectRt.anchorMax = new Vector2(0.66f, 0.85f);
            rejectRt.offsetMin = Vector2.zero;
            rejectRt.offsetMax = Vector2.zero;
            rejectBtn.GetComponent<Image>().color = new Color(0.85f, 0.28f, 0.25f, 1f);

            var infoBtn = RuntimeUIBuilder.AddButton(actionBar.transform, "❓ 需补充信息", "NeedMoreInfoButton", 20);
            var infoRt = infoBtn.GetComponent<RectTransform>();
            infoRt.anchorMin = new Vector2(0.68f, 0.15f);
            infoRt.anchorMax = new Vector2(1, 0.85f);
            infoRt.offsetMin = Vector2.zero;
            infoRt.offsetMax = Vector2.zero;
            infoBtn.GetComponent<Image>().color = new Color(0.92f, 0.65f, 0.1f, 1f);

            UIManagerBinder.SetField(script, "levelNameText", levelName);
            UIManagerBinder.SetField(script, "timerText", timer);
            UIManagerBinder.SetField(script, "progressText", progress);
            UIManagerBinder.SetField(script, "consecutiveText", consecutive);
            UIManagerBinder.SetField(script, "errorCountText", errors);
            UIManagerBinder.SetField(script, "timerFillImage", timerFillImg);
            UIManagerBinder.SetField(script, "pauseButton", pauseBtn);
            UIManagerBinder.SetField(script, "priceHistoryTab", tabBtns[0]);
            UIManagerBinder.SetField(script, "financialDocTab", tabBtns[1]);
            UIManagerBinder.SetField(script, "vehicleRecordTab", tabBtns[2]);
            UIManagerBinder.SetField(script, "inspectionReportTab", tabBtns[3]);
            UIManagerBinder.SetField(script, "priceHistoryContent", priceContent);
            UIManagerBinder.SetField(script, "financialDocContent", finContent);
            UIManagerBinder.SetField(script, "vehicleRecordContent", recContent);
            UIManagerBinder.SetField(script, "inspectionReportContent", inspContent);
            UIManagerBinder.SetField(script, "vehicleBrandModelText", brandModel);
            UIManagerBinder.SetField(script, "vehicleYearMileageText", yearMileage);
            UIManagerBinder.SetField(script, "vehiclePlateVinText", plateVin);
            UIManagerBinder.SetField(script, "askedPriceText", askedPrice);
            UIManagerBinder.SetField(script, "marketPriceText", marketPrice);
            UIManagerBinder.SetField(script, "priceHistoryContainer", phcRt);
            UIManagerBinder.SetField(script, "priceHistoryEntryPrefab", phEntryPrefab);
            UIManagerBinder.SetField(script, "finOwnerNameText", FindTextByName(finContent.transform, "FinOwnerNameText"));
            UIManagerBinder.SetField(script, "finDocTypeText", FindTextByName(finContent.transform, "FinDocTypeText"));
            UIManagerBinder.SetField(script, "finLoanStatusText", FindTextByName(finContent.transform, "FinLoanStatusText"));
            UIManagerBinder.SetField(script, "finAccidentText", FindTextByName(finContent.transform, "FinAccidentText"));
            UIManagerBinder.SetField(script, "finMortgageText", FindTextByName(finContent.transform, "FinMortgageText"));
            UIManagerBinder.SetField(script, "finFlagsText", FindTextByName(finContent.transform, "FinFlagsText"));
            UIManagerBinder.SetField(script, "recOwnershipCountText", FindTextByName(recContent.transform, "RecOwnershipCountText"));
            UIManagerBinder.SetField(script, "recTransferCountText", FindTextByName(recContent.transform, "RecTransferCountText"));
            UIManagerBinder.SetField(script, "recFirstRegisterText", FindTextByName(recContent.transform, "RecFirstRegisterText"));
            UIManagerBinder.SetField(script, "recLastTransferText", FindTextByName(recContent.transform, "RecLastTransferText"));
            UIManagerBinder.SetField(script, "recInsuranceText", FindTextByName(recContent.transform, "RecInsuranceText"));
            UIManagerBinder.SetField(script, "recViolationsText", FindTextByName(recContent.transform, "RecViolationsText"));
            UIManagerBinder.SetField(script, "inspInspectorNameText", FindTextByName(inspContent.transform, "InspInspectorNameText"));
            UIManagerBinder.SetField(script, "inspDateText", FindTextByName(inspContent.transform, "InspDateText"));
            UIManagerBinder.SetField(script, "inspOverallScoreText", FindTextByName(inspContent.transform, "InspOverallScoreText"));
            UIManagerBinder.SetField(script, "inspSummaryText", FindTextByName(inspContent.transform, "InspSummaryText"));
            UIManagerBinder.SetField(script, "inspItemsContainer", iicRt);
            UIManagerBinder.SetField(script, "inspItemPrefab", inspItemPrefab);
            UIManagerBinder.SetField(script, "inspMajorIssuesText", FindTextByName(inspContent.transform, "InspMajorIssuesText"));
            UIManagerBinder.SetField(script, "approveButton", approveBtn);
            UIManagerBinder.SetField(script, "rejectButton", rejectBtn);
            UIManagerBinder.SetField(script, "needMoreInfoButton", infoBtn);

            return script;
        }

        private static GameObject CreatePanelSection(Transform parent, string name,
            float yPos, float yAnchor, float height, Color bgColor)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            rt.anchorMin = new Vector2(0, yAnchor);
            rt.anchorMax = new Vector2(1, yAnchor);
            rt.pivot = new Vector2(0.5f, yAnchor);
            rt.anchoredPosition = new Vector2(0, yPos);
            rt.sizeDelta = new Vector2(0, height);
            var img = go.AddComponent<Image>();
            img.color = bgColor;
            return go;
        }

        private static GameObject CreateTabContent(Transform parent, string name, bool active)
        {
            var go = new GameObject(name);
            go.SetActive(active);
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            return go;
        }

        private static void AddInfoRow(Transform parent, string label, string value, string valueName, float yAnchor)
        {
            var row = new GameObject($"{valueName}_Row");
            row.transform.SetParent(parent, false);
            var rt = row.AddComponent<RectTransform>();
            rt.anchorMin = new Vector2(0.05f, yAnchor - 0.06f);
            rt.anchorMax = new Vector2(0.95f, yAnchor + 0.04f);
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;

            var labelGo = new GameObject("Label");
            labelGo.transform.SetParent(row.transform, false);
            var labelText = labelGo.AddComponent<TextMeshProUGUI>();
            labelText.text = label;
            labelText.fontSize = 16;
            labelText.color = new Color(0.5f, 0.5f, 0.55f, 1f);
            var lrt = labelText.rectTransform;
            lrt.anchorMin = new Vector2(0, 0);
            lrt.anchorMax = new Vector2(0.25f, 1);
            lrt.offsetMin = Vector2.zero;
            lrt.offsetMax = Vector2.zero;

            var valueGo = new GameObject(valueName);
            valueGo.transform.SetParent(row.transform, false);
            var valueText = valueGo.AddComponent<TextMeshProUGUI>();
            valueText.text = value;
            valueText.fontSize = 16;
            var vrt = valueText.rectTransform;
            vrt.anchorMin = new Vector2(0.25f, 0);
            vrt.anchorMax = new Vector2(1, 1);
            vrt.offsetMin = Vector2.zero;
            vrt.offsetMax = Vector2.zero;
        }

        private static void SetTextAnchor(TMP_Text text, float xMin, float yMin, float xMax, float yMax)
        {
            var rt = text.rectTransform;
            rt.anchorMin = new Vector2(xMin, yMin);
            rt.anchorMax = new Vector2(xMax, yMax);
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
        }

        private static TMP_Text FindTextByName(Transform parent, string name)
        {
            foreach (Transform child in parent)
            {
                var t = child.GetComponent<TMP_Text>();
                if (t != null && t.gameObject.name == name) return t;
                foreach (Transform grandchild in child)
                {
                    var gt = grandchild.GetComponent<TMP_Text>();
                    if (gt != null && gt.gameObject.name == name) return gt;
                }
            }
            return null;
        }
    }
}
