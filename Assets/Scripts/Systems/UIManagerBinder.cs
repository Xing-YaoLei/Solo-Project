using System.Reflection;
using UnityEngine;
using UsedCarGame.UI;

namespace UsedCarGame.Systems
{
    public static class UIManagerBinder
    {
        public static void Bind(UIManager uiMgr,
            MainMenuPanel mainMenu,
            LevelSelectPanel levelSelect,
            GameplayPanel gameplay,
            SettlementPanel settlement,
            ReviewPanel review,
            SettingsPanel settings,
            PausePanel pause)
        {
            uiMgr.SetPanels(mainMenu, levelSelect, gameplay, settlement, review, settings, pause);
        }

        public static void SetPanelRoot(UIPanelBase panel, GameObject root)
        {
            var type = typeof(UIPanelBase);
            var field = type.GetField("panelRoot",
                BindingFlags.Instance | BindingFlags.NonPublic);
            if (field != null)
            {
                field.SetValue(panel, root);
            }
        }

        public static void SetField<T>(object target, string fieldName, T value) where T : class
        {
            if (target == null || value == null) return;
            var type = target.GetType();
            var field = type.GetField(fieldName,
                BindingFlags.Instance | BindingFlags.NonPublic);
            if (field != null)
            {
                field.SetValue(target, value);
            }
        }

        public static T GetField<T>(object target, string fieldName) where T : class
        {
            if (target == null) return null;
            var type = target.GetType();
            var field = type.GetField(fieldName,
                BindingFlags.Instance | BindingFlags.NonPublic);
            return field?.GetValue(target) as T;
        }
    }
}
