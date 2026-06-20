import { _decorator, Component, Node, Label, Sprite, ScrollView, Prefab, instantiate, Color, Button } from 'cc';
import { Reservation } from '../models';
import { ReservationItem } from './ReservationItem';
import { GameManager } from '../core/GameManager';
const { ccclass, property } = _decorator;

@ccclass('ReservationList')
export class ReservationList extends Component {
    @property(ScrollView)
    scrollView: ScrollView | null = null;

    @property(Node)
    contentNode: Node | null = null;

    @property(Prefab)
    reservationItemPrefab: Prefab | null = null;

    @property(Label)
    pendingCountLabel: Label | null = null;

    @property(Label)
    totalCountLabel: Label | null = null;

    private reservationItems: ReservationItem[] = [];
    private selectedIndex: number = -1;

    private onItemSelectedCallback: ((reservation: Reservation) => void) | null = null;

    start() {
        this.refreshList();
    }

    public refreshList(): void {
        if (!this.contentNode || !this.reservationItemPrefab) return;

        this.clearItems();

        const gameManager = GameManager.instance;
        if (!gameManager) return;

        const reservations = gameManager.getPendingTasks();
        const allReservations = gameManager.getReservations();

        for (let i = 0; i < reservations.length; i++) {
            const reservation = reservations[i];
            const spot = gameManager.getScenicSpot(reservation.scenicSpotId);
            const spotName = spot?.name || '未知景点';

            const node = instantiate(this.reservationItemPrefab);
            this.contentNode.addChild(node);

            const item = node.getComponent(ReservationItem);
            if (item) {
                item.setData(reservation, spotName);
                this.reservationItems.push(item);

                const index = i;
                const button = node.getComponent(Button) || node.addComponent(Button);
                node.on(Button.EventType.CLICK, () => {
                    this.onItemClick(index);
                }, this);
            }
        }

        if (this.pendingCountLabel) {
            this.pendingCountLabel.string = `${reservations.length}`;
        }
        if (this.totalCountLabel) {
            this.totalCountLabel.string = `/${allReservations.length}`;
        }
    }

    private clearItems(): void {
        if (!this.contentNode) return;
        this.contentNode.removeAllChildren();
        this.reservationItems = [];
        this.selectedIndex = -1;
    }

    private onItemClick(index: number): void {
        if (index < 0 || index >= this.reservationItems.length) return;

        const item = this.reservationItems[index];
        const reservation = item.getReservation();
        if (!reservation) return;

        if (!item.isPending()) return;

        for (let i = 0; i < this.reservationItems.length; i++) {
            this.reservationItems[i].setSelected(i === index);
        }
        this.selectedIndex = index;

        if (this.onItemSelectedCallback) {
            this.onItemSelectedCallback(reservation);
        }

        const gameManager = GameManager.instance;
        if (gameManager) {
            gameManager.setSelectedReservation(reservation);
        }
    }

    public setOnItemSelectedCallback(callback: (reservation: Reservation) => void): void {
        this.onItemSelectedCallback = callback;
    }

    public getSelectedReservation(): Reservation | null {
        if (this.selectedIndex < 0 || this.selectedIndex >= this.reservationItems.length) {
            return null;
        }
        return this.reservationItems[this.selectedIndex].getReservation();
    }

    public selectFirstItem(): void {
        if (this.reservationItems.length > 0) {
            this.onItemClick(0);
        }
    }
}
