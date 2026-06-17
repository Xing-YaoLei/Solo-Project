export interface UIComponentState {
    isVisible: boolean;
    isEnabled: boolean;
    isLoading: boolean;
    data?: any;
}

export interface UIEvent {
    type: string;
    source?: string;
    data?: any;
    timestamp: number;
}

export type UIEventHandler = (event: UIEvent) => void;

export abstract class UIComponent<T = any> {
    protected id: string;
    protected state: UIComponentState;
    protected data: T | null = null;
    protected eventHandlers: Map<string, UIEventHandler[]> = new Map();
    protected parent?: UIComponent;
    protected children: UIComponent[] = [];

    constructor(id: string) {
        this.id = id;
        this.state = {
            isVisible: true,
            isEnabled: true,
            isLoading: false
        };
    }

    public getId(): string {
        return this.id;
    }

    public getState(): UIComponentState {
        return { ...this.state };
    }

    public getData(): T | null {
        return this.data;
    }

    public setData(data: T): void {
        this.data = data;
        this.onDataChanged();
        this.render();
    }

    public setVisible(visible: boolean): void {
        if (this.state.isVisible !== visible) {
            this.state.isVisible = visible;
            this.onVisibilityChanged(visible);
        }
    }

    public setEnabled(enabled: boolean): void {
        if (this.state.isEnabled !== enabled) {
            this.state.isEnabled = enabled;
            this.onEnabledChanged(enabled);
        }
    }

    public setLoading(loading: boolean): void {
        if (this.state.isLoading !== loading) {
            this.state.isLoading = loading;
            this.onLoadingChanged(loading);
        }
    }

    public show(): void {
        this.setVisible(true);
    }

    public hide(): void {
        this.setVisible(false);
    }

    public enable(): void {
        this.setEnabled(true);
    }

    public disable(): void {
        this.setEnabled(false);
    }

    public on(eventType: string, handler: UIEventHandler): void {
        if (!this.eventHandlers.has(eventType)) {
            this.eventHandlers.set(eventType, []);
        }
        this.eventHandlers.get(eventType)!.push(handler);
    }

    public off(eventType: string, handler: UIEventHandler): void {
        const handlers = this.eventHandlers.get(eventType);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
        }
    }

    protected emit(eventType: string, data?: any, source?: string): void {
        const event: UIEvent = {
            type: eventType,
            source: source || this.id,
            data,
            timestamp: Date.now()
        };

        const handlers = this.eventHandlers.get(eventType);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(event);
                } catch (error) {
                    console.error(`UIComponent event handler error [${this.id}/${eventType}]:`, error);
                }
            });
        }

        if (this.parent) {
            this.parent.propagateEvent(event);
        }
    }

    protected propagateEvent(event: UIEvent): void {
        const handlers = this.eventHandlers.get(event.type);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(event);
                } catch (error) {
                    console.error(`UIComponent propagate error [${this.id}]:`, error);
                }
            });
        }

        if (this.parent) {
            this.parent.propagateEvent(event);
        }
    }

    public addChild(child: UIComponent): void {
        if (!this.children.includes(child)) {
            child.parent = this;
            this.children.push(child);
        }
    }

    public removeChild(child: UIComponent): void {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            child.parent = undefined;
            this.children.splice(index, 1);
        }
    }

    public getChildren(): UIComponent[] {
        return [...this.children];
    }

    public getParent(): UIComponent | undefined {
        return this.parent;
    }

    protected onDataChanged(): void {}
    protected onVisibilityChanged(visible: boolean): void {}
    protected onEnabledChanged(enabled: boolean): void {}
    protected onLoadingChanged(loading: boolean): void {}

    public abstract render(): void;

    public update(dt: number): void {
        this.children.forEach(child => child.update(dt));
    }

    public destroy(): void {
        this.eventHandlers.clear();
        this.children.forEach(child => child.destroy());
        this.children = [];
        this.data = null;
    }
}

export interface ButtonState {
    isPressed: boolean;
    isHovered: boolean;
    isDisabled: boolean;
}

export interface ButtonConfig {
    id: string;
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    visible?: boolean;
    icon?: string;
    tooltip?: string;
}

export class ButtonComponent extends UIComponent<ButtonConfig> {
    private buttonState: ButtonState = {
        isPressed: false,
        isHovered: false,
        isDisabled: false
    };

    constructor(config: ButtonConfig) {
        super(config.id);
        this.setData(config);
        if (config.disabled) {
            this.disable();
        }
        if (config.visible === false) {
            this.hide();
        }
    }

    public setLabel(label: string): void {
        if (this.data) {
            this.data.label = label;
            this.render();
        }
    }

    public getLabel(): string {
        return this.data?.label || '';
    }

    public click(): void {
        if (!this.state.isEnabled || !this.state.isVisible) return;
        
        this.buttonState.isPressed = true;
        this.emit('click', this.data);
        
        if (this.data?.onClick) {
            this.data.onClick();
        }
        
        setTimeout(() => {
            this.buttonState.isPressed = false;
        }, 100);
    }

    public hover(hovered: boolean): void {
        if (this.buttonState.isHovered !== hovered) {
            this.buttonState.isHovered = hovered;
            this.emit('hover', { hovered });
        }
    }

    protected onEnabledChanged(enabled: boolean): void {
        this.buttonState.isDisabled = !enabled;
        this.render();
    }

    public getButtonState(): ButtonState {
        return { ...this.buttonState };
    }

    public render(): void {}
}

