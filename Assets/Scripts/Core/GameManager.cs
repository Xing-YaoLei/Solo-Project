using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace UsedCarGame.Core
{
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        public enum GameState
        {
            Boot,
            MainMenu,
            LevelSelect,
            Playing,
            Paused,
            Settlement,
            Review,
            Settings
        }

        public GameState CurrentState { get; private set; }
        public event Action<GameState, GameState> OnStateChanged;

        [Header("Game Settings")]
        [SerializeField] private string defaultLevelAddress = "Levels/Level_001";

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
            CurrentState = GameState.Boot;
        }

        private IEnumerator Start()
        {
            yield return ServiceLocator.Initialize();
            ChangeState(GameState.MainMenu);
        }

        public void ChangeState(GameState newState)
        {
            if (CurrentState == newState) return;

            var oldState = CurrentState;
            CurrentState = newState;

            try
            {
                OnStateChanged?.Invoke(oldState, newState);
            }
            catch (Exception e)
            {
                Debug.LogError($"[GameManager] State change callback error: {e.Message}");
            }
        }

        public void StartLevel(string levelAddress)
        {
            ChangeState(GameState.Playing);
            var session = ServiceLocator.Get<GameSession>();
            session?.StartNewSession(levelAddress);
        }

        public void CompleteCurrentLevel()
        {
            ChangeState(GameState.Settlement);
        }

        public void RetryLevel()
        {
            var session = ServiceLocator.Get<GameSession>();
            if (session != null)
            {
                session.ResetSession();
                ChangeState(GameState.Playing);
            }
        }

        public void ReturnToMainMenu()
        {
            ChangeState(GameState.MainMenu);
        }

        public void OpenReview()
        {
            ChangeState(GameState.Review);
        }

        public void OpenSettings()
        {
            ChangeState(GameState.Settings);
        }

        public void PauseGame()
        {
            if (CurrentState == GameState.Playing)
            {
                ChangeState(GameState.Paused);
                Time.timeScale = 0f;
            }
        }

        public void ResumeGame()
        {
            if (CurrentState == GameState.Paused)
            {
                ChangeState(GameState.Playing);
                Time.timeScale = 1f;
            }
        }
    }
}
