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
            if (levelCardPrefab == null || levelCardContainer == null) return;

            var card = Instantiate(levelCardPrefab, levelCardContainer);
            _spawnedCards.Add(card);

            var nameTexts = card.GetComponentsInChildren<TMP_Text>();
            var buttons = card.GetComponentsInChildren<Button>();

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

            foreach (var btn in buttons)
            {
                if (btn.name.Contains("Start") || btn.name == card.name)
                {
                    btn.onClick.AddListener(() => OnLevelSelected(address));
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
