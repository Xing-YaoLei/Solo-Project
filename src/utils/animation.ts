import { useSettingsStore } from '@/store/useSettingsStore';

export const withAnimation = <T extends (...args: any[]) => any>(
  fn: T,
  shouldAnimate: boolean = true
): ((...args: Parameters<T>) => ReturnType<T> | undefined) => {
  return (...args: Parameters<T>): ReturnType<T> | undefined => {
    const settings = useSettingsStore.getState();
    if (!settings.animationEnabled && shouldAnimate) {
      return undefined;
    }
    return fn(...args);
  };
};

export const animationUtils = {
  enabled: (): boolean => {
    return useSettingsStore.getState().animationEnabled;
  },
  tween: (
    target: any,
    props: Record<string, number>,
    duration: number = 300,
    ease: string = 'Power2.out'
  ): any => {
    if (!animationUtils.enabled()) {
      Object.assign(target, props);
      return { isComplete: true };
    }
    return { target, props, duration, ease, isComplete: false };
  },
  fadeIn: (element: HTMLElement, duration: number = 300): Promise<void> => {
    return new Promise((resolve) => {
      if (!animationUtils.enabled()) {
        element.style.opacity = '1';
        resolve();
        return;
      }
      element.style.opacity = '0';
      element.style.transition = `opacity ${duration}ms ease-out`;
      requestAnimationFrame(() => {
        element.style.opacity = '1';
        setTimeout(resolve, duration);
      });
    });
  },
  fadeOut: (element: HTMLElement, duration: number = 300): Promise<void> => {
    return new Promise((resolve) => {
      if (!animationUtils.enabled()) {
        element.style.opacity = '0';
        resolve();
        return;
      }
      element.style.transition = `opacity ${duration}ms ease-out`;
      element.style.opacity = '0';
      setTimeout(resolve, duration);
    });
  },
  slideIn: (element: HTMLElement, direction: 'left' | 'right' | 'up' | 'down' = 'up', duration: number = 300): Promise<void> => {
    return new Promise((resolve) => {
      if (!animationUtils.enabled()) {
        element.style.transform = 'translate(0, 0)';
        element.style.opacity = '1';
        resolve();
        return;
      }
      const transforms: Record<string, string> = {
        left: 'translateX(-20px)',
        right: 'translateX(20px)',
        up: 'translateY(20px)',
        down: 'translateY(-20px)',
      };
      element.style.opacity = '0';
      element.style.transform = transforms[direction];
      element.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`;
      requestAnimationFrame(() => {
        element.style.opacity = '1';
        element.style.transform = 'translate(0, 0)';
        setTimeout(resolve, duration);
      });
    });
  },
  shake: (element: HTMLElement, duration: number = 500): Promise<void> => {
    return new Promise((resolve) => {
      if (!animationUtils.enabled()) {
        resolve();
        return;
      }
      element.classList.add('animate-shake');
      setTimeout(() => {
        element.classList.remove('animate-shake');
        resolve();
      }, duration);
    });
  },
  pulse: (element: HTMLElement, times: number = 3, interval: number = 200): Promise<void> => {
    return new Promise((resolve) => {
      if (!animationUtils.enabled()) {
        resolve();
        return;
      }
      let count = 0;
      const pulse = () => {
        element.style.transform = 'scale(1.1)';
        setTimeout(() => {
          element.style.transform = 'scale(1)';
          count++;
          if (count < times) {
            setTimeout(pulse, interval);
          } else {
            resolve();
          }
        }, interval);
      };
      pulse();
    });
  },
  scorePopup: (
    container: HTMLElement,
    score: number,
    x: number,
    y: number,
    isPositive: boolean = true
  ): void => {
    if (!animationUtils.enabled()) return;
    const popup = document.createElement('div');
    popup.className = `absolute font-bold text-lg pointer-events-none animate-float-up ${
      isPositive ? 'text-health-500' : 'text-alert-500'
    }`;
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    popup.textContent = isPositive ? `+${score}` : `-${score}`;
    container.appendChild(popup);
    setTimeout(() => popup.remove(), 800);
  },
};
