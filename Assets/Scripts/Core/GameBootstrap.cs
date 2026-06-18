using System.Collections;
using UnityEngine;
using UsedCarGame.Services;
using UsedCarGame.UI;

namespace UsedCarGame.Core
{
    public class GameBootstrap : MonoBehaviour
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void BootAfterSceneLoad()
        {
            EnsureCoreSystems();
        }

        private static void EnsureCoreSystems()
        {
            if (GameManager.Instance != null) return;

            var go = new GameObject("[GameSystems]");
            DontDestroyOnLoad(go);

            go.AddComponent<GameManager>();
            go.AddComponent<GameSessionRunner>();

            if (!ServiceLocator.IsInitialized)
            {
                var runner = go.AddComponent<BootstrapRunner>();
                runner.StartCoroutine(runner.InitServices());
            }

            if (UIManager.Instance == null)
            {
                var uiGo = new GameObject("[UIManager]");
                DontDestroyOnLoad(uiGo);
                uiGo.AddComponent<UIManager>();
            }
        }

        private class BootstrapRunner : MonoBehaviour
        {
            public IEnumerator InitServices()
            {
                yield return ServiceLocator.Initialize();

                var pf = new PlayFabService();
                ServiceLocator.Register<IPlayFabService>(pf);
                ServiceLocator.Register(pf);
            }
        }
    }
}
