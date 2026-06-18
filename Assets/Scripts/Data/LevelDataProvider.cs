using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
#if USE_ADDRESSABLES
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;
using UnityEngine.ResourceManagement.ResourceLocations;
#endif

namespace UsedCarGame.Data
{
    public class LevelDataProvider
    {
        private readonly Dictionary<string, LevelConfig> _loadedLevels = new Dictionary<string, LevelConfig>();
#if USE_ADDRESSABLES
        private readonly Dictionary<string, AsyncOperationHandle> _activeHandles = new Dictionary<string, AsyncOperationHandle>();
#endif

        public static readonly List<string> BuiltInLevelAddresses = new List<string>
        {
            "Levels/Level_001",
            "Levels/Level_002",
            "Levels/Level_003"
        };

        public event Action<string, LevelConfig> OnLevelLoaded;
        public event Action<string> OnLevelLoadFailed;
        public event Action<List<string>> OnLevelAddressesDiscovered;

        public IEnumerator DiscoverLevelAddresses(Action<List<string>> onComplete = null)
        {
            var addresses = new List<string>();

#if USE_ADDRESSABLES
            try
            {
                var handle = Addressables.LoadResourceLocationsAsync("Levels", typeof(LevelConfig));
                yield return handle;

                if (handle.Status == AsyncOperationStatus.Succeeded && handle.Result != null)
                {
                    foreach (var loc in handle.Result)
                    {
                        if (loc != null && !string.IsNullOrEmpty(loc.PrimaryKey))
                        {
                            addresses.Add(loc.PrimaryKey);
                        }
                    }
                }

                try { Addressables.Release(handle); } catch { }
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[LevelDataProvider] Addressables discover failed, using built-in list: {e.Message}");
                addresses = new List<string>(BuiltInLevelAddresses);
            }

            if (addresses.Count == 0)
            {
                Debug.Log("[LevelDataProvider] No Addressables found, falling back to built-in list.");
                addresses = new List<string>(BuiltInLevelAddresses);
            }
#else
            yield return null;
            addresses = new List<string>(BuiltInLevelAddresses);
#endif

#if USE_PLAYFAB
            try
            {
                var pf = Core.ServiceLocator.Get<Services.IPlayFabService>();
                if (pf != null && pf.IsLoggedIn)
                {
                    List<string> cloudAddresses = null;
                    yield return pf.LoadCloudLevelList(list => cloudAddresses = list);
                    if (cloudAddresses != null)
                    {
                        foreach (var addr in cloudAddresses)
                        {
                            if (!addresses.Contains(addr))
                            {
                                addresses.Add(addr);
                            }
                        }
                    }
                }
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[LevelDataProvider] PlayFab cloud addresses failed: {e.Message}");
            }
#endif

            OnLevelAddressesDiscovered?.Invoke(addresses);
            onComplete?.Invoke(addresses);
        }

        public IEnumerator LoadLevel(string address, Action<LevelConfig> onComplete = null)
        {
            if (_loadedLevels.TryGetValue(address, out var cached))
            {
                onComplete?.Invoke(cached);
                yield break;
            }

            LevelConfig result = null;

#if USE_ADDRESSABLES
            AsyncOperationHandle<LevelConfig> handle;
            try
            {
                handle = Addressables.LoadAssetAsync<LevelConfig>(address);
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[LevelDataProvider] Addressables not available for {address}, using fallback. Error: {e.Message}");
                result = LoadFallback(address);
                yield break;
            }

            _activeHandles[address] = handle;
            yield return handle;

            if (handle.Status == AsyncOperationStatus.Succeeded)
            {
                result = handle.Result;
            }
            else
            {
                Debug.LogWarning($"[LevelDataProvider] Addressables load failed for {address}, using fallback.");
                result = LoadFallback(address);
            }
#else
            result = LoadFallback(address);
            yield return null;
#endif

            if (result != null)
            {
                _loadedLevels[address] = result;
                OnLevelLoaded?.Invoke(address, result);
                onComplete?.Invoke(result);
            }
            else
            {
                Debug.LogError($"[LevelDataProvider] Failed to load level: {address}");
                OnLevelLoadFailed?.Invoke(address);
                onComplete?.Invoke(null);
            }
        }

        private static LevelConfig LoadFallback(string address)
        {
            if (string.IsNullOrEmpty(address)) return null;

            if (address.EndsWith("Level_001") || address.EndsWith("level_001"))
            {
                return SampleLevelFactory.CreateLevel_001();
            }
            if (address.EndsWith("Level_002") || address.EndsWith("level_002"))
            {
                return SampleLevelFactory.CreateLevel_002();
            }
            if (address.EndsWith("Level_003") || address.EndsWith("level_003"))
            {
                return SampleLevelFactory.CreateLevel_003();
            }

            Debug.LogWarning($"[LevelDataProvider] No fallback for address: {address}");
            return null;
        }

        public IEnumerator LoadLevelList(List<string> addresses, Action<List<LevelConfig>> onComplete = null)
        {
            var results = new List<LevelConfig>();
            foreach (var addr in addresses)
            {
                LevelConfig loaded = null;
                yield return LoadLevel(addr, cfg => loaded = cfg);
                if (loaded != null) results.Add(loaded);
            }
            onComplete?.Invoke(results);
        }

        public LevelConfig GetLoadedLevel(string address)
        {
            _loadedLevels.TryGetValue(address, out var config);
            return config;
        }

        public bool IsLevelLoaded(string address)
        {
            return _loadedLevels.ContainsKey(address);
        }

        public void UnloadLevel(string address)
        {
            if (_loadedLevels.ContainsKey(address))
            {
                _loadedLevels.Remove(address);
            }

#if USE_ADDRESSABLES
            if (_activeHandles.TryGetValue(address, out var handle))
            {
                try
                {
                    Addressables.Release(handle);
                }
                catch (Exception e)
                {
                    Debug.LogWarning($"[LevelDataProvider] Error releasing handle for {address}: {e.Message}");
                }
                _activeHandles.Remove(address);
            }
#endif
        }

        public void UnloadAll()
        {
            var keys = new List<string>(_loadedLevels.Keys);
            foreach (var key in keys)
            {
                UnloadLevel(key);
            }
        }
    }
}
