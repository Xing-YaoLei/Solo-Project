using System;
using UnityEngine;

namespace UsedCarGame.Core
{
    [Serializable]
    public class PlayerSettings
    {
        public bool sfxEnabled = true;
        public bool vibrationEnabled = true;
        public float sfxVolume = 1.0f;

        public static PlayerSettings Default()
        {
            return new PlayerSettings
            {
                sfxEnabled = true,
                vibrationEnabled = false,
                sfxVolume = 0.8f
            };
        }
    }

    public class SettingsManager
    {
        private const string SettingsKey = "UsedCarGame_Settings";
        private PlayerSettings _current;

        public PlayerSettings Current => _current;
        public event Action<PlayerSettings> OnSettingsChanged;

        public SettingsManager()
        {
            Load();
        }

        public void Load()
        {
            if (PlayerPrefs.HasKey(SettingsKey))
            {
                try
                {
                    var json = PlayerPrefs.GetString(SettingsKey);
                    _current = JsonUtility.FromJson<PlayerSettings>(json) ?? PlayerSettings.Default();
                }
                catch
                {
                    _current = PlayerSettings.Default();
                }
            }
            else
            {
                _current = PlayerSettings.Default();
            }
        }

        public void Save()
        {
            var json = JsonUtility.ToJson(_current);
            PlayerPrefs.SetString(SettingsKey, json);
            PlayerPrefs.Save();
        }

        public void SetSfxEnabled(bool enabled)
        {
            _current.sfxEnabled = enabled;
            NotifyChanged();
            Save();
        }

        public void SetVibrationEnabled(bool enabled)
        {
            _current.vibrationEnabled = enabled;
            NotifyChanged();
            Save();
        }

        public void SetSfxVolume(float volume)
        {
            _current.sfxVolume = Mathf.Clamp01(volume);
            NotifyChanged();
            Save();
        }

        private void NotifyChanged()
        {
            try
            {
                OnSettingsChanged?.Invoke(_current);
            }
            catch (Exception e)
            {
                Debug.LogError($"[SettingsManager] Change notification error: {e.Message}");
            }
        }
    }
}
