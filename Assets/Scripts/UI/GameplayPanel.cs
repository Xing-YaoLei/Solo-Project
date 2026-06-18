using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UsedCarGame.Core;
using UsedCarGame.Data;

namespace UsedCarGame.UI
{
    public class GameplayPanel : UIPanelBase
    {
        [Header("Top Bar")]
        [SerializeField] private TMP_Text levelNameText;
        [SerializeField] private TMP_Text timerText;
        [SerializeField] private TMP_Text progressText;
        [SerializeField] private TMP_Text consecutiveText;
        [SerializeField] private TMP_Text errorCountText;
        [SerializeField] private Image timerFillImage;
        [SerializeField] private Button pauseButton;

        [Header("Tabs")]
        [SerializeField] private Button priceHistoryTab;
        [SerializeField] private Button financialDocTab;
        [SerializeField] private Button vehicleRecordTab;
        [SerializeField] private Button inspectionReportTab;

        [Header("Content")]
        [SerializeField] private GameObject priceHistoryContent;
        [SerializeField] private GameObject financialDocContent;
        [SerializeField] private GameObject vehicleRecordContent;
        [SerializeField] private GameObject inspectionReportContent;

        [Header("Vehicle Info")]
        [SerializeField] private TMP_Text vehicleBrandModelText;
        [SerializeField] private TMP_Text vehicleYearMileageText;
        [SerializeField] private TMP_Text vehiclePlateVinText;
        [SerializeField] private TMP_Text askedPriceText;
        [SerializeField] private TMP_Text marketPriceText;

        [Header("Price History")]
        [SerializeField] private Transform priceHistoryContainer;
        [SerializeField] private GameObject priceHistoryEntryPrefab;

        [Header("Financial Document")]
        [SerializeField] private TMP_Text finOwnerNameText;
        [SerializeField] private TMP_Text finDocTypeText;
        [SerializeField] private TMP_Text finLoanStatusText;
        [SerializeField] private TMP_Text finAccidentText;
        [SerializeField] private TMP_Text finMortgageText;
        [SerializeField] private TMP_Text finFlagsText;

        [Header("Vehicle Record")]
        [SerializeField] private TMP_Text recOwnershipCountText;
        [SerializeField] private TMP_Text recTransferCountText;
        [SerializeField] private TMP_Text recFirstRegisterText;
        [SerializeField] private TMP_Text recLastTransferText;
        [SerializeField] private TMP_Text recInsuranceText;
        [SerializeField] private TMP_Text recViolationsText;

        [Header("Inspection Report")]
        [SerializeField] private TMP_Text inspInspectorNameText;
        [SerializeField] private TMP_Text inspDateText;
        [SerializeField] private TMP_Text inspOverallScoreText;
        [SerializeField] private TMP_Text inspSummaryText;
        [SerializeField] private Transform inspItemsContainer;
        [SerializeField] private GameObject inspItemPrefab;
        [SerializeField] private TMP_Text inspMajorIssuesText;

        [Header("Action Buttons")]
        [SerializeField] private Button approveButton;
        [SerializeField] private Button rejectButton;
        [SerializeField] private Button needMoreInfoButton;

        private GameSession _session;
        private QuestionData _currentQuestion;
        private float _totalTime;

        public override void Initialize()
        {
            base.Initialize();

            if (pauseButton != null) pauseButton.onClick.AddListener(OnPauseClicked);
            if (approveButton != null) approveButton.onClick.AddListener(() => OnDecisionMade(DecisionAction.Approve));
            if (rejectButton != null) rejectButton.onClick.AddListener(() => OnDecisionMade(DecisionAction.Reject));
            if (needMoreInfoButton != null) needMoreInfoButton.onClick.AddListener(() => OnDecisionMade(DecisionAction.NeedMoreInfo));

            if (priceHistoryTab != null) priceHistoryTab.onClick.AddListener(() => SwitchTab(0));
            if (financialDocTab != null) financialDocTab.onClick.AddListener(() => SwitchTab(1));
            if (vehicleRecordTab != null) vehicleRecordTab.onClick.AddListener(() => SwitchTab(2));
            if (inspectionReportTab != null) inspectionReportTab.onClick.AddListener(() => SwitchTab(3));
        }

        protected override void OnShow()
        {
            base.OnShow();

            if (ServiceLocator.TryGet(out _session))
            {
                _session.OnQuestionChanged += HandleQuestionChanged;
                _session.OnTimeUpdated += HandleTimeUpdated;
                _session.OnSessionCompleted += HandleSessionCompleted;
            }

            SwitchTab(0);
        }

        protected override void OnHide()
        {
            base.OnHide();

            if (_session != null)
            {
                _session.OnQuestionChanged -= HandleQuestionChanged;
                _session.OnTimeUpdated -= HandleTimeUpdated;
                _session.OnSessionCompleted -= HandleSessionCompleted;
            }
        }

