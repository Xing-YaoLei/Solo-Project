import { _decorator, Component, Node, Label, Input, EventKeyboard, KeyCode, EventTouch, Vec3, UITransform, Color, input, Graphics } from 'cc';
import { Position, Order, WrongStep } from '../types/GameTypes';
import { MAP_LOCATIONS } from '../config/GameConfig';

const { ccclass, property } = _decorator;

@ccclass('AddressInputController')
export class AddressInputController extends Component {
    @property(Node)
    mapContainer: Node | null = null;

    @property(Label)
    pickupAddressLabel: Label | null = null;

    @property(Label)
    deliveryAddressLabel: Label | null = null;

    @property(Node)
    addressList: Node | null = null;

    @property(Node)
    searchInput: Node | null = null;

    private currentOrder: Order | null = null;
    private inputMode: 'pickup' | 'delivery' = 'pickup';
    private selectedIndex: number = 0;
    private searchQuery: string = '';
    private filteredLocations: Position[] = [];
    private touchStartPos: Vec3 = new Vec3();
    private onAddressSelectedCallback: ((address: Position, type: 'pickup' | 'delivery') => void) | null = null;
    private onWrongStepCallback: ((wrongStep: Omit<WrongStep, 'time'>) => void) | null = null;
    private isBound: boolean = false;
    private locationMarkers: Node[] = [];

    onLoad() {
        this.filteredLocations = [...MAP_LOCATIONS];
        this.bindIfReady();
    }

    onEnable() {
        this.bindIfReady();
    }

    onDisable() {
        this.unbind();
    }

    onDestroy() {
        this.unbind();
    }

    private bindIfReady() {
        if (this.isBound) return;
        if (input) {
            input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        }
        if (this.mapContainer) {
            this.mapContainer.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
            this.mapContainer.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
            this.renderLocationMarkers();
        }
        this.isBound = true;
    }

    private unbind() {
        if (input) {
            input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        }
        if (this.mapContainer) {
            this.mapContainer.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
            this.mapContainer.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        }
        this.clearLocationMarkers();
        this.isBound = false;
    }

    setMapContainer(container: Node) {
        if (this.mapContainer && this.mapContainer !== container) {
            this.mapContainer.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
            this.mapContainer.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        }
        this.mapContainer = container;
        if (this.isBound) {
            container.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
            container.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
            this.clearLocationMarkers();
            this.renderLocationMarkers();
        }
    }

    setAddressList(list: Node) {
        this.addressList = list;
        this.updateAddressList();
        this.highlightSelectedLocation();
    }

    setPickupLabel(label: Label) {
        this.pickupAddressLabel = label;
        this.updateModeDisplay();
    }

    setDeliveryLabel(label: Label) {
        this.deliveryAddressLabel = label;
        this.updateModeDisplay();
    }

    private renderLocationMarkers() {
        if (!this.mapContainer) return;
        this.clearLocationMarkers();
        MAP_LOCATIONS.forEach((loc, idx) => {
            const marker = new Node(`Marker_${idx}`);
            const t = marker.addComponent(UITransform);
            t.setContentSize(20, 20);
            const g = marker.addComponent(Graphics);
            g.fillColor = new Color(80, 160, 255, 200);
            g.circle(0, 0, 8);
            g.fill();
            g.strokeColor = new Color(255, 255, 255, 180);
            g.lineWidth = 2;
            g.circle(0, 0, 8);
            g.stroke();
            const labelNode = new Node(`Lbl_${idx}`);
            const lbl = labelNode.addComponent(Label);
            lbl.string = `${idx + 1}.${loc.name}`;
            lbl.fontSize = 11;
            lbl.color = new Color(220, 220, 255);
            labelNode.setPosition(0, -18, 0);
            marker.addChild(labelNode);
            marker.setPosition(loc.x, loc.y, 0);
            this.mapContainer.addChild(marker);
            this.locationMarkers.push(marker);
        });
    }

    private clearLocationMarkers() {
        this.locationMarkers.forEach(m => m.destroy());
        this.locationMarkers = [];
    }

