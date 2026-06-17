import { _decorator, Component, Node, Label, Sprite, UITransform, tween, Vec3, Color, instantiate, Prefab } from 'cc';
import type { TaskConfig, PrescriptionData, ReplenishmentData, InsuranceData, BlurConfig, AdviceConfig } from '../data/LevelConfig';
import { PharmacistAdviceService, type EvaluatedAdvice } from '../services/PharmacistAdviceService';

const { ccclass, property } = _decorator;

export type InfoPanelType = 'prescription' | 'replenishment' | 'insurance';

@ccclass('InfoPanel')
export class InfoPanel extends Component {
    @property(Node)
    prescriptionPanel: Node | null = null;

    @property(Node)
    replenishmentPanel: Node | null = null;

    @property(Node)
    insurancePanel: Node | null = null;

    @property(Node)
    adviceContainer: Node | null = null;

    @property(Sprite)
    prescriptionImage: Sprite | null = null;

    @property(Prefab)
    adviceBubblePrefab: Prefab | null = null;

    private currentTask: TaskConfig | null = null;
    private levelPharmacistAdvice: AdviceConfig[] = [];
    private blurConfig: BlurConfig | null = null;

    onLoad() {
        this.hideAllPanels();
    }

    public setTask(task: TaskConfig, levelAdvice?: AdviceConfig[], blurConfig?: BlurConfig): void {
        this.currentTask = task;
        this.levelPharmacistAdvice = levelAdvice || [];
        this.blurConfig = blurConfig || null;
        this.hideAllPanels();
        this.clearAdvice();
    }

    public showPanel(type: InfoPanelType): void {
        if (!this.currentTask) return;

        this.hideAllPanels();
        this.clearAdvice();

        switch (type) {
            case 'prescription':
                this.showPrescription(this.currentTask.prescription);
                break;
            case 'replenishment':
                this.showReplenishment(this.currentTask.replenishmentOrder);
                break;
            case 'insurance':
                this.showInsurance(this.currentTask.insuranceRecord);
                break;
        }

        this.showPharmacistAdvice(type);
    }

    private showPrescription(data: PrescriptionData): void {
        if (!this.prescriptionPanel) return;
        this.prescriptionPanel.active = true;

        const labels = this.prescriptionPanel.getComponentsInChildren(Label);
        const dataMap: Record<string, string> = {
            'PatientName': data.patientName,
            'PatientAge': `${data.patientAge}岁`,
            'PatientGender': data.patientGender,
            'DrugName': data.drugName,
            'Specification': data.drugSpecification,
            'Dosage': `${data.dosage}mg`,
            'Frequency': data.frequency,
            'Duration': data.duration,
            'Diagnosis': data.diagnosis,
            'DoctorName': data.doctorName,
            'IssueDate': data.issueDate
        };

        labels.forEach(label => {
            const key = label.node.name.replace('Label', '');
            if (dataMap[key] !== undefined) {
                label.string = dataMap[key];
            }
        });

        this.applyPrescriptionBlur();
    }

    private showReplenishment(data: ReplenishmentData): void {
        if (!this.replenishmentPanel) return;
        this.replenishmentPanel.active = true;

        const labels = this.replenishmentPanel.getComponentsInChildren(Label);
        const dataMap: Record<string, string> = {
            'OrderId': data.orderId,
            'DrugName': data.drugName,
            'RequestedQuantity': `${data.requestedQuantity}盒`,
            'CurrentStock': `${data.currentStock}盒`,
            'UnitPrice': `¥${data.unitPrice.toFixed(2)}`,
            'Supplier': data.supplier,
            'ExpiryDate': data.expiryDate,
            'IsUrgent': data.isUrgent ? '紧急' : '常规'
        };

        labels.forEach(label => {
            const key = label.node.name.replace('Label', '');
            if (dataMap[key] !== undefined) {
                label.string = dataMap[key];
            }
        });
    }