        private void HandleQuestionChanged(QuestionData question, int current, int total)
        {
            _currentQuestion = question;
            _totalTime = _session.CurrentLevel.totalTimeSeconds;

            if (levelNameText != null) levelNameText.text = _session.CurrentLevel.levelName;
            if (progressText != null) progressText.text = $"{current} / {total}";

            UpdateStatsDisplay();
            DisplayQuestion(question);
            SwitchTab(0);
        }

        private void HandleTimeUpdated(float timeRemaining)
        {
            if (timerText != null)
            {
                var minutes = Mathf.FloorToInt(timeRemaining / 60f);
                var seconds = Mathf.FloorToInt(timeRemaining % 60f);
                timerText.text = $"{minutes:00}:{seconds:00}";

                var warningThreshold = _session.CurrentLevel.warningThresholdSeconds;
                timerText.color = timeRemaining <= warningThreshold ? Color.red : new Color(0.15f, 0.15f, 0.15f);
            }

            if (timerFillImage != null && _totalTime > 0)
            {
                timerFillImage.fillAmount = Mathf.Clamp01(timeRemaining / _totalTime);
            }
        }

        private void HandleSessionCompleted(SessionResult result)
        {
            GameManager.Instance?.CompleteCurrentLevel();
        }

        private void UpdateStatsDisplay()
        {
            var result = _session.CurrentResult;
            int consecutive = 0;
            int errors = 0;

            if (result != null)
            {
                foreach (var qr in result.questionResults)
                {
                    if (qr.isCorrect) consecutive++;
                    else { consecutive = 0; errors++; }
                }
            }

            if (consecutiveText != null)
            {
                consecutiveText.text = $"连击：{consecutive}";
                consecutiveText.color = consecutive >= 3 ? new Color(0.9f, 0.5f, 0.1f) : new Color(0.15f, 0.15f, 0.15f);
            }
            if (errorCountText != null) errorCountText.text = $"错误：{errors}";
        }

        private void DisplayQuestion(QuestionData q)
        {
            if (q.vehicle != null)
            {
                if (vehicleBrandModelText != null)
                    vehicleBrandModelText.text = $"{q.vehicle.brand} {q.vehicle.model}";
                if (vehicleYearMileageText != null)
                    vehicleYearMileageText.text = $"{q.vehicle.year}年 | {q.vehicle.mileage:N0}公里 | {q.vehicle.color}";
                if (vehiclePlateVinText != null)
                    vehiclePlateVinText.text = $"{q.vehicle.plateNumber} | VIN: {q.vehicle.vin}";
            }

            if (askedPriceText != null)
                askedPriceText.text = $"卖家报价：¥{q.askedPrice:N0}";
            if (marketPriceText != null)
                marketPriceText.text = $"市场参考价：¥{q.estimatedMarketPrice:N0}";

            DisplayPriceHistory(q.priceHistory);
            DisplayFinancialDoc(q.financialDoc);
            DisplayVehicleRecord(q.vehicleRecord);
            DisplayInspectionReport(q.inspectionReport);
        }

        private void DisplayPriceHistory(System.Collections.Generic.List<PriceHistoryEntry> list)
        {
            if (priceHistoryContainer == null) return;

            foreach (Transform child in priceHistoryContainer)
            {
                Destroy(child.gameObject);
            }

            if (list == null) return;

            foreach (var entry in list)
            {
                if (priceHistoryEntryPrefab != null)
                {
                    var go = Instantiate(priceHistoryEntryPrefab, priceHistoryContainer);
                    var texts = go.GetComponentsInChildren<TMP_Text>();
                    foreach (var t in texts)
                    {
                        if (t.name.Contains("Date")) t.text = entry.date.ToString("yyyy/MM");
                        else if (t.name.Contains("Price")) t.text = $"¥{entry.price:N0}";
                        else if (t.name.Contains("Source")) t.text = $"{entry.source} ({entry.region})";
                    }
                }
            }
        }

        private void DisplayFinancialDoc(FinancialDocument doc)
        {
            if (doc == null) return;

            if (finOwnerNameText != null) finOwnerNameText.text = $"车主：{doc.ownerName}";
            if (finDocTypeText != null) finDocTypeText.text = $"证件类型：{doc.documentType}";
            if (finLoanStatusText != null)
                finLoanStatusText.text = doc.hasLoan ? $"有贷款：余额 ¥{doc.loanBalance:N0}" : "无贷款";
            if (finAccidentText != null)
                finAccidentText.text = doc.hasAccidentRecord ? $"出险记录：{doc.accidentCount}次" : "无出险记录";
            if (finMortgageText != null)
                finMortgageText.text = doc.isMortgaged ? "已抵押" : "未抵押";
            if (finFlagsText != null)
                finFlagsText.text = doc.flags != null && doc.flags.Count > 0 ? $"备注：{string.Join("、", doc.flags)}" : "无特殊备注";
        }

