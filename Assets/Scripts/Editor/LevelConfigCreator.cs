#if UNITY_EDITOR
using System.IO;
using UnityEditor;
using UnityEngine;
using UsedCarGame.Data;

namespace UsedCarGame.EditorTools
{
    public static class LevelConfigCreator
    {
        private const string OutputFolder = "Assets/AddressableAssets/Levels";

        [MenuItem("UsedCarGame/Levels/Create Sample Level 001")]
        public static void CreateSampleLevel001()
        {
            EnsureFolder();
            var config = SampleLevelFactory.CreateLevel_001();
            var path = Path.Combine(OutputFolder, "Level_001.asset");
            AssetDatabase.CreateAsset(config, path);
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log($"Level created at: {path}");
        }

        [MenuItem("UsedCarGame/Levels/Create Sample Level 002")]
        public static void CreateSampleLevel002()
        {
            EnsureFolder();
            var config = SampleLevelFactory.CreateLevel_002();
            var path = Path.Combine(OutputFolder, "Level_002.asset");
            AssetDatabase.CreateAsset(config, path);
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log($"Level created at: {path}");
        }

        [MenuItem("UsedCarGame/Levels/Create Empty Level Config")]
        public static void CreateEmptyLevel()
        {
            EnsureFolder();
            var config = ScriptableObject.CreateInstance<LevelConfig>();
            config.levelId = "level_new";
            config.levelName = "新关卡";
            config.description = "请填写关卡描述";
            config.questionPool = new System.Collections.Generic.List<QuestionData>();
            var path = Path.Combine(OutputFolder, "Level_New.asset");
            ProjectWindowUtil.CreateAsset(config, path);
        }

        [MenuItem("UsedCarGame/Levels/Export Level To JSON")]
        public static void ExportSelectedLevelToJson()
        {
            var selected = Selection.activeObject as LevelConfig;
            if (selected == null)
            {
                Debug.LogWarning("请先在 Project 窗口中选中一个 LevelConfig.asset");
                return;
            }
            var json = JsonUtility.ToJson(selected, true);
            var path = EditorUtility.SaveFilePanel("导出关卡 JSON", "", selected.levelId + ".json", "json");
            if (!string.IsNullOrEmpty(path))
            {
                File.WriteAllText(path, json);
                Debug.Log($"已导出: {path}");
            }
        }

        private static void EnsureFolder()
        {
            if (!Directory.Exists(OutputFolder))
            {
                Directory.CreateDirectory(OutputFolder);
                AssetDatabase.Refresh();
            }
        }
    }
}
#endif
