using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UsedCarGame.UI;
using UsedCarGame.Core;

namespace UsedCarGame.Systems
{
    public static class MainMenuBuilder
    {
        public static MainMenuPanel Build(Transform parent)
        {
            var panel = RuntimeUIBuilder.CreatePanel(parent, "MainMenuPanel");
            var script = panel.AddComponent<MainMenuPanel>();
            UIManagerBinder.SetPanelRoot(script, panel);

            var title = RuntimeUIBuilder.AddText(panel.transform, "🚗 二手车收车模拟器", 48);
            (title.rectTransform.anchorMin, title.rectTransform.anchorMax) = (new Vector2(0, 0.5f), new Vector2(1, 0.5f));
            title.rectTransform.anchoredPosition = new Vector2(0, 220);
            title.fontStyle = FontStyles.Bold;

            var subtitle = RuntimeUIBuilder.AddText(panel.transform, "车辆收购经营模拟 · 办公安静练习版", 20);
            (subtitle.rectTransform.anchorMin, subtitle.rectTransform.anchorMax) = (new Vector2(0, 0.5f), new Vector2(1, 0.5f));
            subtitle.rectTransform.anchoredPosition = new Vector2(0, 160);
            subtitle.color = new Color(0.5f, 0.5f, 0.55f, 1f);

            var startBtn = RuntimeUIBuilder.AddButton(panel.transform, "📝 开始练习", "StartButton", 24);
            startBtn.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, 60);
            startBtn.GetComponent<RectTransform>().sizeDelta = new Vector2(300, 70);

            var reviewBtn = RuntimeUIBuilder.AddButton(panel.transform, "📊 复盘中心", "ReviewButton", 20);
            reviewBtn.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, -30);
            reviewBtn.GetComponent<RectTransform>().sizeDelta = new Vector2(300, 55);

