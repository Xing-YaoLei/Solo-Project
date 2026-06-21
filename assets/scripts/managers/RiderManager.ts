import { _decorator, Component, Vec3 } from 'cc';
import { Rider, Position, TrajectoryPoint } from '../types/GameTypes';
import { MAP_LOCATIONS, RIDER_NAMES, WEATHER_EFFECTS } from '../config/GameConfig';
import { v4 as uuidv4 } from '../utils/uuid';

const { ccclass } = _decorator;

@ccclass('RiderManager')
export class RiderManager extends Component {
    private riders: Rider[] = [];
    private riderPool: Rider[] = [];
    private maxPoolSize = 10;
    private rejectWarningThresholds = [0.3, 0.5, 0.7];

    onLoad() {
        this.initRiderPool();
    }

    private initRiderPool() {
        for (let i = 0; i < this.maxPoolSize; i++) {
            this.riderPool.push(this.createEmptyRider());
        }
    }

    private createEmptyRider(): Rider {
        return {
            id: '',
            name: '',
            avatar: '',
            position: { x: 0, y: 0, name: '', address: '' },
            status: 'idle',
            efficiency: 1.0,
            satisfaction: 100,
            totalOrders: 0,
            rejectionCount: 0,
            rejectWarningLevel: 0,
            trajectory: [],
        };
    }

    initRiders(count: number): Rider[] {
        this.clearAll();

        for (let i = 0; i < count; i++) {
            let rider = this.riderPool.pop();
            if (!rider) {
                rider = this.createEmptyRider();
            }

            const startPos = MAP_LOCATIONS[Math.floor(Math.random() * MAP_LOCATIONS.length)];

            rider.id = uuidv4();
            rider.name = RIDER_NAMES[i % RIDER_NAMES.length];
            rider.avatar = `rider_${i + 1}`;
            rider.position = { ...startPos };
            rider.status = 'idle';
            rider.efficiency = 0.8 + Math.random() * 0.4;
            rider.satisfaction = 90 + Math.random() * 10;
            rider.totalOrders = 0;
            rider.rejectionCount = 0;
            rider.rejectWarningLevel = 0;
            rider.trajectory = [{
                time: Date.now(),
                position: { ...rider.position },
                speed: 0,
                event: 'start',
            }];

            this.riders.push(rider);
        }

        return this.riders;
    }

    getIdleRiders(): Rider[] {
        return this.riders.filter(r => r.status === 'idle');
    }

    getActiveRiders(): Rider[] {
        return this.riders.filter(r => r.status === 'busy');
    }

    getRiderById(id: string): Rider | undefined {
        return this.riders.find(r => r.id === id);
    }

    updateRiderPosition(riderId: string, position: Position, speed: number, event?: string): boolean {
        const rider = this.getRiderById(riderId);
        if (!rider) return false;

        rider.position = { ...position };
        rider.trajectory.push({
            time: Date.now(),
            position: { ...position },
            speed,
            event,
        });

        if (rider.trajectory.length > 100) {
            rider.trajectory = rider.trajectory.slice(-50);
        }

        return true;
    }

    setRiderStatus(riderId: string, status: Rider['status'], orderId?: string): boolean {
        const rider = this.getRiderById(riderId);
        if (!rider) return false;

        rider.status = status;
        if (status === 'busy' && orderId) {
            rider.currentOrderId = orderId;
            rider.totalOrders++;
        } else if (status === 'idle') {
            rider.currentOrderId = undefined;
        }

        this.updateRejectWarningLevel(rider);
        return true;
    }

    recordRejection(riderId: string): boolean {
        const rider = this.getRiderById(riderId);
        if (!rider) return false;

        rider.rejectionCount++;
        rider.satisfaction = Math.max(0, rider.satisfaction - 5);
        this.updateRejectWarningLevel(rider);

        return true;
    }

