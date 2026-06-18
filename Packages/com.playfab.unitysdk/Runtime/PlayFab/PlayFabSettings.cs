using System;

namespace PlayFab
{
    public class PlayFabSettings
    {
        public static PlayFabSettings staticSettings = new PlayFabSettings();

        public string TitleId;
        public string DeveloperSecretKey;
        public string ProductionEnvironmentUrl = ".playfabapi.com";
        public PlayFabAuthenticationContext IsLoggedIn;

        public static string BuildIdentifier = "StubSDK_0.0.1";
        public static Version Version = new Version(0, 0, 1);
    }
}