    setCallbacks(
        onAddressSelected: (address: Position, type: 'pickup' | 'delivery') => void,
        onWrongStep: (wrongStep: Omit<WrongStep, 'time'>) => void
    ) {
        this.onAddressSelectedCallback = onAddressSelected;
        this.onWrongStepCallback = onWrongStep;
    }

    startAddressInput(order: Order, mode: 'pickup' | 'delivery') {
        this.currentOrder = order;
        this.inputMode = mode;
        this.selectedIndex = 0;
        this.searchQuery = '';
        this.filteredLocations = [...MAP_LOCATIONS];
        this.updateAddressList();
        this.highlightSelectedLocation();
        this.updateModeDisplay();
        this.bindIfReady();
    }

    private onKeyDown(event: EventKeyboard) {
        if (!this.currentOrder) return;

        const key = event.keyCode;

        if (key === KeyCode.ARROW_UP) {
            event.propagationStopped = true;
            this.moveSelection(-1);
        } else if (key === KeyCode.ARROW_DOWN) {
            event.propagationStopped = true;
            this.moveSelection(1);
        } else if (key === KeyCode.ENTER || key === KeyCode.SPACE) {
            event.propagationStopped = true;
            this.confirmSelection();
        } else if (key === KeyCode.ESCAPE) {
            event.propagationStopped = true;
            this.cancelInput();
        } else if (key >= KeyCode.DIGIT_1 && key <= KeyCode.DIGIT_9) {
            event.propagationStopped = true;
            const index = key - KeyCode.DIGIT_1;
            if (index < this.filteredLocations.length) {
                this.selectedIndex = index;
                this.confirmSelection();
            }
        } else if (key === KeyCode.BACKSPACE) {
            event.propagationStopped = true;
            this.searchQuery = this.searchQuery.slice(0, -1);
            this.updateFilteredLocations();
        } else if (key === KeyCode.TAB) {
            event.propagationStopped = true;
            this.inputMode = this.inputMode === 'pickup' ? 'delivery' : 'pickup';
            this.updateModeDisplay();
        } else {
            const char = this.getKeyChar(key);
            if (char) {
                event.propagationStopped = true;
                this.searchQuery += char.toLowerCase();
                this.updateFilteredLocations();
            }
        }
    }

    private getKeyChar(keyCode: number): string | null {
        if (keyCode >= KeyCode.KEY_A && keyCode <= KeyCode.KEY_Z) {
            return String.fromCharCode(keyCode);
        }
        return null;
    }

    private moveSelection(direction: number) {
        const newIndex = this.selectedIndex + direction;
        if (newIndex >= 0 && newIndex < this.filteredLocations.length) {
            this.selectedIndex = newIndex;
            this.highlightSelectedLocation();
        }
    }

    private updateFilteredLocations() {
        if (!this.searchQuery) {
            this.filteredLocations = [...MAP_LOCATIONS];
        } else {
            this.filteredLocations = MAP_LOCATIONS.filter(
                loc => loc.name.toLowerCase().includes(this.searchQuery) ||
                       loc.address.toLowerCase().includes(this.searchQuery)
            );
        }
        this.selectedIndex = Math.min(this.selectedIndex, this.filteredLocations.length - 1);
        if (this.selectedIndex < 0) this.selectedIndex = 0;
        this.updateAddressList();
        this.highlightSelectedLocation();
    }

    private onTouchStart(event: EventTouch) {
        if (!this.mapContainer || !this.currentOrder) return;
        event.propagationStopped = true;
        const loc = event.getUILocation();
        this.touchStartPos.set(loc.x, loc.y, 0);
    }

    private onTouchEnd(event: EventTouch) {
        if (!this.mapContainer || !this.currentOrder) return;
        event.propagationStopped = true;

        const touchPos = event.getUILocation();
        const worldPos = new Vec3(touchPos.x, touchPos.y, 0);
        const transform = this.mapContainer.getComponent(UITransform);
        const localPos = transform ? transform.convertToNodeSpaceAR(worldPos) : null;

        if (!localPos) return;

        const clickedLocation = this.findNearestLocation(localPos.x, localPos.y);
        if (clickedLocation) {
            this.selectLocation(clickedLocation);
        }
    }

