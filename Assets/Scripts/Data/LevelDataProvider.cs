using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;

namespace UsedCarGame.Data
{
    public class LevelDataProvider
    {
        private readonly Dictionary<string, LevelConfig> _loadedLevels = new Dictionary<string, LevelConfig>();
        private readonly Dictionary<string, AsyncOperationHandle> _activeHandles = new Dictionary<string, AsyncOperationHandle>();

        public event Action<string, LevelConfig> OnLevelLoaded;
        public event Action<string> OnLevelLoadFailed;

        public IEnumerator LoadLevel(string address, Action<LevelConfig> onComplete = null)
        {
            if (_loadedLevels.TryGetValue(address, out var cached))
            {
                onComplete?.Invoke(cached);
                yield break;
            }

            AsyncOperationHandle<LevelConfig> handle;
            try
            {
                handle = Addressables.LoadAssetAsync<LevelConfig>(address);
            }
            catch (Exception e)
            {
                Debug.LogError($"[LevelDataProvider] Failed to start load for {address}: {e.Message}");
                OnLevelLoadFailed?.Invoke(address);
                onComplete?.Invoke(null);
                yield break;
            }

            _activeHandles[address] = handle;

            yield return handle;

            if (handle.Status == AsyncOperationStatus.Succeeded)
            {
                var config = handle.Result;
                _loadedLevels[address] = config;
                OnLevelLoaded?.Invoke(address, config);
                onComplete?.Invoke(config);
            }
            else
            {
                Debug.LogError($"[LevelDataProvider] Failed to load level at {address}");
                OnLevelLoadFailed?.Invoke(address);
                onComplete?.Invoke(null);
                if (_activeHandles.ContainsKey(address))
                {
                    _activeHandles.Remove(address);
                }
            }
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
