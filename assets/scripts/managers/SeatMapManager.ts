import { _decorator, Component, Node, TiledMap, TiledLayer, Vec3, resources, Prefab, instantiate, Color, Sprite, UITransform, Label } from 'cc';
import { Seat, SeatStatus, TicketType, TICKET_TYPE_COLORS } from '../core/GameTypes';
import { GameManager } from '../core/GameManager';
import { FeedbackManager, VibrationType } from '../core/FeedbackManager';
const { ccclass, property } = _decorator;

export interface SeatClickEvent {
    seat: Seat;
    previousStatus: SeatStatus;
}

@ccclass('SeatMapManager')
export class SeatMapManager extends Component {
    @property(TiledMap)
    tiledMap: TiledMap | null = null;

    @property(Node)
    seatsContainer: Node | null = null;

    @property(Prefab)
    seatNodePrefab: Prefab | null = null;

    @property(Color)
    availableColor: Color = new Color(46, 204, 113, 255);

    @property(Color)
    selectedColor: Color = new Color(241, 196, 15, 255);

    @property(Color)
    soldColor: Color = new Color(127, 140, 141, 255);

    @property(Color)
    lockedColor: Color = new Color(231, 76, 60, 255);

    private seats: Map<string, Seat> = new Map();
    private seatNodes: Map<string, Node> = new Map();
    private mapLoaded: boolean = false;

    onSeatClicked: ((event: SeatClickEvent) => void) | null = null;

    initFromTiled(mapName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.tiledMap) {
                reject(new Error('TiledMap组件未设置'));
                return;
            }

