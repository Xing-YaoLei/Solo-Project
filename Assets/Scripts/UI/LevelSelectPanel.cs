using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UsedCarGame.Core;
using UsedCarGame.Data;

namespace UsedCarGame.UI
{
    public class LevelSelectPanel : UIPanelBase
    {
        [SerializeField] private Transform levelCardContainer;
        [SerializeField] private Button backButton;
        [SerializeField] private TMP_Text loadingText;

        private readonly List<GameObject> _spawnedCards = new List<GameObject>();

        public override void Initialize()
        {
            base.Initialize();
            if (backButton != null) backButton.onClick.AddListener(OnBackClicked);
        }

        protected override void OnShow()
        {
            base.OnShow();
            ClearCards();
            StartCoroutine(LoadLevelCards());
        }

        private IEnumerator LoadLevelCards()
        {
            if (loadingText != null) loadingText.gameObject.SetActive(true);

            yield return null;

            var level1 = SampleLevelFactory.CreateLevel_001();
            SpawnLevelCard(level1, "Levels/Level_001", highlight: true);

            var level2 = SampleLevelFactory.CreateLevel_002();
            SpawnLevelCard(level2, "Levels/Level_002", highlight: false);

            if (loadingText != null) loadingText.gameObject.SetActive(false);
        }

        private void SpawnLevelCard(LevelConfig config, string address, bool highlight)
        {
            if (levelCardContainer == null) return;

            var card = new GameObject("LevelCard_" + config.levelId);
            card.transform.SetParent(levelCardContainer, false);

            var rt = card.AddComponent<RectTransform>();
            rt.sizeDelta = new Vector2(340, 200);

            var bg = card.AddComponent<Image>();
            bg.color = highlight ? new Color(0.95f, 0.98f, 1f, 1f) : Color.white;

            var btn = card.AddComponent<Button>();
            var colors = btn.colors;
            colors.normalColor = highlight ? new Color(0.92f, 0.96f, 1f, 1f) : Color.white;
            colors.highlightedColor = new Color(0.85f, 0.92f, 1f, 1f);
            colors.pressedColor = new Color(0.75f, 0.85f, 1f, 1f);
            colors.selectedColor = colors.highlightedColor;
            btn.colors = colors;
            btn.interactable = true;
            btn.onClick.AddListener(() => OnLevelSelected(address));

            if (highlight)
            {
                var outline = card.AddComponent<Outline>();
                outline.effectColor = new Color(0.2f, 0.5f, 0.95f, 0.8f);
                outline.effectDistance = new Vector2(2, -2);
            }

            var titleGo = new GameObject("Title");
            titleGo.transform.SetParent(card.transform, false);
            var titleText = titleGo.AddComponent<TextMeshProUGUI>();
            titleText.text = (highlight ? "✓ " : "") + config.levelName;
            titleText.fontSize = 24;
            titleText.fontStyle = FontStyles.Bold;
            titleText.color = new Color(0.12f, 0.15f, 0.2f, 1f);
            titleText.raycastTarget = false;
            var tRt = titleText.rectTransform;
            tRt.anchorMin = new Vector2(0.06f, 0.65f);
            tRt.anchorMax = new Vector2(0.94f, 0.92f);
            tRt.offsetMin = Vector2.zero;
            tRt.offsetMax = Vector2.zero;

            var descGo = new GameObject("Desc");
            descGo.transform.SetParent(card.transform, false);
            var descText = descGo.AddComponent<TextMeshProUGUI>();
            descText.text = config.description;
            descText.fontSize = 14;
            descText.color = new Color(0.38f, 0.4f, 0.45f, 1f);
            descText.alignment = TextAlignmentOptions.TopLeft;
            descText.enableWordWrapping = true;
            descText.raycastTarget = false;
            var dRt = descText.rectTransform;
            dRt.anchorMin = new Vector2(0.06f, 0.28f);
            dRt.anchorMax = new Vector2(0.94f, 0.6f);
            dRt.offsetMin = Vector2.zero;
            dRt.offsetMax = Vector2.zero;

            var infoGo = new GameObject("Info");
            infoGo.transform.SetParent(card.transform, false);
            var infoText = infoGo.AddComponent<TextMeshProUGUI>();
            infoText.text = $"★{config.difficulty}   ·   {config.questionsPerSession} 题   ·   {config.totalTimeSeconds:F0} 秒";
            infoText.fontSize = 14;
            infoText.color = new Color(0.5f, 0.52f, 0.58f, 1f);
            infoText.alignment = TextAlignmentOptions.Left;
            infoText.raycastTarget = false;
            var iRt = infoText.rectTransform;
            iRt.anchorMin = new Vector2(0.06f, 0.06f);
            iRt.anchorMax = new Vector2(0.94f, 0.24f);
            iRt.offsetMin = Vector2.zero;
            iRt.offsetMax = Vector2.zero;

            var hintGo = new GameObject("Hint");
            hintGo.transform.SetParent(card.transform, false);
            var hintText = hintGo.AddComponent<TextMeshProUGUI>();
            hintText.text = highlight ? "▶ 点击开始" : "";
            hintText.fontSize = 13;
            hintText.color = new Color(0.2f, 0.5f, 0.95f, 0.9f);
            hintText.alignment = TextAlignmentOptions.Right;
            hintText.raycastTarget = false;
            var hRt = hintText.rectTransform;
            hRt.anchorMin = new Vector2(0.5f, 0.06f);
            hRt.anchorMax = new Vector2(0.94f, 0.24f);
            hRt.offsetMin = Vector2.zero;
            hRt.offsetMax = Vector2.zero;

            _spawnedCards.Add(card);
        }

        private void OnLevelSelected(string levelAddress)
        {
            Debug.Log($"[LevelSelect] 选中关卡：{levelAddress}");
            GameManager.Instance?.StartLevel(levelAddress);
        }

        private void OnBackClicked()
        {
            GameManager.Instance?.ReturnToMainMenu();
        }

        private void ClearCards()
        {
            foreach (var card in _spawnedCards)
            {
                if (card != null) Destroy(card);
            }
            _spawnedCards.Clear();
        }
    }
}
