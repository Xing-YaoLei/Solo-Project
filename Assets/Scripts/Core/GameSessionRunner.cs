using UnityEngine;
using UsedCarGame.Core;
using UsedCarGame.Data;

namespace UsedCarGame.Core
{
    public class GameSessionRunner : MonoBehaviour
    {
        public static GameSessionRunner Instance { get; private set; }

        private GameSession _session;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Start()
        {
            StartCoroutine(WaitForServices());
        }

        private System.Collections.IEnumerator WaitForServices()
        {
            while (!ServiceLocator.IsInitialized)
            {
                yield return null;
            }
            _session = ServiceLocator.Get<GameSession>();
        }

        private void Update()
        {
            if (_session == null || !_session.IsRunning) return;
            if (GameManager.Instance == null) return;
            if (GameManager.Instance.CurrentState != GameManager.GameState.Playing) return;

            _session.Tick(Time.unscaledDeltaTime);
        }
    }
}
