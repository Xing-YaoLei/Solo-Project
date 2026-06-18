using UnityEngine;
using UsedCarGame.Core;
using UsedCarGame.Services;

namespace UsedCarGame.Core
{
    public class GameBootstrap : MonoBehaviour
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        private static void Boot()
        {
            if (GameObject.Find("[GameBootstrap]") != null) return;

            var go = new GameObject("[GameBootstrap]");
            DontDestroyOnLoad(go);

            go.AddComponent<GameManager>();
            go.AddComponent<GameSessionRunner>();

            if (!ServiceLocator.IsInitialized)
            {
                var runner = go.AddComponent<BootstrapRunner>();
                runner.RunInit();
            }

            var uiGo = new GameObject("[UIManager]");
            DontDestroyOnLoad(uiGo);
            uiGo.AddComponent<UIManager>();
        }

        private class BootstrapRunner : MonoBehaviour
        {
            public void RunInit()
            {
                StartCoroutine(InitServices());
            }

            private System.Collections.IEnumerator InitServices()
            {
                yield return ServiceLocator.Initialize();

                var pf = new PlayFabService();
                ServiceLocator.Register<IPlayFabService>(pf);
                ServiceLocator.Register(pf);
            }
        }
    }
}