    private showInsurance(data: InsuranceData): void {
        if (!this.insurancePanel) return;
        this.insurancePanel.active = true;

        const labels = this.insurancePanel.getComponentsInChildren(Label);
        const dataMap: Record<string, string> = {
            'RecordId': data.recordId,
            'PatientName': data.patientName,
            'IdCardNumber': data.idCardNumber,
            'InsuranceType': data.insuranceType,
            'DrugName': data.drugName,
            'TotalAmount': `¥${data.totalAmount.toFixed(2)}`,
            'InsuranceCoverage': `¥${data.insuranceCoverage.toFixed(2)}`,
            'PersonalPayment': `¥${data.personalPayment.toFixed(2)}`,
            'TransactionDate': data.transactionDate,
            'IsReimbursable': data.isReimbursable ? '可报销' : '不可报销',
            'ReimbursementLimit': `¥${data.reimbursementLimit.toFixed(2)}`
        };

        labels.forEach(label => {
            const key = label.node.name.replace('Label', '');
            if (dataMap[key] !== undefined) {
                label.string = dataMap[key];
            }
        });
    }

    private showPharmacistAdvice(panelType: InfoPanelType): void {
        if (!this.currentTask || !this.adviceContainer || !this.adviceBubblePrefab) return;

        const adviceList = PharmacistAdviceService.instance.getAdviceForTask(
            this.currentTask,
            this.levelPharmacistAdvice
        );

        const relevantAdvice = adviceList.filter(advice => {
            if (panelType === 'prescription') return true;
            if (panelType === 'replenishment') return advice.content.includes('库存') || advice.content.includes('补货');
            if (panelType === 'insurance') return advice.content.includes('医保') || advice.content.includes('报销');
            return true;
        });

        relevantAdvice.forEach((advice, index) => {
            this.createAdviceBubble(advice, index);
        });
    }

    private createAdviceBubble(advice: EvaluatedAdvice, index: number): void {
        if (!this.adviceContainer || !this.adviceBubblePrefab) return;

        const bubble = instantiate(this.adviceBubblePrefab);
        this.adviceContainer.addChild(bubble);

        bubble.setPosition(0, -index * 80, 0);

        const label = bubble.getComponentInChildren(Label);
        if (label) {
            label.string = `${PharmacistAdviceService.instance.getAdviceTypeIcon(advice.type)} ${advice.content}`;
            label.color = new Color().fromHEX(PharmacistAdviceService.instance.getAdviceTypeColor(advice.type));
        }

        bubble.opacity = 0;
        tween(bubble)
            .delay(index * 0.2)
            .to(0.3, { opacity: 255 })
            .start();
    }

    private applyPrescriptionBlur(): void {
        if (!this.blurConfig || !this.blurConfig.enabled) return;
        if (!this.prescriptionPanel) return;

        if (this.blurConfig.blurRadius > 0 && this.prescriptionImage) {
            console.log(`应用处方模糊效果: ${this.blurConfig.blurRadius}px`);
        }

        if (this.blurConfig.obscureAreas.length > 0) {
            const labels = this.prescriptionPanel.getComponentsInChildren(Label);
            labels.forEach(label => {
                const key = label.node.name.replace('Label', '');
                if (this.blurConfig!.obscureAreas.includes(key) ||
                    this.blurConfig!.obscureAreas.some(area => key.toLowerCase().includes(area.toLowerCase()))) {
                    label.string = '███';
                }
            });
        }

        if (this.blurConfig.tiltAngle !== 0 && this.prescriptionImage) {
            this.prescriptionImage.node.angle = this.blurConfig.tiltAngle;
        }
    }

    private hideAllPanels(): void {
        if (this.prescriptionPanel) this.prescriptionPanel.active = false;
        if (this.replenishmentPanel) this.replenishmentPanel.active = false;
        if (this.insurancePanel) this.insurancePanel.active = false;
    }

    private clearAdvice(): void {
        if (!this.adviceContainer) return;
        this.adviceContainer.removeAllChildren();
    }

    public hide(): void {
        this.hideAllPanels();
        this.clearAdvice();
    }

    public reset(): void {
        this.currentTask = null;
        this.blurConfig = null;
        this.hide();
    }
}