    private updateRejectWarningLevel(rider: Rider) {
        if (rider.totalOrders === 0) {
            rider.rejectWarningLevel = 0;
            return;
        }

        const rejectRate = rider.rejectionCount / Math.max(1, rider.totalOrders);

        if (rejectRate >= this.rejectWarningThresholds[2]) {
            rider.rejectWarningLevel = 3;
        } else if (rejectRate >= this.rejectWarningThresholds[1]) {
            rider.rejectWarningLevel = 2;
        } else if (rejectRate >= this.rejectWarningThresholds[0]) {
            rider.rejectWarningLevel = 1;
        } else {
            rider.rejectWarningLevel = 0;
        }
    }

    checkRejectionRisk(riderId: string, weather: string, orderDistance: number): { willReject: boolean; warningLevel: number } {
        const rider = this.getRiderById(riderId);
        if (!rider) return { willReject: false, warningLevel: 0 };

        const weatherEffect = WEATHER_EFFECTS[weather as keyof typeof WEATHER_EFFECTS];
        const baseRejectRate = weatherEffect.rejectionRate;

        const distanceFactor = Math.min(1, orderDistance / 5000);
        const satisfactionFactor = Math.max(0, (100 - rider.satisfaction) / 100);
        const efficiencyFactor = Math.max(0, (1 - rider.efficiency) * 0.5);

        const totalRejectRate = baseRejectRate + distanceFactor * 0.1 + satisfactionFactor * 0.2 + efficiencyFactor;

        const willReject = Math.random() < totalRejectRate;
        const warningLevel = Math.min(3, Math.ceil(totalRejectRate * 4));

        return { willReject, warningLevel: Math.max(rider.rejectWarningLevel, warningLevel) };
    }

    moveRiderToTarget(riderId: string, targetPos: Position, deltaTime: number, weather: string): boolean {
        const rider = this.getRiderById(riderId);
        if (!rider || rider.status !== 'busy') return false;

        const weatherEffect = WEATHER_EFFECTS[weather as keyof typeof WEATHER_EFFECTS];
        const baseSpeed = 200 * rider.efficiency * weatherEffect.speedMultiplier;

        const dx = targetPos.x - rider.position.x;
        const dy = targetPos.y - rider.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 5) {
            rider.position = { ...targetPos };
            this.updateRiderPosition(riderId, targetPos, 0, 'arrived');
            return true;
        }

        const moveDistance = baseSpeed * deltaTime;
        const ratio = Math.min(1, moveDistance / distance);

        const newPos: Position = {
            x: rider.position.x + dx * ratio,
            y: rider.position.y + dy * ratio,
            name: targetPos.name,
            address: targetPos.address,
        };

        const actualSpeed = moveDistance / deltaTime;
        this.updateRiderPosition(riderId, newPos, actualSpeed);

        return false;
    }

    getAllRiders(): Rider[] {
        return [...this.riders];
    }

    clearAll() {
        this.riders.forEach(r => {
            r.trajectory = [];
            r.rejectionCount = 0;
            r.totalOrders = 0;
            r.rejectWarningLevel = 0;
            if (this.riderPool.length < this.maxPoolSize) {
                this.riderPool.push(r);
            }
        });
        this.riders = [];
    }

    calculateOptimalRider(pickupPos: Position, weather: string): { rider: Rider | null; score: number } {
        const idleRiders = this.getIdleRiders();
        if (idleRiders.length === 0) return { rider: null, score: 0 };

        let bestRider: Rider | null = null;
        let bestScore = -Infinity;

        for (const rider of idleRiders) {
            const distance = this.calculateDistance(rider.position, pickupPos);
            const rejectRisk = this.checkRejectionRisk(rider.id, weather, distance);

            const distanceScore = -distance / 100;
            const efficiencyScore = rider.efficiency * 50;
            const satisfactionScore = rider.satisfaction / 2;
            const rejectPenalty = rejectRisk.warningLevel * -30;

            const totalScore = distanceScore + efficiencyScore + satisfactionScore + rejectPenalty;

            if (totalScore > bestScore) {
                bestScore = totalScore;
                bestRider = rider;
            }
        }

        return { rider: bestRider, score: bestScore };
    }

    private calculateDistance(a: Position, b: Position): number {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
