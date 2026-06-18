using UnityEngine;

namespace UsedCarGame.Core
{
    public class AudioService
    {
        private AudioSource _sfxSource;
        private SettingsManager _settings;

        public AudioService()
        {
            _settings = ServiceLocator.Get<SettingsManager>();
            _settings.OnSettingsChanged += OnSettingsChanged;
        }

        public void EnsureAudioSource()
        {
            if (_sfxSource == null)
            {
                var go = new GameObject("[AudioService_SFX]");
                Object.DontDestroyOnLoad(go);
                _sfxSource = go.AddComponent<AudioSource>();
                _sfxSource.playOnAwake = false;
                _sfxSource.loop = false;
                ApplySettings();
            }
        }

        public void PlaySfx(AudioClip clip, float volumeScale = 1.0f)
        {
            if (!_settings.Current.sfxEnabled || clip == null) return;

            EnsureAudioSource();
            var finalVolume = _settings.Current.sfxVolume * volumeScale;
            _sfxSource.PlayOneShot(clip, finalVolume);
        }

        private void OnSettingsChanged(PlayerSettings settings)
        {
            ApplySettings();
        }

        private void ApplySettings()
        {
            if (_sfxSource != null)
            {
                _sfxSource.volume = _settings.Current.sfxVolume;
                _sfxSource.mute = !_settings.Current.sfxEnabled;
            }
        }
    }
}
