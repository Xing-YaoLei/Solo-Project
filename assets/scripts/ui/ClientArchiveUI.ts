import { _decorator, Component, Node, Label, Button, ScrollView, Prefab, instantiate, Sprite } from 'cc';
import { UIBase } from './UIBase';
import { ConfigManager } from '../core/ConfigManager';
import { SaveManager } from '../core/SaveManager';
import { IClientProfile } from '../core/GameInterfaces';
const { ccclass, property } = _decorator;

@ccclass('ClientArchiveUI')
export class ClientArchiveUI extends UIBase {

    @property(ScrollView)
    clientScrollView: ScrollView | null = null;

    @property(Prefab)
    clientItemPrefab: Prefab | null = null;

    @property(Node)
    clientContent: Node | null = null;

    @property(Label)
    clientNameLabel: Label | null = null;

    @property(Label)
    clientOccupationLabel: Label | null = null;

    @property(Label)
    clientDescLabel: Label | null = null;

    @property(Label)
    clientBgLabel: Label | null = null;

    @property(Label)
    clientPersonalityLabel: Label | null = null;

    @property(Label)
    clientCaseCountLabel: Label | null = null;

    @property(Sprite)
    avatarSprite: Sprite | null = null;

    @property(Node)
    detailPanel: Node | null = null;

    @property(Button)
    closeDetailButton: Button | null = null;

    @property(Label)
    unlockedCountLabel: Label | null = null;

    private _clientItems: Node[] = [];
    private _selectedClient: IClientProfile | null = null;

    onLoad() {
        super.onLoad();

        if (this.closeDetailButton) {
            this.closeDetailButton.node.on(Button.EventType.CLICK, this.onCloseDetail, this);
        }
    }

    protected onShow(): void {
        this.refreshUI();
    }

    public refreshUI(): void {
        const allClients = ConfigManager.instance.getAllClients();
        const unlockedCount = allClients.filter(c => 
            SaveManager.instance.isClientUnlocked(c.id)
        ).length;
        
        this.setLabelText(this.unlockedCountLabel, `已解锁客户: ${unlockedCount}/${allClients.length}`);

        this.refreshClientList();
    }

    private refreshClientList(): void {
        if (!this.clientContent || !this.clientItemPrefab) return;

        this._clientItems.forEach(item => item.destroy());
        this._clientItems = [];

        const clients = ConfigManager.instance.getAllClients();

        clients.forEach(client => {
            const itemNode = instantiate(this.clientItemPrefab!);
            this.clientContent!.addChild(itemNode);
            this._clientItems.push(itemNode);

            this.setupClientItem(itemNode, client);
        });
    }

    private setupClientItem(node: Node, client: IClientProfile): void {
        const nameLabel = node.getChildByName('NameLabel')?.getComponent(Label);
        const occupationLabel = node.getChildByName('OccupationLabel')?.getComponent(Label);
        const lockedMask = node.getChildByName('LockedMask');
        const avatarSprite = node.getChildByName('AvatarSprite')?.getComponent(Sprite);

        this.setLabelText(nameLabel, client.name);
        this.setLabelText(occupationLabel, client.occupation);

        const isUnlocked = SaveManager.instance.isClientUnlocked(client.id);
        if (lockedMask) {
            lockedMask.active = !isUnlocked;
        }

        node.on(Node.EventType.TOUCH_END, () => {
            if (isUnlocked) {
                this.showClientDetail(client);
            }
        }, this);
    }

    private showClientDetail(client: IClientProfile): void {
        this._selectedClient = client;

        if (this.detailPanel) {
            this.detailPanel.active = true;
        }

        this.setLabelText(this.clientNameLabel, client.name);
        this.setLabelText(this.clientOccupationLabel, `${client.occupation} · ${client.age}岁`);
        this.setLabelText(this.clientDescLabel, client.description);
        this.setLabelText(this.clientBgLabel, `背景: ${client.background}`);
        this.setLabelText(this.clientPersonalityLabel, `性格: ${client.personality.join('、')}`);
        this.setLabelText(this.clientCaseCountLabel, `关联案件: ${client.caseIds.length}个`);
    }

    private onCloseDetail(): void {
        if (this.detailPanel) {
            this.detailPanel.active = false;
        }
        this._selectedClient = null;
    }

    public getSelectedClient(): IClientProfile | null {
        return this._selectedClient;
    }
}