            resources.load(`tiled/${mapName}`, (err) => {
                if (err) {
                    console.warn(`Tiled地图 ${mapName} 未找到，使用模拟数据`, err);
                    this.generateMockSeats();
                    resolve();
                    return;
                }

                this.parseTiledMap();
                this.mapLoaded = true;
                resolve();
            });
        });
    }

    initWithConfig(seatsConfig: Seat[]): void {
        this.seats.clear();
        this.seatNodes.clear();

        for (const seatConfig of seatsConfig) {
            this.seats.set(seatConfig.id, { ...seatConfig });
            this.createSeatNode(seatConfig);
        }

        this.mapLoaded = true;
    }

    generateMockSeats(): void {
        this.seats.clear();
        this.seatNodes.clear();

        const sections = [
            { name: 'VIP_A', rows: 3, cols: 8, ticketType: TicketType.VIP, price: 1280, startX: 100, startY: 100 },
            { name: 'VIP_B', rows: 3, cols: 8, ticketType: TicketType.VIP, price: 1280, startX: 100, startY: 200 },
            { name: 'PREMIUM_A', rows: 5, cols: 12, ticketType: TicketType.PREMIUM, price: 680, startX: 60, startY: 300 },
            { name: 'PREMIUM_B', rows: 5, cols: 12, ticketType: TicketType.PREMIUM, price: 680, startX: 60, startY: 400 },
            { name: 'STANDARD_A', rows: 6, cols: 15, ticketType: TicketType.STANDARD, price: 280, startX: 30, startY: 500 },
            { name: 'STANDARD_B', rows: 6, cols: 15, ticketType: TicketType.STANDARD, price: 280, startX: 30, startY: 600 },
            { name: 'STANDARD_C', rows: 6, cols: 15, ticketType: TicketType.STANDARD, price: 280, startX: 30, startY: 700 },
            { name: 'STANDARD_D', rows: 6, cols: 15, ticketType: TicketType.STANDARD, price: 280, startX: 30, startY: 800 }
        ];

        const seatSize = 32;
        const gap = 8;

        for (const section of sections) {
            for (let row = 0; row < section.rows; row++) {
                for (let col = 0; col < section.cols; col++) {
                    const seatId = `${section.name}_${row}_${col}`;
                    const x = section.startX + col * (seatSize + gap);
                    const y = section.startY + row * (seatSize + gap);

                    const seat: Seat = {
                        id: seatId,
                        row: row,
                        col: col,
                        section: section.name,
                        status: SeatStatus.AVAILABLE,
                        ticketType: section.ticketType,
                        price: section.price,
                        x: x,
                        y: y,
                        width: seatSize,
                        height: seatSize
                    };

                    this.seats.set(seatId, seat);
                    this.createSeatNode(seat);
                }
            }
        }

        this.mapLoaded = true;
    }

    getSeat(id: string): Seat | undefined {
        return this.seats.get(id);
    }

    getAllSeats(): Seat[] {
        return Array.from(this.seats.values());
    }

    getAvailableSeats(ticketType?: TicketType): Seat[] {
        let seats = this.getAllSeats().filter(s => s.status === SeatStatus.AVAILABLE);
        if (ticketType) {
            seats = seats.filter(s => s.ticketType === ticketType);
        }
        return seats;
    }

    getSelectedSeats(): Seat[] {
        return this.getAllSeats().filter(s => s.status === SeatStatus.SELECTED);
    }

    getSeatsBySection(section: string): Seat[] {
        return this.getAllSeats().filter(s => s.section === section);
    }

    selectSeat(id: string): boolean {
        const seat = this.seats.get(id);
        if (!seat || seat.status !== SeatStatus.AVAILABLE) {
            return false;
        }

        const previous = seat.status;
        seat.status = SeatStatus.SELECTED;
        this.updateSeatVisual(id);

        if (this.onSeatClicked) {
            this.onSeatClicked({ seat, previousStatus: previous });
        }

        FeedbackManager.instance.vibrate(VibrationType.LIGHT);
        return true;
    }

    deselectSeat(id: string): boolean {
        const seat = this.seats.get(id);
        if (!seat || seat.status !== SeatStatus.SELECTED) {
            return false;
        }

        const previous = seat.status;
        seat.status = SeatStatus.AVAILABLE;
        this.updateSeatVisual(id);

        if (this.onSeatClicked) {
            this.onSeatClicked({ seat, previousStatus: previous });
        }

        return true;
    }

    toggleSeat(id: string): boolean {
        const seat = this.seats.get(id);
        if (!seat) return false;

        if (seat.status === SeatStatus.AVAILABLE) {
            return this.selectSeat(id);
        } else if (seat.status === SeatStatus.SELECTED) {
            return this.deselectSeat(id);
        }
        return false;
    }

    markSeatsAsSold(seatIds: string[]): void {
        for (const id of seatIds) {
            const seat = this.seats.get(id);
            if (seat && (seat.status === SeatStatus.SELECTED || seat.status === SeatStatus.LOCKED)) {
                seat.status = SeatStatus.SOLD;
                this.updateSeatVisual(id);
            }
        }
    }

    lockSeats(seatIds: string[]): void {
        for (const id of seatIds) {
            const seat = this.seats.get(id);
            if (seat && seat.status === SeatStatus.AVAILABLE) {
                seat.status = SeatStatus.LOCKED;
                this.updateSeatVisual(id);
            }
        }
    }

    unlockSeats(seatIds: string[]): void {
        for (const id of seatIds) {
            const seat = this.seats.get(id);
            if (seat && seat.status === SeatStatus.LOCKED) {
                seat.status = SeatStatus.AVAILABLE;
                this.updateSeatVisual(id);
            }
        }
    }

    clearSelection(): void {
        for (const [id, seat] of this.seats) {
            if (seat.status === SeatStatus.SELECTED) {
                seat.status = SeatStatus.AVAILABLE;
                this.updateSeatVisual(id);
            }
        }
    }

    resetAllSeats(): void {
        for (const [id, seat] of this.seats) {
            seat.status = SeatStatus.AVAILABLE;
            this.updateSeatVisual(id);
        }
    }

    getStatistics(): {
        total: number;
        available: number;
        selected: number;
        sold: number;
        locked: number;
    } {
        let available = 0, selected = 0, sold = 0, locked = 0;
        for (const seat of this.seats.values()) {
            switch (seat.status) {
                case SeatStatus.AVAILABLE: available++; break;
                case SeatStatus.SELECTED: selected++; break;
                case SeatStatus.SOLD: sold++; break;
                case SeatStatus.LOCKED: locked++; break;
            }
        }
        return {
            total: this.seats.size,
            available,
            selected,
            sold,
            locked
        };
    }

    private parseTiledMap(): void {
        if (!this.tiledMap) return;

        const layers = this.tiledMap.getLayers();
        const tileSize = this.tiledMap.getTileSize();
        const mapSize = this.tiledMap.getMapSize();

        for (let layerIdx = 0; layerIdx < layers.length; layerIdx++) {
            const layer = layers[layerIdx] as TiledLayer;
            const layerName = layer.name;

            for (let y = 0; y < mapSize.height; y++) {
                for (let x = 0; x < mapSize.width; x++) {
                    const tile = layer.getTiledTileAt(x, y, true);
                    if (tile && tile.grid != 0) {
                        const seatId = `${layerName}_${y}_${x}`;
                        const ticketType = this.inferTicketTypeFromLayer(layerName);

                        const seat: Seat = {
                            id: seatId,
                            row: y,
                            col: x,
                            section: layerName,
                            status: SeatStatus.AVAILABLE,
                            ticketType: ticketType,
                            price: this.getBasePrice(ticketType),
                            x: x * tileSize.width,
                            y: (mapSize.height - 1 - y) * tileSize.height,
                            width: tileSize.width,
                            height: tileSize.height
                        };

                        this.seats.set(seatId, seat);
                        this.createSeatNode(seat);
                    }
                }
            }
        }
    }

    private inferTicketTypeFromLayer(layerName: string): TicketType {
        const upper = layerName.toUpperCase();
        if (upper.includes('VIP')) return TicketType.VIP;
        if (upper.includes('PREMIUM')) return TicketType.PREMIUM;
        if (upper.includes('STUDENT')) return TicketType.STUDENT;
        if (upper.includes('GROUP')) return TicketType.GROUP;
        return TicketType.STANDARD;
    }

    private getBasePrice(type: TicketType): number {
        const prices: Record<TicketType, number> = {
            [TicketType.VIP]: 1280,
            [TicketType.PREMIUM]: 680,
            [TicketType.STANDARD]: 280,
            [TicketType.STUDENT]: 180,
            [TicketType.GROUP]: 220
        };
        return prices[type];
    }

    private createSeatNode(seat: Seat): void {
        let node: Node;

        if (this.seatNodePrefab) {
            node = instantiate(this.seatNodePrefab);
        } else {
            node = new Node(`Seat_${seat.id}`);
            const sprite = node.addComponent(Sprite);
            const ui = node.addComponent(UITransform);
            ui.setContentSize(seat.width, seat.height);

            const labelNode = new Node('Label');
            labelNode.addComponent(UITransform).setContentSize(seat.width, seat.height);
            const label = labelNode.addComponent(Label);
            label.string = `${seat.row + 1}-${seat.col + 1}`;
            label.fontSize = 10;
            label.lineHeight = seat.height;
            node.addChild(labelNode);
        }

        node.setPosition(seat.x + seat.width / 2, seat.y + seat.height / 2);

        node.on(Node.EventType.TOUCH_END, () => {
            this.toggleSeat(seat.id);
        });

        if (this.seatsContainer) {
            this.seatsContainer.addChild(node);
        } else {
            this.node.addChild(node);
        }

        this.seatNodes.set(seat.id, node);
        this.updateSeatVisual(seat.id);
    }

    private updateSeatVisual(id: string): void {
        const seat = this.seats.get(id);
        const node = this.seatNodes.get(id);
        if (!seat || !node) return;

        const sprite = node.getComponent(Sprite);
        if (sprite) {
            let color = this.availableColor;
            switch (seat.status) {
                case SeatStatus.AVAILABLE:
                    color = new Color().fromHEX(TICKET_TYPE_COLORS[seat.ticketType]);
                    break;
                case SeatStatus.SELECTED:
                    color = this.selectedColor;
                    break;
                case SeatStatus.SOLD:
                    color = this.soldColor;
                    break;
                case SeatStatus.LOCKED:
                    color = this.lockedColor;
                    break;
            }
            sprite.color = color;
        }
    }
}
