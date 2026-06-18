using System;
using System.Collections;
using System.Collections.Generic;
using System.Reflection;
using UnityEngine;
using System.Linq;
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
        private readonly Dictionary<string, Func<LevelConfig>> _fallbackFactories = new Dictionary<string, Func<LevelConfig>>();
        private bool _fallbackDiscovered;

#if USE_ADDRESSABLES
        private readonly Dictionary<string, AsyncOperationHandle> _activeHandles = new Dictionary<string, AsyncOperationHandle>();
#endif

        public event Action<string, LevelConfig> OnLevelLoaded;
        public event Action<string> OnLevelLoadFailed;
        public event Action<List<string>> OnLevelAddressesDiscovered;

        public LevelDataProvider()
        {
            DiscoverFallbackFactories();
        }

        private void DiscoverFallbackFactories()
        {
            _fallbackFactories.Clear();
            var factoryTypes = AppDomain.CurrentDomain.GetAssemblies()
                .SelectMany(a => a.GetTypes())
                .Where(t => t.Name == "SampleLevelFactory" || t.IsClass && t.GetMethods(BindingFlags.Static | BindingFlags.Public)
                    .Any(m => m.ReturnType == typeof(LevelConfig) && m.Name.StartsWith("CreateLevel_")));

            foreach (var type in factoryTypes)
            {
                var methods = type.GetMethods(BindingFlags.Static | BindingFlags.Public)
                    .Where(m => m.ReturnType == typeof(LevelConfig)
                             && m.Name.StartsWith("CreateLevel_")
                             && m.GetParameters().Length == 0);

                foreach (var method in methods)
                {
                    var levelId = method.Name.Substring("CreateLevel_".Length);
                    var address = "Levels/Level_" + levelId;
                    if (!_fallbackFactories.ContainsKey(address))
                    {
                        _fallbackFactories[address] = () => (LevelConfig)method.Invoke(null, null);
                    }
                }
            }

            _fallbackDiscovered = true;
        }

        public IEnumerator DiscoverLevelAddresses(Action<List<string>> onComplete = null)
        {
            var addresses = new List<string>();

#if USE_ADDRESSABLES
            bool addressablesOk = false;
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
                            if (!addresses.Contains(loc.PrimaryKey))
                            {
                                addresses.Add(loc.PrimaryKey);
                            }
                        }
                    }
                    addressablesOk = addresses.Count > 0;
                    Debug.Log($"[LevelDataProvider] Found {addresses.Count} levels via Addressables 'Levels' label.");
                }

                try { Addressables.Release(handle); } catch { }
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[LevelDataProvider] Addressables discover failed: {e.Message}");
            }

            if (!addressablesOk)
            {
                Debug.Log("[LevelDataProvider] No Addressables levels found, using fallback discovery.");
                foreach (var kvp in _fallbackFactories)
                {
                    if (!addresses.Contains(kvp.Key))
                    {
                        addresses.Add(kvp.Key);
                    }
                }
            }
#else
            yield return null;
            foreach (var kvp in _fallbackFactories)
            {
                addresses.Add(kvp.Key);
            }
            Debug.Log($"[LevelDataProvider] Using fallback discovery: {addresses.Count} levels found.");
#endif

#if USE_PLAYFAB
            try
            {
                var pf = Core.ServiceLocator.Get<Services.IPlayFabService>();
                if (pf != null && pf.IsLoggedIn)
                {
                    List<string> cloudAddresses = null;
                    yield return pf.LoadCloudLevelList(list => cloudAddresses = list);
                    if (cloudAddresses != null && cloudAddresses.Count > 0)
                    {
                        foreach (var addr in cloudAddresses)
                        {
                            if (!addresses.Contains(addr))
                            {
                                addresses.Add(addr);
                                Debug.Log($"[LevelDataProvider] Added cloud level: {addr}");
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
            if (string.IsNullOrEmpty(address))
            {
                onComplete?.Invoke(null);
                yield break;
            }

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
                Debug.Log($"[LevelDataProvider] Loaded level from Addressables: {address}");
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

        private LevelConfig LoadFallback(string address)
        {
            if (string.IsNullOrEmpty(address)) return null;
            if (!_fallbackDiscovered) DiscoverFallbackFactories();

            if (_fallbackFactories.TryGetValue(address, out var factory))
            {
                try
                {
                    var config = factory.Invoke();
                    if (config != null)
                    {
                        Debug.Log($"[LevelDataProvider] Fallback loaded: {address} ({config.levelName})");
                        return config;
                    }
                }
                catch (Exception e)
                {
                    Debug.LogError($"[LevelDataProvider] Fallback factory error for {address}: {e.Message}");
                }
            }

            var lastSlash = address.LastIndexOf('/');
            var key = lastSlash >= 0 ? address.Substring(lastSlash + 1) : address;

            foreach (var kvp in _fallbackFactories)
            {
                if (kvp.Key.EndsWith(key) || kvp.Key.EndsWith(key, StringComparison.OrdinalIgnoreCase))
                {
                    try
                    {
                        var config = kvp.Value.Invoke();
                        if (config != null)
                        {
                            Debug.Log($"[LevelDataProvider] Fallback loaded via match: {address} -> {kvp.Key}");
                            return config;
                        }
                    }
                    catch (Exception e)
                    {
                        Debug.LogError($"[LevelDataProvider] Fallback factory error: {e.Message}");
                    }
                }
            }

            Debug.LogWarning($"[LevelDataProvider] No fallback factory for address: {address}");
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

        public int GetFallbackLevelCount()
        {
            if (!_fallbackDiscovered) DiscoverFallbackFactories();
            return _fallbackFactories.Count;
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

        public void ReloadFallbackFactories()
        {
            _fallbackDiscovered = false;
            DiscoverFallbackFactories();
        }
    }
}