            var settingsBtn = RuntimeUIBuilder.AddButton(panel.transform, "⚙ 设置", "SettingsButton", 20);
            settingsBtn.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, -110);
            settingsBtn.GetComponent<RectTransform>().sizeDelta = new Vector2(300, 55);

            var quitBtn = RuntimeUIBuilder.AddButton(panel.transform, "🚪 退出游戏", "QuitButton", 20);
            quitBtn.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, -190);
            quitBtn.GetComponent<RectTransform>().sizeDelta = new Vector2(300, 55);
            quitBtn.GetComponent<Image>().color = new Color(0.7f, 0.35f, 0.35f, 1f);

            var hint = RuntimeUIBuilder.AddText(panel.transform, "💡 适合工作间隙安静练习 · 可随时暂停", 16);
            (hint.rectTransform.anchorMin, hint.rectTransform.anchorMax) = (new Vector2(0, 0.5f), new Vector2(1, 0.5f));
            hint.rectTransform.anchoredPosition = new Vector2(0, -280);
            hint.color = new Color(0.5f, 0.5f, 0.55f, 1f);

            UIManagerBinder.SetField(script, "startButton", startBtn);
            UIManagerBinder.SetField(script, "reviewButton", reviewBtn);
            UIManagerBinder.SetField(script, "settingsButton", settingsBtn);
            UIManagerBinder.SetField(script, "quitButton", quitBtn);

            return script;
        }
    }

    public static class LevelSelectBuilder
    {
        public static LevelSelectPanel Build(Transform parent)
        {
            var panel = RuntimeUIBuilder.CreatePanel(parent, "LevelSelectPanel");
            var script = panel.AddComponent<LevelSelectPanel>();
            UIManagerBinder.SetPanelRoot(script, panel);

            var title = RuntimeUIBuilder.AddText(panel.transform, "选择关卡", 36);
            (title.rectTransform.anchorMin, title.rectTransform.anchorMax) = (new Vector2(0, 1), new Vector2(1, 1));
            title.rectTransform.anchoredPosition = new Vector2(0, -50);
            title.fontStyle = FontStyles.Bold;

            var subtitle = RuntimeUIBuilder.AddText(panel.transform, "★ 高亮为推荐关卡 · 点击卡片开始练习", 16);
            (subtitle.rectTransform.anchorMin, subtitle.rectTransform.anchorMax) = (new Vector2(0, 1), new Vector2(1, 1));
            subtitle.rectTransform.anchoredPosition = new Vector2(0, -95);
            subtitle.color = new Color(0.5f, 0.52f, 0.58f, 1f);

            var scrollGo = new GameObject("LevelCardScrollView");
            scrollGo.transform.SetParent(panel.transform, false);
            var srt = scrollGo.AddComponent<RectTransform>();
            srt.anchorMin = new Vector2(0.05f, 0.15f);
            srt.anchorMax = new Vector2(0.95f, 0.8f);
            srt.offsetMin = Vector2.zero;
            srt.offsetMax = Vector2.zero;

            var scrollRect = scrollGo.AddComponent<ScrollRect>();
            scrollRect.horizontal = false;
            scrollRect.vertical = true;
            scrollRect.movementType = ScrollRect.MovementType.Clamped;
            scrollRect.scrollSensitivity = 25f;

            var viewportGo = new GameObject("Viewport");
            viewportGo.transform.SetParent(scrollGo.transform, false);
            var vrt = viewportGo.AddComponent<RectTransform>();
            vrt.anchorMin = Vector2.zero;
            vrt.anchorMax = Vector2.one;
            vrt.offsetMin = Vector2.zero;
            vrt.offsetMax = Vector2.zero;
            viewportGo.AddComponent<RectMask2D>();
            scrollRect.viewport = vrt;

            var container = new GameObject("LevelCardContainer");
            container.transform.SetParent(viewportGo.transform, false);
            var crt = container.AddComponent<RectTransform>();
            crt.anchorMin = new Vector2(0, 1);
            crt.anchorMax = new Vector2(1, 1);
            crt.pivot = new Vector2(0.5f, 1);
            crt.sizeDelta = new Vector2(0, 500);
            crt.anchoredPosition = Vector2.zero;
            scrollRect.content = crt;

            var layoutGroup = container.AddComponent<HorizontalLayoutGroup>();
            layoutGroup.spacing = 24f;
            layoutGroup.padding = new RectOffset(20, 20, 20, 20);
            layoutGroup.childAlignment = TextAnchor.UpperLeft;
            layoutGroup.childControlWidth = false;
            layoutGroup.childControlHeight = false;
            layoutGroup.childForceExpandWidth = false;
            layoutGroup.childForceExpandHeight = false;

            var fitter = container.AddComponent<ContentSizeFitter>();
            fitter.horizontalFit = ContentSizeFitter.FitMode.PreferredSize;
            fitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;

            var loading = RuntimeUIBuilder.AddText(panel.transform, "", 20);
            (loading.rectTransform.anchorMin, loading.rectTransform.anchorMax) = (new Vector2(0, 0.5f), new Vector2(1, 0.5f));
            loading.rectTransform.anchoredPosition = Vector2.zero;
            loading.gameObject.SetActive(false);

            var backBtn = RuntimeUIBuilder.AddButton(panel.transform, "← 返回主菜单", "BackButton", 18);
            var brt = backBtn.GetComponent<RectTransform>();
            brt.anchorMin = new Vector2(0, 0);
            brt.anchorMax = new Vector2(0, 0);
            brt.pivot = new Vector2(0, 0);
            brt.anchoredPosition = new Vector2(30, 30);
            brt.sizeDelta = new Vector2(220, 50);

            UIManagerBinder.SetField(script, "levelCardContainer", container.transform);
            UIManagerBinder.SetField(script, "backButton", backBtn);
            UIManagerBinder.SetField(script, "loadingText", loading);

            return script;
        }
    }

    public static class SettingsBuilder
    {
        public static SettingsPanel Build(Transform parent)
        {
            var panel = RuntimeUIBuilder.CreatePanel(parent, "SettingsPanel");
            var script = panel.AddComponent<SettingsPanel>();
            UIManagerBinder.SetPanelRoot(script, panel);

            var title = RuntimeUIBuilder.AddText(panel.transform, "⚙ 设置", 32);
            (title.rectTransform.anchorMin, title.rectTransform.anchorMax) = (new Vector2(0, 0.5f), new Vector2(1, 0.5f));
            title.rectTransform.anchoredPosition = new Vector2(0, 260);
            title.fontStyle = FontStyles.Bold;

            var settingsHolder = new GameObject("SettingsHolder");
            settingsHolder.transform.SetParent(panel.transform, false);
            var shRt = settingsHolder.AddComponent<RectTransform>();
            shRt.sizeDelta = new Vector2(400, 320);
            shRt.anchoredPosition = new Vector2(0, 40);
            settingsHolder.AddComponent<Image>().color = Color.white;

            var sfxToggle = RuntimeUIBuilder.AddToggle(settingsHolder.transform, "🔊 开启音效", "SfxToggle");
            sfxToggle.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, 100);
            sfxToggle.isOn = true;

            var sfxSlider = RuntimeUIBuilder.AddSlider(settingsHolder.transform, "音量", "SfxVolumeSlider");
            sfxSlider.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, 40);
            sfxSlider.value = 0.8f;

            var sfxValueText = settingsHolder.transform.Find("SfxVolumeSlider/ValueText")?.GetComponent<TMP_Text>();
            if (sfxValueText != null) sfxValueText.name = "SfxVolumeValueText";

            var vibToggle = RuntimeUIBuilder.AddToggle(settingsHolder.transform, "📳 开启震动", "VibrationToggle");
            vibToggle.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, -20);
            vibToggle.isOn = false;

            var hint = RuntimeUIBuilder.AddText(settingsHolder.transform, "💡 办公模式建议：关闭震动、降低音量", 14);
            (hint.rectTransform.anchorMin, hint.rectTransform.anchorMax) = (new Vector2(0, 0), new Vector2(1, 0));
            hint.rectTransform.anchoredPosition = new Vector2(0, 40);
            hint.color = new Color(0.5f, 0.5f, 0.55f, 1f);

            var backBtn = RuntimeUIBuilder.AddButton(panel.transform, "← 返回", "BackButton", 20);
            backBtn.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, -150);
            backBtn.GetComponent<RectTransform>().sizeDelta = new Vector2(240, 55);

            var resetBtn = RuntimeUIBuilder.AddButton(panel.transform, "♻ 恢复默认", "ResetDefaultsButton", 16);
            resetBtn.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, -215);
            resetBtn.GetComponent<RectTransform>().sizeDelta = new Vector2(180, 40);
            resetBtn.GetComponent<Image>().color = new Color(0.5f, 0.5f, 0.55f, 1f);

            UIManagerBinder.SetField(script, "sfxToggle", sfxToggle);
            UIManagerBinder.SetField(script, "sfxVolumeSlider", sfxSlider);
            UIManagerBinder.SetField(script, "sfxVolumeValueText", sfxValueText);
            UIManagerBinder.SetField(script, "vibrationToggle", vibToggle);
            UIManagerBinder.SetField(script, "backButton", backBtn);
            UIManagerBinder.SetField(script, "resetDefaultsButton", resetBtn);

            return script;
        }
    }

    public static class PauseBuilder
    {
        public static PausePanel Build(Transform parent)
        {
            var panel = RuntimeUIBuilder.CreatePanel(parent, "PausePanel");
            var script = panel.AddComponent<PausePanel>();
            UIManagerBinder.SetPanelRoot(script, panel);

            var panelImg = panel.GetComponent<Image>();
            panelImg.color = new Color(0, 0, 0, 0.6f);

            var dialog = new GameObject("Dialog");
            dialog.transform.SetParent(panel.transform, false);
            var drt = dialog.AddComponent<RectTransform>();
            drt.sizeDelta = new Vector2(400, 360);
            drt.anchoredPosition = Vector2.zero;
            var dImg = dialog.AddComponent<Image>();
            dImg.color = new Color(0.95f, 0.95f, 0.97f, 1f);

            var title = RuntimeUIBuilder.AddText(dialog.transform, "⏸ 已暂停", 32);
            (title.rectTransform.anchorMin, title.rectTransform.anchorMax) = (new Vector2(0, 0.5f), new Vector2(1, 0.5f));
            title.rectTransform.anchoredPosition = new Vector2(0, 120);
            title.fontStyle = FontStyles.Bold;

            var tip = RuntimeUIBuilder.AddText(dialog.transform, "随时可以继续练习", 16);
            (tip.rectTransform.anchorMin, tip.rectTransform.anchorMax) = (new Vector2(0, 0.5f), new Vector2(1, 0.5f));
            tip.rectTransform.anchoredPosition = new Vector2(0, 75);
            tip.color = new Color(0.5f, 0.5f, 0.55f, 1f);

            var resumeBtn = RuntimeUIBuilder.AddButton(dialog.transform, "▶ 继续游戏", "ResumeButton", 20);
            resumeBtn.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, 20);
            resumeBtn.GetComponent<RectTransform>().sizeDelta = new Vector2(280, 55);
            resumeBtn.GetComponent<Image>().color = new Color(0.2f, 0.7f, 0.35f, 1f);

            var settingsBtn = RuntimeUIBuilder.AddButton(dialog.transform, "⚙ 设置", "SettingsButton", 18);
            settingsBtn.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, -45);
            settingsBtn.GetComponent<RectTransform>().sizeDelta = new Vector2(280, 45);

            var retryBtn = RuntimeUIBuilder.AddButton(dialog.transform, "🔄 重新开始", "RetryButton", 18);
            retryBtn.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, -100);
            retryBtn.GetComponent<RectTransform>().sizeDelta = new Vector2(280, 45);
            retryBtn.GetComponent<Image>().color = new Color(0.9f, 0.65f, 0.1f, 1f);

            var quitBtn = RuntimeUIBuilder.AddButton(dialog.transform, "🏠 返回主菜单", "QuitButton", 18);
            quitBtn.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, -155);
            quitBtn.GetComponent<RectTransform>().sizeDelta = new Vector2(280, 45);
            quitBtn.GetComponent<Image>().color = new Color(0.55f, 0.55f, 0.6f, 1f);

            UIManagerBinder.SetField(script, "resumeButton", resumeBtn);
            UIManagerBinder.SetField(script, "settingsButton", settingsBtn);
            UIManagerBinder.SetField(script, "retryButton", retryBtn);
            UIManagerBinder.SetField(script, "quitButton", quitBtn);

            return script;
        }
    }
}