export interface DialogConfig {
    id: string;
    title: string;
    content: string;
    buttons: ButtonConfig[];
    modal?: boolean;
    closable?: boolean;
}

export class DialogComponent extends UIComponent<DialogConfig> {
    public constructor(config: DialogConfig) {
        super(config.id);
        this.setData(config);
        this.state.isVisible = false;
    }

    public open(): void {
        this.setVisible(true);
        this.emit('open');
    }

    public close(): void {
        this.setVisible(false);
        this.emit('close');
    }

    public setTitle(title: string): void {
        if (this.data) {
            this.data.title = title;
            this.render();
        }
    }

    public setContent(content: string): void {
        if (this.data) {
            this.data.content = content;
            this.render();
        }
    }

    public setButtons(buttons: ButtonConfig[]): void {
        if (this.data) {
            this.data.buttons = buttons;
            this.render();
        }
    }

    public render(): void {}
}

export interface ListItemData {
    id: string;
    label: string;
    data?: any;
    selected?: boolean;
    disabled?: boolean;
}

export interface ListConfig {
    id: string;
    items: ListItemData[];
    multiSelect?: boolean;
    onSelect?: (item: ListItemData) => void;
}

export class ListComponent extends UIComponent<ListConfig> {
    private selectedItems: Set<string> = new Set();
    private hoveredItemId?: string;

    constructor(config: ListConfig) {
        super(config.id);
        this.setData(config);
        config.items.forEach(item => {
            if (item.selected) {
                this.selectedItems.add(item.id);
            }
        });
    }

    public selectItem(itemId: string): void {
        if (!this.data) return;

        const item = this.data.items.find(i => i.id === itemId);
        if (!item || item.disabled) return;

        if (this.data.multiSelect) {
            if (this.selectedItems.has(itemId)) {
                this.selectedItems.delete(itemId);
            } else {
                this.selectedItems.add(itemId);
            }
        } else {
            this.selectedItems.clear();
            this.selectedItems.add(itemId);
        }

        this.emit('select', item);
        if (this.data.onSelect) {
            this.data.onSelect(item);
        }
        this.render();
    }

    public deselectItem(itemId: string): void {
        this.selectedItems.delete(itemId);
        this.render();
    }

    public clearSelection(): void {
        this.selectedItems.clear();
        this.emit('clearSelection');
        this.render();
    }

    public getSelectedItems(): ListItemData[] {
        if (!this.data) return [];
        return this.data.items.filter(item => this.selectedItems.has(item.id));
    }

    public getSelectedIds(): string[] {
        return Array.from(this.selectedItems);
    }

    public isSelected(itemId: string): boolean {
        return this.selectedItems.has(itemId);
    }

    public setItems(items: ListItemData[]): void {
        if (this.data) {
            this.data.items = items;
            this.selectedItems.clear();
            items.forEach(item => {
                if (item.selected) {
                    this.selectedItems.add(item.id);
                }
            });
            this.render();
        }
    }

    public addItem(item: ListItemData): void {
        if (this.data) {
            this.data.items.push(item);
            if (item.selected) {
                this.selectedItems.add(item.id);
            }
            this.render();
        }
    }

    public removeItem(itemId: string): void {
        if (this.data) {
            this.data.items = this.data.items.filter(i => i.id !== itemId);
            this.selectedItems.delete(itemId);
            this.render();
        }
    }

    public getItems(): ListItemData[] {
        return this.data?.items || [];
    }

    public render(): void {}
}

export interface ProgressBarConfig {
    id: string;
    value: number;
    maxValue: number;
    label?: string;
    showPercentage?: boolean;
}

export class ProgressBarComponent extends UIComponent<ProgressBarConfig> {
    constructor(config: ProgressBarConfig) {
        super(config.id);
        this.setData(config);
    }

    public setValue(value: number): void {
        if (this.data) {
            this.data.value = Math.max(0, Math.min(value, this.data.maxValue));
            this.emit('valueChanged', { value: this.data.value });
            this.render();
        }
    }

    public getValue(): number {
        return this.data?.value || 0;
    }

    public setMaxValue(maxValue: number): void {
        if (this.data) {
            this.data.maxValue = maxValue;
            this.setValue(this.data.value);
        }
    }

    public getPercentage(): number {
        if (!this.data || this.data.maxValue === 0) return 0;
        return (this.data.value / this.data.maxValue) * 100;
    }

    public increment(delta: number = 1): void {
        this.setValue((this.data?.value || 0) + delta);
    }

    public decrement(delta: number = 1): void {
        this.setValue((this.data?.value || 0) - delta);
    }

    public reset(): void {
        this.setValue(0);
    }

    public render(): void {}
}

export interface NotificationConfig {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    duration?: number;
    onClick?: () => void;
}

export class NotificationComponent extends UIComponent<NotificationConfig> {
    private timer: number | null = null;

    constructor(config: NotificationConfig) {
        super(config.id);
        this.setData(config);
        this.state.isVisible = false;
    }

    public show(): void {
        super.show();
        this.emit('show');
        
        const duration = this.data?.duration || 3000;
        if (duration > 0) {
            this.timer = window.setTimeout(() => {
                this.hide();
            }, duration);
        }
    }

    public hide(): void {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        super.hide();
        this.emit('hide');
    }

    public click(): void {
        if (this.data?.onClick) {
            this.data.onClick();
        }
        this.emit('click');
    }

    public destroy(): void {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        super.destroy();
    }

    public render(): void {}
}
