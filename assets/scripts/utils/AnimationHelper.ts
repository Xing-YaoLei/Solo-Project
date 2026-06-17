import { _decorator, Component, Node, Vec3, tween, Tween, UIOpacity, Sprite, Color } from 'cc';
import { GameManager } from './GameManager';
import { NodeUtil } from '../utils/NodeUtil';
const { ccclass, property } = _decorator;

@ccclass('AnimationHelper')
export class AnimationHelper {
    static scaleIn(node: Node, duration: number = 0.3, scale: number = 1, callback?: () => void): Tween<Node> {
        const intensity = GameManager.instance.getAnimationMultiplier();
        node.setScale(0, 0, 1);
        return tween(node)
            .to(duration * intensity, { scale: new Vec3(scale, scale, 1) }, { easing: 'backOut' })
            .call(() => callback?.())
            .start();
    }

    static scaleOut(node: Node, duration: number = 0.2, callback?: () => void): Tween<Node> {
        const intensity = GameManager.instance.getAnimationMultiplier();
        return tween(node)
            .to(duration * intensity, { scale: new Vec3(0, 0, 1) }, { easing: 'backIn' })
            .call(() => callback?.())
            .start();
    }

    static fadeIn(node: Node, duration: number = 0.3, callback?: () => void): Tween<UIOpacity> {
        const intensity = GameManager.instance.getAnimationMultiplier();
        let opacity = node.getComponent(UIOpacity);
        if (!opacity) {
            opacity = node.addComponent(UIOpacity);
        }
        opacity.opacity = 0;
        return tween(opacity)
            .to(duration * intensity, { opacity: 255 })
            .call(() => callback?.())
            .start();
    }

    static fadeOut(node: Node, duration: number = 0.3, callback?: () => void): Tween<UIOpacity> {
        const intensity = GameManager.instance.getAnimationMultiplier();
        let opacity = node.getComponent(UIOpacity);
        if (!opacity) {
            opacity = node.addComponent(UIOpacity);
        }
        return tween(opacity)
            .to(duration * intensity, { opacity: 0 })
            .call(() => callback?.())
            .start();
    }

    static shake(node: Node, intensity: number = 10, duration: number = 0.3): Tween<Node> {
        const animIntensity = GameManager.instance.getAnimationMultiplier();
        const actualIntensity = intensity * animIntensity;

        return tween(node)
            .by(0.05, { position: new Vec3(-actualIntensity, 0, 0) })
            .by(0.05, { position: new Vec3(actualIntensity * 2, 0, 0) })
            .by(0.05, { position: new Vec3(-actualIntensity * 2, 0, 0) })
            .by(0.05, { position: new Vec3(actualIntensity, 0, 0) })
            .by(0.05, { position: new Vec3(-actualIntensity / 2, 0, 0) })
            .by(0.05, { position: new Vec3(actualIntensity / 2, 0, 0) })
            .start();
    }

    static pulse(node: Node, minScale: number = 0.9, maxScale: number = 1.1, duration: number = 1): Tween<Node> {
        const intensity = GameManager.instance.getAnimationMultiplier();
        const actualMin = 1 - (1 - minScale) * intensity;
        const actualMax = 1 + (maxScale - 1) * intensity;

        return tween(node)
            .to(duration / 2 * intensity, { scale: new Vec3(actualMax, actualMax, 1) })
            .to(duration / 2 * intensity, { scale: new Vec3(actualMin, actualMin, 1) })
            .union()
            .repeatForever()
            .start();
    }

    static floatUp(node: Node, distance: number = 50, duration: number = 0.5, callback?: () => void): Tween<Node> {
        const intensity = GameManager.instance.getAnimationMultiplier();
        const startY = node.position.y;

        let opacity = node.getComponent(UIOpacity);
        if (!opacity) {
            opacity = node.addComponent(UIOpacity);
        }
        opacity.opacity = 255;

        tween(opacity)
            .delay(duration * 0.5 * intensity)
            .to(duration * 0.5 * intensity, { opacity: 0 })
            .start();

        return tween(node)
            .by(duration * intensity, { position: new Vec3(0, distance * intensity, 0) })
            .call(() => {
                node.setPosition(node.position.x, startY, node.position.z);
                callback?.();
            })
            .start();
    }

    static colorFlash(sprite: Sprite, targetColor: Color, duration: number = 0.2): Tween<Sprite> {
        const intensity = GameManager.instance.getAnimationMultiplier();
        const originalColor = sprite.color.clone();

        return tween(sprite)
            .to(duration * 0.5 * intensity, { color: targetColor })
            .to(duration * 0.5 * intensity, { color: originalColor })
            .start();
    }

    static bounceIn(node: Node, duration: number = 0.5, callback?: () => void): Tween<Node> {
        const intensity = GameManager.instance.getAnimationMultiplier();
        node.setScale(0, 0, 1);

        return tween(node)
            .to(duration * 0.5 * intensity, { scale: new Vec3(1.2, 1.2, 1) }, { easing: 'quadOut' })
            .to(duration * 0.3 * intensity, { scale: new Vec3(0.9, 0.9, 1) }, { easing: 'quadInOut' })
            .to(duration * 0.2 * intensity, { scale: Vec3.ONE }, { easing: 'quadOut' })
            .call(() => callback?.())
            .start();
    }
}
