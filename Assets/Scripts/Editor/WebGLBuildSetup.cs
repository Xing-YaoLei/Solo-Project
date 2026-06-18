#if UNITY_EDITOR
using UnityEditor;
using UnityEngine;

namespace UsedCarGame.EditorTools
{
    public static class WebGLBuildSetup
    {
        [MenuItem("UsedCarGame/Build/Setup WebGL Player Settings")]
        public static void SetupWebGL()
        {
            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Gzip;
            PlayerSettings.WebGL.template = "PROJECT:Default";
            PlayerSettings.WebGL.decompressionFallback = true;
            PlayerSettings.WebGL.exceptionSupport = WebGLExceptionSupport.ExplicitlyThrownExceptionsOnly;
            PlayerSettings.productName = "二手车收车模拟器";
            PlayerSettings.companyName = "UsedCarTraining";
            PlayerSettings.SetScriptingBackend(BuildTargetGroup.WebGL, ScriptingImplementation.IL2CPP);
            PlayerSettings.SetApiCompatibilityLevel(BuildTargetGroup.WebGL, ApiCompatibilityLevel.NET_Standard_2_0);
            Debug.Log("WebGL 构建设置已配置。");
        }

        [MenuItem("UsedCarGame/Build/Addressables/Mark Selected as Addressable")]
        public static void MarkSelectedAsAddressable()
        {
            foreach (var obj in Selection.objects)
            {
                var path = AssetDatabase.GetAssetPath(obj);
                if (string.IsNullOrEmpty(path)) continue;

                try
                {
                    var settingsType = System.Type.GetType(
                        "UnityEditor.AddressableAssets.Settings.AddressableAssetSettings, Unity.Addressables.Editor");
                    if (settingsType == null)
                    {
                        Debug.LogWarning("Addressables 包未安装，请先通过 Package Manager 安装 Unity Addressables 包。");
                        return;
                    }

                    var getDefaultSettings = settingsType.GetMethod("GetDefaultSettings",
                        System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.Public);
                    if (getDefaultSettings == null) return;

                    var settings = getDefaultSettings.Invoke(null, null);
                    if (settings == null)
                    {
                        Debug.LogWarning("请先初始化 Addressables 资源系统 (Window/Asset Management/Addressables/Groups)");
                        return;
                    }

                    var createEntryMethod = settingsType.GetMethod("CreateAndMoveEntry",
                        System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Public);
                    if (createEntryMethod != null)
                    {
                        var guid = AssetDatabase.AssetPathToGUID(path);
                        createEntryMethod.Invoke(settings, new object[] { null, guid, null, null, null, false, null, null });
                        Debug.Log($"已标记为 Addressable: {path}");
                    }
                }
                catch (System.Exception e)
                {
                    Debug.LogError($"标记失败: {path}, 错误: {e.Message}");
                }
            }
        }

        [MenuItem("UsedCarGame/Build/Add USE_PLAYFAB Scripting Define")]
        public static void AddPlayFabDefine()
        {
            var target = BuildTargetGroup.WebGL;
            var defines = PlayerSettings.GetScriptingDefineSymbolsForGroup(target);
            if (!defines.Contains("USE_PLAYFAB"))
            {
                defines = string.IsNullOrEmpty(defines) ? "USE_PLAYFAB" : defines + ";USE_PLAYFAB";
                PlayerSettings.SetScriptingDefineSymbolsForGroup(target, defines);
                Debug.Log("已添加 USE_PLAYFAB 宏定义到 WebGL。");
            }
            else
            {
                Debug.Log("USE_PLAYFAB 已存在。");
            }
        }

        [MenuItem("UsedCarGame/Build/Remove USE_PLAYFAB Scripting Define")]
        public static void RemovePlayFabDefine()
        {
            var target = BuildTargetGroup.WebGL;
            var defines = PlayerSettings.GetScriptingDefineSymbolsForGroup(target);
            if (defines.Contains("USE_PLAYFAB"))
            {
                defines = defines.Replace("USE_PLAYFAB", "").Replace(";;", ";").Trim(';');
                PlayerSettings.SetScriptingDefineSymbolsForGroup(target, defines);
                Debug.Log("已移除 USE_PLAYFAB 宏定义。");
            }
        }
    }
}
#endif
