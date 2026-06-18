using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UsedCarGame.Core;
using UsedCarGame.UI;

namespace UsedCarGame.Systems
{
    public class RuntimeUIBuilder : MonoBehaviour
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void OnAfterSceneLoad()
        {
            var canvas = Object.FindObjectOfType<Canvas>();
            if (canvas != null && UIManager.Instance != null)
            {
                var panels = UIManager.Instance.GetComponentsInChildren<UIPanelBase>();
                if (panels != null && panels.Length > 0) return;
            }

            StartCoroutineInternal(BuildWhenReady());
        }

        private static void StartCoroutineInternal(IEnumerator routine)
        {
            var go = new GameObject("[RuntimeUIBuilder]");
            DontDestroyOnLoad(go);
            var runner = go.AddComponent<RuntimeUIBuilder>();
            runner.StartCoroutine(routine);
        }

        private static IEnumerator BuildWhenReady()
        {
            while (GameManager.Instance == null || !ServiceLocator.IsInitialized)
            {
                yield return null;
            }
            yield return null;
            BuildAll();
        }

        public static void BuildAll()
        {
            var canvasGo = new GameObject("GameCanvas");
            DontDestroyOnLoad(canvasGo);
            var canvas = canvasGo.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 10;

            var scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1280, 720);
            scaler.matchWidthOrHeight = 0.5f;

            canvasGo.AddComponent<GraphicRaycaster>();

            if (Object.FindObjectOfType<UnityEngine.EventSystems.EventSystem>() == null)
            {
                var es = new GameObject("EventSystem");
                DontDestroyOnLoad(es);
                es.AddComponent<UnityEngine.EventSystems.EventSystem>();
                es.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
            }

            var uiMgr = UIManager.Instance;
            if (uiMgr == null)
            {
                uiMgr = GameManager.Instance.gameObject.AddComponent<UIManager>();
            }

            var panelRoot = new GameObject("Panels");
            panelRoot.transform.SetParent(canvasGo.transform, false);

            var mm = MainMenuBuilder.Build(panelRoot.transform);
            var ls = LevelSelectBuilder.Build(panelRoot.transform);
            var gp = GameplayBuilder.Build(panelRoot.transform);
            var sp = SettlementBuilder.Build(panelRoot.transform);
            var rp = ReviewBuilder.Build(panelRoot.transform);
            var setp = SettingsBuilder.Build(panelRoot.transform);
            var pp = PauseBuilder.Build(panelRoot.transform);

            UIManagerBinder.Bind(uiMgr, mm, ls, gp, sp, rp, setp, pp);

