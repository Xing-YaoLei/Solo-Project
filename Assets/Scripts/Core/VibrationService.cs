using UnityEngine;

namespace UsedCarGame.Core
{
    public class VibrationService
    {
        private SettingsManager _settings;

        public VibrationService()
        {
            _settings = ServiceLocator.Get<SettingsManager>();
        }

        public void Vibrate(float durationMs = 50f)
        {
            if (!_settings.Current.vibrationEnabled) return;

#if UNITY_ANDROID || UNITY_IOS
            try
            {
                Handheld.Vibrate();
            }
            catch (System.Exception e)
            {
                Debug.LogWarning($"[VibrationService] Vibrate failed: {e.Message}");
            }
#endif
        }

        public void VibrateShort() => Vibrate(20f);
        public void VibrateMedium() => Vibrate(50f);
        public void VibrateLong() => Vibrate(150f);
    }
}
