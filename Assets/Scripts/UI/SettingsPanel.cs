using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UsedCarGame.Core;

namespace UsedCarGame.UI
{
    public class SettingsPanel : UIPanelBase
    {
        [Header("Audio")]
        [SerializeField] private Toggle sfxToggle;
        [SerializeField] private Slider sfxVolumeSlider;
        [SerializeField] private TMP_Text sfxVolumeValueText;

        [Header("Vibration")]
        [SerializeField] private Toggle vibrationToggle;

        [Header("Buttons")]
        [SerializeField] private Button backButton;
        [SerializeField] private Button resetDefaultsButton;

        private SettingsManager _settings;

        public override void Initialize()
        {
            base.Initialize();

            _settings = ServiceLocator.Get<SettingsManager>();

            if (sfxToggle != null) sfxToggle.onValueChanged.AddListener(OnSfxToggled);
            if (sfxVolumeSlider != null) sfxVolumeSlider.onValueChanged.AddListener(OnSfxVolumeChanged);
            if (vibrationToggle != null) vibrationToggle.onValueChanged.AddListener(OnVibrationToggled);
            if (backButton != null) backButton.onClick.AddListener(OnBackClicked);
            if (resetDefaultsButton != null) resetDefaultsButton.onClick.AddListener(OnResetDefaultsClicked);
        }

        protected override void OnShow()
        {
            base.OnShow();
            RefreshUI();
        }

        private void RefreshUI()
        {
            if (_settings == null) return;

            var s = _settings.Current;

            if (sfxToggle != null) sfxToggle.isOn = s.sfxEnabled;
            if (sfxVolumeSlider != null) sfxVolumeSlider.value = s.sfxVolume;
            if (sfxVolumeValueText != null) sfxVolumeValueText.text = $"{(int)(s.sfxVolume * 100)}%";

            if (vibrationToggle != null) vibrationToggle.isOn = s.vibrationEnabled;
        }

        private void OnSfxToggled(bool value)
        {
            _settings?.SetSfxEnabled(value);
        }

        private void OnSfxVolumeChanged(float value)
        {
            _settings?.SetSfxVolume(value);
            if (sfxVolumeValueText != null) sfxVolumeValueText.text = $"{(int)(value * 100)}%";
        }

        private void OnVibrationToggled(bool value)
        {
            _settings?.SetVibrationEnabled(value);
        }

        private void OnResetDefaultsClicked()
        {
            var defaults = PlayerSettings.Default();
            _settings?.SetSfxEnabled(defaults.sfxEnabled);
            _settings?.SetVibrationEnabled(defaults.vibrationEnabled);
            _settings?.SetSfxVolume(defaults.sfxVolume);
            RefreshUI();
        }

        private void OnBackClicked()
        {
            if (GameManager.Instance != null)
            {
                if (GameManager.Instance.CurrentState == GameManager.GameState.Paused)
                {
                    GameManager.Instance.ResumeGame();
                }
                else
                {
                    GameManager.Instance.ReturnToMainMenu();
                }
            }
        }
    }
}
