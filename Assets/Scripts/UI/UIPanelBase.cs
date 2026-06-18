using UnityEngine;
using UsedCarGame.Core;

namespace UsedCarGame.UI
{
    public abstract class UIPanelBase : MonoBehaviour
    {
        [SerializeField] protected GameObject panelRoot;

        public virtual void Initialize() { }

        public virtual void Show()
        {
            if (panelRoot != null)
            {
                panelRoot.SetActive(true);
            }
            OnShow();
        }

        public virtual void Hide()
        {
            if (panelRoot != null)
            {
                panelRoot.SetActive(false);
            }
            OnHide();
        }

        protected virtual void OnShow() { }
        protected virtual void OnHide() { }

        protected virtual void Start()
        {
            if (panelRoot == null)
            {
                panelRoot = gameObject;
            }
            Initialize();
        }
    }
}
