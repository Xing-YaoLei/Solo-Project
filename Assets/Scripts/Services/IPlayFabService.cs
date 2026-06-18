using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UsedCarGame.Data;

namespace UsedCarGame.Services
{
    public interface IPlayFabService
    {
        bool IsInitialized { get; }
        bool IsLoggedIn { get; }

        IEnumerator Initialize(string titleId);
        IEnumerator Login();
        void SubmitSessionResult(SessionResult result);
        IEnumerator LoadLeaderboard(string statName, int maxResults, Action<List<PlayFabLeaderboardEntry>> onComplete);
        IEnumerator LoadCloudLevelList(Action<List<string>> onComplete);
        IEnumerator SavePlayerProgress(string json);
        IEnumerator LoadPlayerProgress(Action<string> onComplete);
    }

    [Serializable]
    public class PlayFabLeaderboardEntry
    {
        public string displayName;
        public int position;
        public int score;
        public string playerId;
    }
}
