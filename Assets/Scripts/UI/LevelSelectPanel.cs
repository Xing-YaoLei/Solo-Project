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
        [SerializeField] private GameObject levelCardPrefab;
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

            var provider = ServiceLocator.Get<LevelDataProvider>();

            var sampleLevel = SampleLevelFactory.CreateLevel_001();
            yield return null;
            SpawnLevelCard(sampleLevel, "Levels/Level_001");

            var sampleLevel2 = SampleLevelFactory.CreateLevel_002();
            SpawnLevelCard(sampleLevel2, "Levels/Level_002");

            if (loadingText != null) loadingText.gameObject.SetActive(false);
        }

        private void SpawnLevelCard(LevelConfig config, string address)
        {
            if (levelCardContainer == null) return;

            GameObject card;
            if (levelCardPrefab != null)
            {
                card = Instantiate(levelCardPrefab, levelCardContainer);
                var rt = card.GetComponent<RectTransform>();
                if (rt == null) rt = card.AddComponent<RectTransform>();
                rt.sizeDelta = new Vector2(320, 180);
            }
            else
            {
                card = new GameObject("LevelCard");
                card.transform.SetParent(levelCardContainer, false);
                var rt = card.AddComponent<RectTransform>();
                rt.sizeDelta = new Vector2(320, 180);
                var bg = card.AddComponent<Image>();
                bg.color = Color.white;

                var btn = card.AddComponent<Button>();
                var colors = btn.colors;
                colors.normalColor = Color.white;
                colors.highlightedColor = new Color(0.95f, 0.97f, 1f, 1f);
                colors.pressedColor = new Color(0.9f, 0.93f, 0.98f, 1f);
                btn.colors = colors;
                btn.onClick.AddListener(() => OnLevelSelected(address));
            }

            _spawnedCards.Add(card);

            var nameTexts = card.GetComponentsInChildren<TMP_Text>();
            if (nameTexts.Length == 0)
            {
                var titleGo = new GameObject("Title");
                titleGo.transform.SetParent(card.transform, false);
                var titleText = titleGo.AddComponent<TextMeshProUGUI>();
                titleText.text = config.levelName;
                titleText.fontSize = 22;
                titleText.fontStyle = FontStyles.Bold;
                titleText.color = new Color(0.15f, 0.15f, 0.2f, 1f);
                var tRt = titleText.rectTransform;
                tRt.anchorMin = new Vector2(0.05f, 0.6f);
                tRt.anchorMax = new Vector2(0.95f, 0.9f);
                tRt.offsetMin = Vector2.zero;
                tRt.offsetMax = Vector2.zero;

                var descGo = new GameObject("Desc");
                descGo.transform.SetParent(card.transform, false);
                var descText = descGo.AddComponent<TextMeshProUGUI>();
                descText.text = config.description;
                descText.fontSize = 14;
                descText.color = new Color(0.4f, 0.4f, 0.45f, 1f);
                descText.alignment = TextAlignmentOptions.TopLeft;
                descText.enableWordWrapping = true;
                var dRt = descText.rectTransform;
                dRt.anchorMin = new Vector2(0.05f, 0.2f);
                dRt.anchorMax = new Vector2(0.95f, 0.55f);
                dRt.offsetMin = Vector2.zero;
                dRt.offsetMax = Vector2.zero;

                var infoGo = new GameObject("Info");
                infoGo.transform.SetParent(card.transform, false);
                var infoText = infoGo.AddComponent<TextMeshProUGUI>();
                infoText.text = $"★{config.difficulty}  |  {config.questionsPerSession}题  |  {config.totalTimeSeconds:F0}秒";
                infoText.fontSize = 13;
                infoText.color = new Color(0.5f, 0.5f, 0.55f, 1f);
                infoText.alignment = TextAlignmentOptions.Left;
                var iRt = infoText.rectTransform;
                iRt.anchorMin = new Vector2(0.05f, 0.05f);
                iRt.anchorMax = new Vector2(0.95f, 0.18f);
                iRt.offsetMin = Vector2.zero;
                iRt.offsetMax = Vector2.zero;

                var btn = card.GetComponent<Button>();
                if (btn != null)
                {
                    btn.onClick.AddListener(() => OnLevelSelected(address));
                }
            }
            else
            {
                foreach (var t in nameTexts)
                {
                    if (t.name.Contains("Name") || t.name.Contains("Title"))
                    {
                        t.text = config.levelName;
                    }
                    else if (t.name.Contains("Desc"))
                    {
                        t.text = config.description;
                    }
                    else if (t.name.Contains("Difficulty"))
                    {
                        t.text = $"难度：{new string('★', config.difficulty)}";
                    }
                    else if (t.name.Contains("Time"))
                    {
                        t.text = $"时长：{config.totalTimeSeconds:F0}秒";
                    }
                    else if (t.name.Contains("Count"))
                    {
                        t.text = $"题数：{config.questionsPerSession}";
                    }
                }

                var buttons = card.GetComponentsInChildren<Button>();
                foreach (var btn in buttons)
                {
                    if (btn.name.Contains("Start") || btn.name == card.name)
                    {
                        btn.onClick.AddListener(() => OnLevelSelected(address));
                    }
                }
            }
        }

        private void OnLevelSelected(string levelAddress)
        {
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