        private void DisplayVehicleRecord(VehicleRecord rec)
        {
            if (rec == null) return;

            if (recOwnershipCountText != null) recOwnershipCountText.text = $"过户次数：{rec.transferCount}次 (共{rec.ownershipCount}任车主)";
            if (recFirstRegisterText != null) recFirstRegisterText.text = $"首次上牌：{rec.firstRegisterDate:yyyy/MM/dd}";
            if (recLastTransferText != null) recLastTransferText.text = $"最近过户：{rec.lastTransferDate:yyyy/MM/dd}";
            if (recInsuranceText != null)
                recInsuranceText.text = rec.hasInsurance ? $"保险到期：{rec.insuranceExpiry:yyyy/MM/dd}" : "无有效保险";
            if (recViolationsText != null)
                recViolationsText.text = rec.violationRecords != null && rec.violationRecords.Count > 0
                    ? $"违章：{string.Join("、", rec.violationRecords)}"
                    : "无未处理违章";
        }

        private void DisplayInspectionReport(InspectionReport report)
        {
            if (report == null) return;

            if (inspInspectorNameText != null) inspInspectorNameText.text = $"检测师：{report.inspectorName}";
            if (inspDateText != null) inspDateText.text = $"检测日期：{report.inspectionDate:yyyy/MM/dd}";
            if (inspOverallScoreText != null)
            {
                inspOverallScoreText.text = $"综合评分：{report.overallScore:F1}";
                inspOverallScoreText.color = report.overallScore >= 85f ? new Color(0.1f, 0.6f, 0.1f)
                    : report.overallScore >= 70f ? new Color(0.9f, 0.6f, 0.1f)
                    : new Color(0.8f, 0.2f, 0.2f);
            }
            if (inspSummaryText != null) inspSummaryText.text = report.summary;
            if (inspMajorIssuesText != null)
                inspMajorIssuesText.text = report.majorIssues != null && report.majorIssues.Count > 0
                    ? $"⚠ 重大问题：{string.Join("、", report.majorIssues)}"
                    : "无重大问题";

            if (inspItemsContainer != null)
            {
                foreach (Transform child in inspItemsContainer)
                {
                    Destroy(child.gameObject);
                }

                if (report.items != null)
                {
                    foreach (var item in report.items)
                    {
                        if (inspItemPrefab != null)
                        {
                            var go = Instantiate(inspItemPrefab, inspItemsContainer);
                            var texts = go.GetComponentsInChildren<TMP_Text>();
                            foreach (var t in texts)
                            {
                                if (t.name.Contains("Category")) t.text = item.category;
                                else if (t.name.Contains("Item")) t.text = item.itemName;
                                else if (t.name.Contains("Condition"))
                                {
                                    t.text = item.condition;
                                    t.color = item.condition.Contains("严重") || item.condition.Contains("更换") ? new Color(0.8f, 0.2f, 0.2f) : new Color(0.15f, 0.15f, 0.15f);
                                }
                                else if (t.name.Contains("Cost") && item.estimatedRepairCost > 0)
                                    t.text = $"预估维修：¥{item.estimatedRepairCost:N0}";
                            }
                        }
                    }
                }
            }
        }

        private void SwitchTab(int index)
        {
            if (priceHistoryContent != null) priceHistoryContent.SetActive(index == 0);
            if (financialDocContent != null) financialDocContent.SetActive(index == 1);
            if (vehicleRecordContent != null) vehicleRecordContent.SetActive(index == 2);
            if (inspectionReportContent != null) inspectionReportContent.SetActive(index == 3);

            UpdateTabVisual(index);
        }

        private void UpdateTabVisual(int selected)
        {
            void SetTabState(Button btn, bool selected)
            {
                if (btn == null) return;
                var colors = btn.colors;
                colors.normalColor = selected ? new Color(0.95f, 0.95f, 1f) : new Color(0.85f, 0.85f, 0.85f);
                btn.colors = colors;
            }

            SetTabState(priceHistoryTab, selected == 0);
            SetTabState(financialDocTab, selected == 1);
            SetTabState(vehicleRecordTab, selected == 2);
            SetTabState(inspectionReportTab, selected == 3);
        }

        private void OnDecisionMade(DecisionAction action)
        {
            if (_session == null || !_session.IsRunning) return;
            _session.SubmitAnswer(action);
            UpdateStatsDisplay();
        }

        private void OnPauseClicked()
        {
            GameManager.Instance?.PauseGame();
        }
    }
}