            Debug.Log("[RuntimeUIBuilder] UI built successfully.");
        }

        public static GameObject CreatePanel(Transform parent, string name)
        {
            var panel = new GameObject(name);
            panel.transform.SetParent(parent, false);

            var rt = panel.AddComponent<RectTransform>();
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;

            var bg = panel.AddComponent<Image>();
            bg.color = new Color(0.95f, 0.95f, 0.97f, 1f);

            return panel;
        }

        public static TMP_Text AddText(Transform parent, string text, int fontSize = 24,
            TextAlignmentOptions alignment = TextAlignmentOptions.Center,
            string name = "Text")
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var t = go.AddComponent<TextMeshProUGUI>();
            t.text = text;
            t.fontSize = fontSize;
            t.alignment = alignment;
            t.color = new Color(0.15f, 0.15f, 0.2f, 1f);
            var rt = t.rectTransform;
            rt.anchorMin = new Vector2(0, 0.5f);
            rt.anchorMax = new Vector2(1, 0.5f);
            rt.sizeDelta = new Vector2(0, fontSize * 1.5f);
            return t;
        }

        public static Button AddButton(Transform parent, string label, string name = "Button",
            int fontSize = 20)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);

            var img = go.AddComponent<Image>();
            img.color = new Color(0.2f, 0.5f, 0.9f, 1f);

            var btn = go.AddComponent<Button>();
            var colors = btn.colors;
            colors.normalColor = new Color(0.2f, 0.5f, 0.9f, 1f);
            colors.highlightedColor = new Color(0.3f, 0.6f, 1f, 1f);
            colors.pressedColor = new Color(0.15f, 0.4f, 0.75f, 1f);
            colors.disabledColor = new Color(0.6f, 0.6f, 0.6f, 1f);
            btn.colors = colors;

            var labelGo = new GameObject("Label");
            labelGo.transform.SetParent(go.transform, false);
            var labelText = labelGo.AddComponent<TextMeshProUGUI>();
            labelText.text = label;
            labelText.fontSize = fontSize;
            labelText.alignment = TextAlignmentOptions.Center;
            labelText.color = Color.white;

            var labelRt = labelText.rectTransform;
            labelRt.anchorMin = Vector2.zero;
            labelRt.anchorMax = Vector2.one;
            labelRt.offsetMin = Vector2.zero;
            labelRt.offsetMax = Vector2.zero;

            var rt = go.GetComponent<RectTransform>();
            rt.sizeDelta = new Vector2(200, 60);

            return btn;
        }

        public static Toggle AddToggle(Transform parent, string label, string name = "Toggle")
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            rt.sizeDelta = new Vector2(240, 40);

            var toggle = go.AddComponent<Toggle>();
            toggle.isOn = true;

            var bg = new GameObject("Background");
            bg.transform.SetParent(go.transform, false);
            var bgImg = bg.AddComponent<Image>();
            bgImg.color = Color.white;
            var bgRt = bgImg.rectTransform;
            bgRt.anchorMin = new Vector2(0, 0.5f);
            bgRt.anchorMax = new Vector2(0, 0.5f);
            bgRt.anchoredPosition = new Vector2(20, 0);
            bgRt.sizeDelta = new Vector2(22, 22);

            var check = new GameObject("Checkmark");
            check.transform.SetParent(bg.transform, false);
            var checkImg = check.AddComponent<Image>();
            checkImg.color = new Color(0.2f, 0.5f, 0.9f, 1f);
            var checkRt = checkImg.rectTransform;
            checkRt.anchorMin = Vector2.zero;
            checkRt.anchorMax = Vector2.one;
            checkRt.offsetMin = new Vector2(4, 4);
            checkRt.offsetMax = new Vector2(-4, -4);

            toggle.graphic = checkImg;

            var labelGo = new GameObject("Label");
            labelGo.transform.SetParent(go.transform, false);
            var labelText = labelGo.AddComponent<TextMeshProUGUI>();
            labelText.text = label;
            labelText.fontSize = 18;
            labelText.alignment = TextAlignmentOptions.Left;
            var labelRt = labelText.rectTransform;
            labelRt.anchorMin = new Vector2(0, 0);
            labelRt.anchorMax = new Vector2(1, 1);
            labelRt.offsetMin = new Vector2(52, 0);
            labelRt.offsetMax = Vector2.zero;

            return toggle;
        }

        public static Slider AddSlider(Transform parent, string label, string name = "Slider")
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            rt.sizeDelta = new Vector2(280, 50);

            var labelGo = new GameObject("Label");
            labelGo.transform.SetParent(go.transform, false);
            var labelText = labelGo.AddComponent<TextMeshProUGUI>();
            labelText.text = label;
            labelText.fontSize = 16;
            labelText.alignment = TextAlignmentOptions.Left;
            var labelRt = labelText.rectTransform;
            labelRt.anchorMin = new Vector2(0, 0.6f);
            labelRt.anchorMax = new Vector2(0.7f, 1);
            labelRt.offsetMin = Vector2.zero;
            labelRt.offsetMax = Vector2.zero;

            var valueGo = new GameObject("ValueText");
            valueGo.transform.SetParent(go.transform, false);
            var valueText = valueGo.AddComponent<TextMeshProUGUI>();
            valueText.name = "SfxVolumeValueText";
            valueText.text = "80%";
            valueText.fontSize = 14;
            valueText.alignment = TextAlignmentOptions.Right;
            var valueRt = valueText.rectTransform;
            valueRt.anchorMin = new Vector2(0.7f, 0.6f);
            valueRt.anchorMax = new Vector2(1, 1);
            valueRt.offsetMin = Vector2.zero;
            valueRt.offsetMax = Vector2.zero;

            var sliderGo = new GameObject("Slider");
            sliderGo.transform.SetParent(go.transform, false);
            var sliderRt = sliderGo.AddComponent<RectTransform>();
            sliderRt.anchorMin = new Vector2(0, 0);
            sliderRt.anchorMax = new Vector2(1, 0.5f);
            sliderRt.offsetMin = Vector2.zero;
            sliderRt.offsetMax = Vector2.zero;

            var slider = sliderGo.AddComponent<Slider>();
            slider.minValue = 0f;
            slider.maxValue = 1f;
            slider.value = 0.8f;

            var bg = new GameObject("Background");
            bg.transform.SetParent(sliderGo.transform, false);
            var bgImg = bg.AddComponent<Image>();
            bgImg.color = new Color(0.8f, 0.8f, 0.85f, 1f);
            var bgRt = bgImg.rectTransform;
            bgRt.anchorMin = new Vector2(0, 0.35f);
            bgRt.anchorMax = new Vector2(1, 0.65f);
            bgRt.offsetMin = Vector2.zero;
            bgRt.offsetMax = Vector2.zero;

            var fillGo = new GameObject("Fill");
            fillGo.transform.SetParent(sliderGo.transform, false);
            var fillImg = fillGo.AddComponent<Image>();
            fillImg.color = new Color(0.2f, 0.5f, 0.9f, 1f);
            var fillRt = fillImg.rectTransform;
            fillRt.anchorMin = new Vector2(0, 0.35f);
            fillRt.anchorMax = new Vector2(0, 0.65f);
            fillRt.sizeDelta = new Vector2(0, 0);

            var handleGo = new GameObject("Handle");
            handleGo.transform.SetParent(sliderGo.transform, false);
            var handleImg = handleGo.AddComponent<Image>();
            handleImg.color = new Color(0.15f, 0.4f, 0.75f, 1f);
            var handleRt = handleImg.rectTransform;
            handleRt.anchorMin = new Vector2(0, 0.15f);
            handleRt.anchorMax = new Vector2(0, 0.85f);
            handleRt.sizeDelta = new Vector2(18, 0);

            slider.fillRect = fillRt;
            slider.handleRect = handleRt;
            slider.targetGraphic = handleImg;
            slider.direction = Slider.Direction.LeftToRight;

            return slider;
        }
    }
}
