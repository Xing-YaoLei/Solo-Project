import { Node, UITransform, UIOpacity, Size, Vec3 } from 'cc';

export class NodeUtil {
    static setContentSize(node: Node, width: number, height: number): void {
        let transform = node.getComponent(UITransform);
        if (!transform) {
            transform = node.addComponent(UITransform);
        }
        transform.setContentSize(width, height);
    }

    static getContentSize(node: Node): Size {
        const transform = node.getComponent(UITransform);
        if (!transform) return new Size(0, 0);
        return transform.contentSize.clone();
    }

    static setOpacity(node: Node, opacity: number): void {
        let uiOpacity = node.getComponent(UIOpacity);
        if (!uiOpacity) {
            uiOpacity = node.addComponent(UIOpacity);
        }
        uiOpacity.opacity = opacity;
    }

    static getOpacity(node: Node): number {
        const uiOpacity = node.getComponent(UIOpacity);
        return uiOpacity ? uiOpacity.opacity : 255;
    }

    static setActive(node: Node, active: boolean): void {
        node.active = active;
    }

    static setPosition(node: Node, x: number, y: number, z: number = 0): void {
        node.setPosition(x, y, z);
    }

    static getPosition(node: Node): Vec3 {
        return node.position.clone();
    }

    static setScale(node: Node, x: number, y: number, z: number = 1): void {
        node.setScale(x, y, z);
    }

    static setSiblingIndex(node: Node, index: number): void {
        node.setSiblingIndex(index);
    }
}
