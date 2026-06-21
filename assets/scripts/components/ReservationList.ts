import { _decorator, Component, Node, Label, ScrollView, Prefab, instantiate, Color, Button, Sprite, UITransform } from 'cc';
import { Reservation } from '../models';
import { ReservationItem } from './ReservationItem';
import { GameManager } from '../core/GameManager';
import { ArrivalStatus, ReservationStatus } from '../models/GameEnums';
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
        if (!this.contentNode) return;

        this.clearItems();

        const gameManager = GameManager.instance;
        if (!gameManager) return;

        const reservations = gameManager.getPendingTasks();
        const allReservations = gameManager.getReservations();

        for (let i = 0; i < reservations.length; i++) {
            const reservation = reservations[i];
            const spot = gameManager.getScenicSpot(reservation.scenicSpotId);
            const spotName = spot?.name || '未知景点';

            let node: Node;
            let item: ReservationItem | null;

            if (this.reservationItemPrefab) {
                node = instantiate(this.reservationItemPrefab);
                item = node.getComponent(ReservationItem);
            } else {
                node = this.createItemNode(reservation, spotName);
                item = node.getComponent(ReservationItem);
            }

            this.contentNode.addChild(node);

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

    private createItemNode(reservation: Reservation, spotName: string): Node {
        const node = new Node('ReservationItem');
        const ut = node.addComponent(UITransform);
        ut.setContentSize(280, 60);

        const bg = node.addComponent(Sprite);
        bg.type = Sprite.Type.SIMPLE;
        bg.sizeMode = Sprite.SizeMode.CUSTOM;
        bg.color = Color.WHITE;

        const nameNode = new Node('Name');
        nameNode.setPosition(-100, 12, 0);
        const nameLabel = nameNode.addComponent(Label);
        nameLabel.fontSize = 14;
        nameLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        node.addChild(nameNode);

        const timeNode = new Node('Time');
        timeNode.setPosition(-100, -8, 0);
        const timeLabel = timeNode.addComponent(Label);
        timeLabel.fontSize = 12;
        timeLabel.color = Color.GRAY;
        timeLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        node.addChild(timeNode);

        const spotNode = new Node('Spot');
        spotNode.setPosition(80, 12, 0);
        const spotLabel = spotNode.addComponent(Label);
        spotLabel.fontSize = 11;
        spotLabel.color = Color.GRAY;
        node.addChild(spotNode);

        const countNode = new Node('Count');
        countNode.setPosition(80, -8, 0);
        const countLabel = countNode.addComponent(Label);
        countLabel.fontSize = 11;
        countLabel.color = new Color(33, 150, 243);
        node.addChild(countNode);

        const statusNode = new Node('Status');
        statusNode.setPosition(120, 0, 0);
        const statusSpr = statusNode.addComponent(Sprite);
        statusSpr.type = Sprite.Type.SIMPLE;
        statusSpr.sizeMode = Sprite.SizeMode.CUSTOM;
        const statusUT = statusNode.addComponent(UITransform);
        statusUT.setContentSize(10, 10);
        node.addChild(statusNode);

        const conflictNode = new Node('ConflictFlag');
        conflictNode.setPosition(-130, 0, 0);
        const conflictLabel = conflictNode.addComponent(Label);
        conflictLabel.fontSize = 10;
        conflictLabel.color = new Color(244, 67, 54);
        conflictNode.active = false;
        node.addChild(conflictNode);

        const arrivalNode = new Node('ArrivalBadge');
        arrivalNode.setPosition(-130, 15, 0);
        const arrivalLabel = arrivalNode.addComponent(Label);
        arrivalLabel.fontSize = 10;
        arrivalLabel.color = new Color(255, 152, 0);
        arrivalNode.active = false;
        node.addChild(arrivalNode);

        const selectedBorder = new Node('SelectedBorder');
        const borderUT = selectedBorder.addComponent(UITransform);
        borderUT.setContentSize(284, 64);
        const borderSpr = selectedBorder.addComponent(Sprite);
        borderSpr.type = Sprite.Type.SIMPLE;
        borderSpr.sizeMode = Sprite.SizeMode.CUSTOM;
        borderSpr.color = new Color(33, 150, 243);
        selectedBorder.active = false;
        node.addChild(selectedBorder);

        const item = node.addComponent(ReservationItem) as any;
        item.nameLabel = nameLabel;
        item.timeLabel = timeLabel;
        item.spotLabel = spotLabel;
        item.ticketCountLabel = countLabel;
        item.statusIndicator = statusSpr;
        item.conflictFlag = conflictNode;
        item.background = bg;
        item.selectedBorder = selectedBorder;

        return node;
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

        if (!item.isPending() && !reservation.isArrivalTask()) return;

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
