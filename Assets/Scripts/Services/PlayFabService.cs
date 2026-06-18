using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UsedCarGame.Data;
using UsedCarGame.Services;

namespace UsedCarGame.Services
{
    public class PlayFabService : IPlayFabService
    {
        public bool IsInitialized { get; private set; }
        public bool IsLoggedIn { get; private set; }

        private string _titleId;
        private string _cachedPlayerProgress;

        public IEnumerator Initialize(string titleId)
        {
            if (IsInitialized) yield break;

            _titleId = titleId;

            try
            {
#if USE_PLAYFAB
                PlayFab.PlayFabSettings.staticSettings.TitleId = titleId;
#endif
                IsInitialized = true;
                Debug.Log("[PlayFabService] Initialized.");
            }
            catch (Exception e)
            {
                Debug.LogError($"[PlayFabService] Init failed: {e.Message}");
            }

            yield return null;
        }

        public IEnumerator Login()
        {
            if (IsLoggedIn) yield break;
            if (!IsInitialized)
            {
                Debug.LogWarning("[PlayFabService] Not initialized, cannot login.");
                yield break;
            }

#if USE_PLAYFAB
            var loginRequest = new PlayFab.ClientModels.LoginWithCustomIDRequest
            {
                CustomId = GetOrCreateCustomId(),
                CreateAccount = true
            };

            bool done = false;
            PlayFab.PlayFabClientAPI.LoginWithCustomID(loginRequest,
                result =>
                {
                    IsLoggedIn = true;
                    Debug.Log($"[PlayFabService] Logged in as {result.PlayFabId}");
                    done = true;
                },
                error =>
                {
                    Debug.LogError($"[PlayFabService] Login failed: {error.ErrorMessage}");
                    done = true;
                });

            while (!done) yield return null;
#else
            IsLoggedIn = true;
            Debug.Log("[PlayFabService] Dummy login (USE_PLAYFAB not defined)");
            yield return null;
#endif
        }

        public void SubmitSessionResult(SessionResult result)
        {
            if (!IsLoggedIn || result == null) return;

#if USE_PLAYFAB
            var request = new PlayFab.ClientModels.ExecuteCloudScriptRequest
            {
                FunctionName = "SubmitSessionResult",
                FunctionParameter = new
                {
                    levelId = result.levelId,
                    levelName = result.levelName,
                    score = result.finalScore,
                    correctCount = result.correctCount,
                    errorCount = result.errorCount,
                    maxConsecutive = result.maxConsecutiveCorrect,
                    timeUsed = result.totalTimeSeconds - result.timeRemaining,
                    accuracy = result.accuracyRate,
                    inventoryTurnover = result.inventoryTurnoverRating,
                    isPassed = result.isPassed
                }
            };

            PlayFab.PlayFabClientAPI.ExecuteCloudScript(request,
                r => Debug.Log($"[PlayFabService] Session submitted."),
                e => Debug.LogWarning($"[PlayFabService] Submit failed: {e.ErrorMessage}"));
#else
            Debug.Log($"[PlayFabService] Would submit score {result.finalScore} for level {result.levelName}");
#endif
        }

        public IEnumerator LoadLeaderboard(string statName, int maxResults, Action<List<PlayFabLeaderboardEntry>> onComplete)
        {
            var results = new List<PlayFabLeaderboardEntry>();

            if (!IsLoggedIn)
            {
                onComplete?.Invoke(results);
                yield break;
            }

#if USE_PLAYFAB
            bool done = false;
            var request = new PlayFab.ClientModels.GetLeaderboardRequest
            {
                StatisticName = statName,
                MaxResultsCount = maxResults,
                StartPosition = 0
            };

            PlayFab.PlayFabClientAPI.GetLeaderboard(request,
                r =>
                {
                    foreach (var e in r.Leaderboard)
                    {
                        results.Add(new PlayFabLeaderboardEntry
                        {
                            displayName = e.DisplayName ?? e.PlayFabId,
                            position = e.Position,
                            score = e.StatValue,
                            playerId = e.PlayFabId
                        });
                    }
                    done = true;
                },
                e =>
                {
                    Debug.LogWarning($"[PlayFabService] Leaderboard failed: {e.ErrorMessage}");
                    done = true;
                });

            while (!done) yield return null;
#endif
            onComplete?.Invoke(results);
        }

        public IEnumerator LoadCloudLevelList(Action<List<string>> onComplete)
        {
            var levels = new List<string>();

            if (!IsLoggedIn)
            {
                onComplete?.Invoke(levels);
                yield break;
            }

#if USE_PLAYFAB
            bool done = false;
            var request = new PlayFab.ClientModels.GetTitleDataRequest { Keys = null };
            PlayFab.PlayFabClientAPI.GetTitleData(request,
                r =>
                {
                    if (r.Data != null && r.Data.TryGetValue("LevelAddresses", out var json))
                    {
                        try
                        {
                            var list = JsonUtility.FromJson<LevelListWrapper>(json);
                            if (list != null && list.addresses != null)
                            {
                                levels.AddRange(list.addresses);
                            }
                        }
                        catch (Exception e)
                        {
                            Debug.LogWarning($"[PlayFabService] Parse level list failed: {e.Message}");
                        }
                    }
                    done = true;
                },
                e =>
                {
                    Debug.LogWarning($"[PlayFabService] TitleData failed: {e.ErrorMessage}");
                    done = true;
                });

            while (!done) yield return null;
#endif
            onComplete?.Invoke(levels);
        }

        public IEnumerator SavePlayerProgress(string json)
        {
            if (!IsLoggedIn) yield break;

            _cachedPlayerProgress = json;

#if USE_PLAYFAB
            bool done = false;
            var request = new PlayFab.ClientModels.UpdateUserDataRequest
            {
                Data = new Dictionary<string, string> { { "Progress", json } }
            };
            PlayFab.PlayFabClientAPI.UpdateUserData(request,
                r => done = true,
                e =>
                {
                    Debug.LogWarning($"[PlayFabService] Save failed: {e.ErrorMessage}");
                    done = true;
                });
            while (!done) yield return null;
#else
            PlayerPrefs.SetString("UsedCar_CloudProgress", json);
            PlayerPrefs.Save();
            yield return null;
#endif
        }

        public IEnumerator LoadPlayerProgress(Action<string> onComplete)
        {
#if USE_PLAYFAB
            string result = null;
            if (IsLoggedIn)
            {
                bool done = false;
                var request = new PlayFab.ClientModels.GetUserDataRequest { Keys = new List<string> { "Progress" } };
                PlayFab.PlayFabClientAPI.GetUserData(request,
                    r =>
                    {
                        if (r.Data != null && r.Data.TryGetValue("Progress", out var v))
                        {
                            result = v.Value;
                        }
                        done = true;
                    },
                    e =>
                    {
                        Debug.LogWarning($"[PlayFabService] Load failed: {e.ErrorMessage}");
                        done = true;
                    });
                while (!done) yield return null;
            }
            onComplete?.Invoke(result);
#else
            var local = PlayerPrefs.GetString("UsedCar_CloudProgress", null);
            onComplete?.Invoke(local);
            yield return null;
#endif
        }

        private static string GetOrCreateCustomId()
        {
            const string key = "UsedCar_CustomId";
            if (PlayerPrefs.HasKey(key)) return PlayerPrefs.GetString(key);
            var id = System.Guid.NewGuid().ToString("N");
            PlayerPrefs.SetString(key, id);
            PlayerPrefs.Save();
            return id;
        }

        [Serializable]
        private class LevelListWrapper
        {
            public List<string> addresses;
        }
    }
}