    private findNearestLocation(x: number, y: number): Position | null {
        let nearest: Position | null = null;
        let minDistance = 60;

        for (const loc of MAP_LOCATIONS) {
            const dx = loc.x - x;
            const dy = loc.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = loc;
            }
        }

        return nearest;
    }

    private selectLocation(location: Position) {
        if (!this.currentOrder) return;

        const expectedLocation = this.inputMode === 'pickup' ?
            this.currentOrder.pickup : this.currentOrder.delivery;

        const isCorrect = location.name === expectedLocation.name;

        if (!isCorrect && this.onWrongStepCallback) {
            this.onWrongStepCallback({
                type: 'address',
                description: `选错了${this.inputMode === 'pickup' ? '取货' : '送货'}地址: 选了${location.name}，应为${expectedLocation.name}`,
                correctAction: `选择正确的${this.inputMode === 'pickup' ? '取货' : '送货'}地址: ${expectedLocation.name}`,
                impact: { cost: 5, delay: 30, satisfaction: -10 },
                orderId: this.currentOrder.id,
            });
        }

        if (this.onAddressSelectedCallback) {
            this.onAddressSelectedCallback(location, this.inputMode);
        }

        if (isCorrect && this.inputMode === 'pickup') {
            this.inputMode = 'delivery';
            this.updateModeDisplay();
        } else if (isCorrect) {
            this.finishAddressInput();
        }
    }

    private confirmSelection() {
        if (this.filteredLocations.length > 0 && this.selectedIndex >= 0) {
            this.selectLocation(this.filteredLocations[this.selectedIndex]);
        }
    }

    private cancelInput() {
        this.currentOrder = null;
        this.searchQuery = '';
        this.filteredLocations = [...MAP_LOCATIONS];
        this.updateAddressList();
    }

    private finishAddressInput() {
        this.currentOrder = null;
        this.searchQuery = '';
        this.filteredLocations = [...MAP_LOCATIONS];
        this.updateAddressList();
    }

    private highlightSelectedLocation() {
        if (!this.addressList) return;

        const children = this.addressList.children;
        children.forEach((child, index) => {
            const label = child.getComponent(Label);
            if (label) {
                label.color = index === this.selectedIndex ?
                    new Color(255, 200, 0) : new Color(255, 255, 255);
            }
        });
    }

    private updateAddressList() {
        if (!this.addressList) return;

        this.addressList.removeAllChildren();

        this.filteredLocations.forEach((loc, index) => {
            const node = new Node(`Address_${index}`);
            const t = node.addComponent(UITransform);
            t.setContentSize(380, 28);
            const label = node.addComponent(Label);
            label.string = `${index + 1}. ${loc.name} - ${loc.address}`;
            label.fontSize = 14;
            label.lineHeight = 20;
            label.horizontalAlign = Label.HorizontalAlign.LEFT;
            label.overflow = Label.Overflow.CLAMP;
            label.color = index === this.selectedIndex ?
                new Color(255, 200, 0) : new Color(255, 255, 255);

            node.on(Node.EventType.TOUCH_END, () => {
                if (!this.currentOrder) return;
                this.selectedIndex = index;
                this.highlightSelectedLocation();
                this.confirmSelection();
            }, this);

            node.setPosition(0, -(index * 24), 0);
            this.addressList!.addChild(node);
        });
    }

    private updateModeDisplay() {
        if (this.pickupAddressLabel) {
            this.pickupAddressLabel.node.active = this.inputMode === 'pickup';
        }
        if (this.deliveryAddressLabel) {
            this.deliveryAddressLabel.node.active = this.inputMode === 'delivery';
        }
    }

    isWaitingForInput(): boolean {
        return this.currentOrder !== null;
    }

    getInputMode(): 'pickup' | 'delivery' {
        return this.inputMode;
    }

    getSearchQuery(): string {
        return this.searchQuery;
    }

    getSelectedLocation(): Position | null {
        return this.filteredLocations[this.selectedIndex] || null;
    }
}
