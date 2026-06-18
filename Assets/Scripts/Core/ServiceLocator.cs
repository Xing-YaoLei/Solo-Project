using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UsedCarGame.Data;

namespace UsedCarGame.Core
{
    public static class ServiceLocator
    {
        private static readonly Dictionary<Type, object> _services = new Dictionary<Type, object>();
        private static bool _isInitialized;

        public static bool IsInitialized => _isInitialized;

        public static IEnumerator Initialize()
        {
            if (_isInitialized) yield break;

            Register(new SettingsManager());
            Register(new AudioService());
            Register(new VibrationService());
            Register(new GameSession());
            Register(new LevelDataProvider());

            yield return null;
            _isInitialized = true;
            Debug.Log("[ServiceLocator] All services initialized.");
        }

        public static void Register<T>(T service) where T : class
        {
            var type = typeof(T);
            if (_services.ContainsKey(type))
            {
                Debug.LogWarning($"[ServiceLocator] Service {type.Name} is already registered. Overwriting.");
            }
            _services[type] = service;
        }

        public static T Get<T>() where T : class
        {
            var type = typeof(T);
            if (_services.TryGetValue(type, out var service))
            {
                return service as T;
            }
            Debug.LogError($"[ServiceLocator] Service {type.Name} not found.");
            return null;
        }

        public static bool TryGet<T>(out T service) where T : class
        {
            var type = typeof(T);
            if (_services.TryGetValue(type, out var obj))
            {
                service = obj as T;
                return service != null;
            }
            service = null;
            return false;
        }
    }
}
