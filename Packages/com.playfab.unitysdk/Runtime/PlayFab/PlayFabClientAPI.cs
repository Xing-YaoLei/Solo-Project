using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace PlayFab
{
    public static class PlayFabClientAPI
    {
        private static PlayFabAuthenticationContext _authenticationContext = new PlayFabAuthenticationContext();

        public static PlayFabAuthenticationContext IsLoggedIn
        {
            get { return _authenticationContext; }
        }

        public static string PlayFabId
        {
            get { return _authenticationContext?.PlayFabId; }
        }

        public static string SessionTicket
        {
            get { return _authenticationContext?.SessionTicket; }
        }

        public static void LoginWithCustomID(
            ClientModels.LoginWithCustomIDRequest request,
            Action<ClientModels.LoginResult> onSuccess,
            Action<PlayFabError> onError,
            object customData = null,
            Dictionary<string, string> extraHeaders = null)
        {
            if (request == null)
            {
                onError?.Invoke(new PlayFabError(PlayFabErrorCode.InvalidParams, "Request is null"));
                return;
            }

            if (string.IsNullOrEmpty(request.CustomId))
            {
                onError?.Invoke(new PlayFabError(PlayFabErrorCode.InvalidParams, "CustomId is required"));
                return;
            }

            var titleId = request.TitleId ?? PlayFabSettings.staticSettings.TitleId;
            if (string.IsNullOrEmpty(titleId))
            {
                onError?.Invoke(new PlayFabError(PlayFabErrorCode.InvalidTitleId, "TitleId is not set"));
                return;
            }

            var stubPlayFabId = "STUB_" + request.CustomId.GetHashCode().ToString("X8");
            _authenticationContext.PlayFabId = stubPlayFabId;
            _authenticationContext.SessionTicket = "STUB_TICKET_" + Guid.NewGuid().ToString("N");
            _authenticationContext.EntityId = "STUB_ENTITY_" + stubPlayFabId;
            _authenticationContext.EntityType = "title_player_account";
            PlayFabSettings.staticSettings.IsLoggedIn = _authenticationContext;

            var result = new ClientModels.LoginResult
            {
                PlayFabId = stubPlayFabId,
                SessionTicket = _authenticationContext.SessionTicket,
                EntityId = _authenticationContext.EntityId,
                EntityType = _authenticationContext.EntityType,
                NewlyCreated = request.CreateAccount ?? false,
                LastLoginTime = DateTime.UtcNow,
                EntityToken = new ClientModels.EntityTokenResponse
                {
                    EntityId = _authenticationContext.EntityId,
                    EntityType = _authenticationContext.EntityType,
                    EntityToken = "STUB_ENTITY_TOKEN_" + Guid.NewGuid().ToString("N"),
                    TokenExpiration = DateTime.UtcNow.AddHours(24)
                },
                SettingsForUser = new Dictionary<string, string>()
            };

            onSuccess?.Invoke(result);
        }

        public static void ExecuteCloudScript(
            ClientModels.ExecuteCloudScriptRequest request,
            Action<ClientModels.ExecuteCloudScriptResult> onSuccess,
            Action<PlayFabError> onError,
            object customData = null,
            Dictionary<string, string> extraHeaders = null)
        {
            if (request == null)
            {
                onError?.Invoke(new PlayFabError(PlayFabErrorCode.InvalidParams, "Request is null"));
                return;
            }

            if (string.IsNullOrEmpty(PlayFabId))
            {
                onError?.Invoke(new PlayFabError(PlayFabErrorCode.NotAuthenticated, "Not logged in"));
                return;
            }

            if (string.IsNullOrEmpty(request.FunctionName))
            {
                onError?.Invoke(new PlayFabError(PlayFabErrorCode.InvalidParams, "FunctionName is required"));
                return;
            }

            var result = new ClientModels.ExecuteCloudScriptResult
            {
                FunctionName = request.FunctionName,
                FunctionResult = null,
                FunctionResultTooLarge = false,
                Revision = 1,
                APIRequestsIssued = 0,
                HttpRequestsIssued = 0,
                ExecutionTime = new ClientModels.ExecutionTime { Seconds = 0, Milliseconds = 50, Ticks = 500000, TotalSeconds = 0.05, TotalMilliseconds = 50.0 },
                MemoryConsumed = 2048,
                ProcessorTimeSeconds = 0.001f,
                MemoryLimitExceeded = false,
                Error = null,
                Logs = null
            };

            onSuccess?.Invoke(result);
        }

        public static void GetLeaderboard(
            ClientModels.GetLeaderboardRequest request,
            Action<ClientModels.GetLeaderboardResult> onSuccess,
            Action<PlayFabError> onError,
            object customData = null,
            Dictionary<string, string> extraHeaders = null)
        {
            if (request == null)
            {
                onError?.Invoke(new PlayFabError(PlayFabErrorCode.InvalidParams, "Request is null"));
                return;
            }

            if (string.IsNullOrEmpty(PlayFabId))
            {
                onError?.Invoke(new PlayFabError(PlayFabErrorCode.NotAuthenticated, "Not logged in"));
                return;
            }

            var leaderboard = new List<ClientModels.PlayerLeaderboardEntry>();
            int startPos = Math.Max(0, request.StartPosition);
            int count = Math.Min(100, request.MaxResultsCount);

            for (int i = 0; i < count; i++)
            {
                leaderboard.Add(new ClientModels.PlayerLeaderboardEntry
                {
                    Position = startPos + i,
                    PlayFabId = "STUB_PLAYER_" + (startPos + i).ToString(),
                    StatValue = 10000 - (startPos + i) * 100,
                    DisplayName = "Player_" + (startPos + i).ToString("D3")
                });
            }

            var result = new ClientModels.GetLeaderboardResult
            {
                StatisticName = request.StatisticName,
                Version = 1,
                Leaderboard = leaderboard
            };

            onSuccess?.Invoke(result);
        }

        public static void GetTitleData(
            ClientModels.GetTitleDataRequest request,
            Action<ClientModels.GetTitleDataResult> onSuccess,
            Action<PlayFabError> onError,
            object customData = null,
            Dictionary<string, string> extraHeaders = null)
        {
            if (request == null)
            {
                onError?.Invoke(new PlayFabError(PlayFabErrorCode.InvalidParams, "Request is null"));
                return;
            }

            if (string.IsNullOrEmpty(PlayFabSettings.staticSettings.TitleId))
            {
                onError?.Invoke(new PlayFabError(PlayFabErrorCode.InvalidTitleId, "TitleId is not set"));
                return;
            }

            var data = new Dictionary<string, string>();
            data["WelcomeMessage"] = "Welcome to UsedCarGame (Stub PlayFab!)";
            data["LevelAddresses"] = "[\"Levels/Level_001\",\"Levels/Level_002\",\"Levels/Level_003\"]";

            var result = new ClientModels.GetTitleDataResult { Data = data };
            onSuccess?.Invoke(result);
        }

        public static void GetUserData(
            ClientModels.GetUserDataRequest request,
            Action<ClientModels.GetUserDataResult> onSuccess,
            Action<PlayFabError> onError,
            object customData = null,
            Dictionary<string, string> extraHeaders = null)
        {
            if (request == null)
            {
                onError?.Invoke(new PlayFabError(PlayFabErrorCode.InvalidParams, "Request is null"));
                return;
            }

            if (string.IsNullOrEmpty(PlayFabId))
            {
                onError?.Invoke(new PlayFabError(PlayFabErrorCode.NotAuthenticated, "Not logged in"));
                return;
            }

            var data = new Dictionary<string, ClientModels.UserDataRecord>();

            var result = new ClientModels.GetUserDataResult
            {
                PlayFabId = PlayFabId,
                Data = data,
                DataVersion = 1
            };

            onSuccess?.Invoke(result);
        }

        public static void UpdateUserData(
            ClientModels.UpdateUserDataRequest request,
            Action<ClientModels.UpdateUserDataResult> onSuccess,
            Action<PlayFabError> onError,
            object customData = null,
            Dictionary<string, string> extraHeaders = null)
        {
            if (request == null)
            {
                onError?.Invoke(new PlayFabError(PlayFabErrorCode.InvalidParams, "Request is null"));
                return;
            }

            if (string.IsNullOrEmpty(PlayFabId))
            {
                onError?.Invoke(new PlayFabError(PlayFabErrorCode.NotAuthenticated, "Not logged in"));
                return;
            }

            var result = new ClientModels.UpdateUserDataResult
            {
                DataVersion = 2
            };

            onSuccess?.Invoke(result);
        }

        public static void RegisterPlayFabUser(
            ClientModels.RegisterPlayFabUserRequest request,
            Action<ClientModels.RegisterPlayFabUserResult> onSuccess,
            Action<PlayFabError> onError,
            object customData = null,
            Dictionary<string, string> extraHeaders = null)
        {
            if (request == null)
            {
                onError?.Invoke(new PlayFabError(PlayFabErrorCode.InvalidParams, "Request is null"));
                return;
            }

            var playFabId = "STUB_NEWUSER_" + Guid.NewGuid().ToString("N").Substring(0, 8);
            _authenticationContext.PlayFabId = playFabId;
            _authenticationContext.SessionTicket = "STUB_TICKET_" + Guid.NewGuid().ToString("N");
            PlayFabSettings.staticSettings.IsLoggedIn = _authenticationContext;

            var result = new ClientModels.RegisterPlayFabUserResult
            {
                PlayFabId = playFabId,
                Username = request.Username,
                EntityId = "STUB_ENTITY_" + playFabId,
                EntityType = "title_player_account",
                EntityToken = "STUB_ENTITY_TOKEN_" + Guid.NewGuid().ToString("N")
            };

            onSuccess?.Invoke(result);
        }

        public static void SendAccountRecoveryEmail(
            ClientModels.SendAccountRecoveryEmailRequest request,
            Action<ClientModels.SendAccountRecoveryEmailResult> onSuccess,
            Action<PlayFabError> onError,
            object customData = null,
            Dictionary<string, string> extraHeaders = null)
        {
            if (request == null || string.IsNullOrEmpty(request.Email))
            {
                onError?.Invoke(new PlayFabError(PlayFabErrorCode.InvalidParams, "Email is required"));
                return;
            }

            onSuccess?.Invoke(new ClientModels.SendAccountRecoveryEmailResult());
        }

        public static void GetAccountInfo(
            ClientModels.GetAccountInfoRequest request,
            Action<ClientModels.GetAccountInfoResult> onSuccess,
            Action<PlayFabError> onError,
            object customData = null,
            Dictionary<string, string> extraHeaders = null)
        {
            if (string.IsNullOrEmpty(PlayFabId))
            {
                onError?.Invoke(new PlayFabError(PlayFabErrorCode.NotAuthenticated, "Not logged in"));
                return;
            }

            var result = new ClientModels.GetAccountInfoResult
            {
                Info = new ClientModels.UserAccountInfo
                {
                    PublicInfo = new ClientModels.UserPublicAccountInfo
                    {
                        PlayFabId = PlayFabId,
                        Created = DateTime.UtcNow.AddDays(-30),
                        Username = "stub_user",
                        TitleDisplayName = "Stub Player"
                    },
                    PrivateInfo = new ClientModels.UserPrivateAccountInfo
                    {
                        Email = "stub@example.com"
                    },
                    LinkedAccounts = new List<ClientModels.LinkedPlatformAccount>()
                }
            };

            onSuccess?.Invoke(result);
        }

        public static void ForgetAllCredentials()
        {
            _authenticationContext = new PlayFabAuthenticationContext();
            PlayFabSettings.staticSettings.IsLoggedIn = null;
        }
    }
}
