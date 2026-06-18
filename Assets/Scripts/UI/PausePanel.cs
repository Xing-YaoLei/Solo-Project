using UnityEngine;
using UnityEngine.UI;
using UsedCarGame.Core;

namespace UsedCarGame.UI
{
    public class PausePanel : UIPanelBase
    {
        [SerializeField] private Button resumeButton;
        [SerializeField] private Button settingsButton;
        [SerializeField] private Button retryButton;
        [SerializeField] private Button quitButton;

        public override void Initialize()
        {
            base.Initialize();
            if (resumeButton != null) resumeButton.onClick.AddListener(OnResumeClicked);
            if (settingsButton != null) settingsButton.onClick.AddListener(OnSettingsClicked);
            if (retryButton != null) retryButton.onClick.AddListener(OnRetryClicked);
            if (quitButton != null) quitButton.onClick.AddListener(OnQuitClicked);
        }

        private void OnResumeClicked()
        {
            GameManager.Instance?.ResumeGame();
        }

        private void OnSettingsClicked()
        {
            GameManager.Instance?.OpenSettings();
        }

        private void OnRetryClicked()
        {
            Time.timeScale = 1f;
            GameManager.Instance?.RetryLevel();
        }

        private void OnQuitClicked()
        {
            Time.timeScale = 1f;
            GameManager.Instance?.ReturnToMainMenu();
        }
    }
}
