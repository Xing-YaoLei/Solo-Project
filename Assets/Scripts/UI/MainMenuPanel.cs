using UnityEngine;
using UnityEngine.UI;
using UsedCarGame.Core;

namespace UsedCarGame.UI
{
    public class MainMenuPanel : UIPanelBase
    {
        [SerializeField] private Button startButton;
        [SerializeField] private Button reviewButton;
        [SerializeField] private Button settingsButton;
        [SerializeField] private Button quitButton;

        public override void Initialize()
        {
            base.Initialize();
            if (startButton != null) startButton.onClick.AddListener(OnStartClicked);
            if (reviewButton != null) reviewButton.onClick.AddListener(OnReviewClicked);
            if (settingsButton != null) settingsButton.onClick.AddListener(OnSettingsClicked);
            if (quitButton != null) quitButton.onClick.AddListener(OnQuitClicked);
        }

        private void OnStartClicked()
        {
            GameManager.Instance?.ChangeState(GameManager.GameState.LevelSelect);
        }

        private void OnReviewClicked()
        {
            GameManager.Instance?.OpenReview();
        }

        private void OnSettingsClicked()
        {
            GameManager.Instance?.OpenSettings();
        }

        private void OnQuitClicked()
        {
#if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
#else
            Application.Quit();
#endif
        }
    }
}
