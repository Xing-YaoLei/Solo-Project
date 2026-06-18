using System;
using System.Collections.Generic;
using UnityEngine;
using UsedCarGame.Core;

namespace UsedCarGame.UI
{
    public class UIManager : MonoBehaviour
    {
        public static UIManager Instance { get; private set; }

        [Header("Panels")]
        [SerializeField] private MainMenuPanel mainMenuPanel;
        [SerializeField] private LevelSelectPanel levelSelectPanel;
        [SerializeField] private GameplayPanel gameplayPanel;
        [SerializeField] private SettlementPanel settlementPanel;
        [SerializeField] private ReviewPanel reviewPanel;
        [SerializeField] private SettingsPanel settingsPanel;
        [SerializeField] private PausePanel pausePanel;

        private readonly Dictionary<GameManager.GameState, UIPanelBase> _panelMap =
            new Dictionary<GameManager.GameState, UIPanelBase>();

        private bool _eventRegistered;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Start()
        {
            EnsureEventRegistered();
            RefreshPanelRegistry();
        }

        public void SetPanels(
            MainMenuPanel mainMenu,
            LevelSelectPanel levelSelect,
            GameplayPanel gameplay,
            SettlementPanel settlement,
            ReviewPanel review,
            SettingsPanel settings,
            PausePanel pause)
        {
            mainMenuPanel = mainMenu;
            levelSelectPanel = levelSelect;
            gameplayPanel = gameplay;
            settlementPanel = settlement;
            reviewPanel = review;
            settingsPanel = settings;
            pausePanel = pause;

            EnsureEventRegistered();
            RefreshPanelRegistry();

            if (GameManager.Instance != null)
            {
                HandleGameStateChanged(GameManager.GameState.Boot, GameManager.Instance.CurrentState);
            }
        }

        private void RefreshPanelRegistry()
        {
            foreach (var kvp in _panelMap)
            {
                kvp.Value?.Hide();
            }

            _panelMap.Clear();

            if (mainMenuPanel != null) _panelMap[GameManager.GameState.MainMenu] = mainMenuPanel;
            if (levelSelectPanel != null) _panelMap[GameManager.GameState.LevelSelect] = levelSelectPanel;
            if (gameplayPanel != null) _panelMap[GameManager.GameState.Playing] = gameplayPanel;
            if (settlementPanel != null) _panelMap[GameManager.GameState.Settlement] = settlementPanel;
            if (reviewPanel != null) _panelMap[GameManager.GameState.Review] = reviewPanel;
            if (settingsPanel != null) _panelMap[GameManager.GameState.Settings] = settingsPanel;
            if (pausePanel != null) _panelMap[GameManager.GameState.Paused] = pausePanel;
        }

        private void EnsureEventRegistered()
        {
            if (_eventRegistered) return;
            if (GameManager.Instance == null) return;

            GameManager.Instance.OnStateChanged += HandleGameStateChanged;
            _eventRegistered = true;
        }

        private void HandleGameStateChanged(GameManager.GameState oldState, GameManager.GameState newState)
        {
            if (oldState == GameManager.GameState.Paused)
            {
                if (_panelMap.TryGetValue(GameManager.GameState.Paused, out var pauseP))
                {
                    pauseP?.Hide();
                }
                if (_panelMap.TryGetValue(GameManager.GameState.Playing, out var resumeP))
                {
                    resumeP?.Show();
                }
                return;
            }

            if (newState == GameManager.GameState.Paused)
            {
                if (_panelMap.TryGetValue(GameManager.GameState.Paused, out var pauseP))
                {
                    pauseP?.Show();
                }
                return;
            }

            foreach (var kvp in _panelMap)
            {
                if (kvp.Key == newState)
                {
                    kvp.Value?.Show();
                }
                else if (kvp.Key != GameManager.GameState.Paused)
                {
                    kvp.Value?.Hide();
                }
            }
        }

        private void OnDestroy()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnStateChanged -= HandleGameStateChanged;
            }
        }
    }
}
