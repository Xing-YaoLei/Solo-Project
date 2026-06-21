import { _decorator, Component, Node, Graphics, Color, Vec3, UITransform } from 'cc';
import { TrajectoryPoint, Position } from '../types/GameTypes';

const { ccclass, property } = _decorator;

@ccclass('TrajectoryRenderer')
export class TrajectoryRenderer extends Component {
    @property(Graphics)
    trajectoryGraphics: Graphics | null = null;

    @property(Node)
    trajectoryContainer: Node | null = null;

    private trajectoryColors: Map<string, Color> = new Map();
    private currentTrajectories: Map<string, TrajectoryPoint[]> = new Map();
    private colorPool: Color[] = [
        new Color(0, 200, 255),
        new Color(255, 150, 0),
        new Color(0, 255, 100),
        new Color(255, 100, 200),
        new Color(200, 255, 0),
    ];

    onLoad() {
        if (!this.trajectoryGraphics && this.trajectoryContainer) {
            const graphicsNode = new Node('TrajectoryGraphics');
            this.trajectoryGraphics = graphicsNode.addComponent(Graphics);
            this.trajectoryContainer.addChild(graphicsNode);
        }
    }

    addTrajectory(riderId: string, points: TrajectoryPoint[]) {
        if (!this.trajectoryColors.has(riderId)) {
            const colorIndex = this.trajectoryColors.size % this.colorPool.length;
            this.trajectoryColors.set(riderId, this.colorPool[colorIndex]);
        }
        this.currentTrajectories.set(riderId, points);
        this.renderTrajectories();
    }

    addTrajectoryPoint(riderId: string, point: TrajectoryPoint) {
        let trajectory = this.currentTrajectories.get(riderId);
        if (!trajectory) {
            trajectory = [];
            this.currentTrajectories.set(riderId, trajectory);
            if (!this.trajectoryColors.has(riderId)) {
                const colorIndex = this.trajectoryColors.size % this.colorPool.length;
                this.trajectoryColors.set(riderId, this.colorPool[colorIndex]);
            }
        }
        trajectory.push(point);

        if (trajectory.length > 100) {
            trajectory = trajectory.slice(-50);
            this.currentTrajectories.set(riderId, trajectory);
        }

        this.renderTrajectory(riderId);
    }

    clearTrajectory(riderId: string) {
        this.currentTrajectories.delete(riderId);
        this.renderTrajectories();
    }

    clearAllTrajectories() {
        this.currentTrajectories.clear();
        if (this.trajectoryGraphics) {
            this.trajectoryGraphics.clear();
        }
    }

    private renderTrajectories() {
        if (!this.trajectoryGraphics) return;

        this.trajectoryGraphics.clear();

        this.currentTrajectories.forEach((points, riderId) => {
            this.drawTrajectory(riderId, points);
        });
    }

    private renderTrajectory(riderId: string) {
        const points = this.currentTrajectories.get(riderId);
        if (!points) return;

        this.drawTrajectory(riderId, points);
    }

    private drawTrajectory(riderId: string, points: TrajectoryPoint[]) {
        if (!this.trajectoryGraphics || points.length < 2) return;

        const color = this.trajectoryColors.get(riderId);
        if (!color) return;

        this.trajectoryGraphics.strokeColor = color;
        this.trajectoryGraphics.lineWidth = 3;
        this.trajectoryGraphics.lineCap = Graphics.LineCap.ROUND;
        this.trajectoryGraphics.lineJoin = Graphics.LineJoin.ROUND;

        const [firstPoint, ...restPoints] = points;

        this.trajectoryGraphics.moveTo(firstPoint.position.x, firstPoint.position.y);

        for (let i = 0; i < restPoints.length; i++) {
            const point = restPoints[i];
            const progress = (i + 1) / points.length;
            const alpha = 0.3 + progress * 0.7;

            this.trajectoryGraphics.strokeColor = new Color(
                color.r, color.g, color.b, Math.floor(alpha * 255)
            );

            this.trajectoryGraphics.lineTo(point.position.x, point.position.y);
            this.trajectoryGraphics.stroke();
            this.trajectoryGraphics.moveTo(point.position.x, point.position.y);
        }

        this.drawDirectionArrow(points);
        this.drawSpeedIndicators(points, color);
    }

    private drawDirectionArrow(points: TrajectoryPoint[]) {
        if (!this.trajectoryGraphics || points.length < 2) return;

        const lastPoint = points[points.length - 1];
        const prevPoint = points[points.length - 2];

        const dx = lastPoint.position.x - prevPoint.position.x;
        const dy = lastPoint.position.y - prevPoint.position.y;
        const angle = Math.atan2(dy, dx);

        const arrowSize = 8;
        const arrowAngle = Math.PI / 6;

        this.trajectoryGraphics.fillColor = this.trajectoryGraphics.strokeColor;

        this.trajectoryGraphics.moveTo(lastPoint.position.x, lastPoint.position.y);
        this.trajectoryGraphics.lineTo(
            lastPoint.position.x - arrowSize * Math.cos(angle - arrowAngle),
            lastPoint.position.y - arrowSize * Math.sin(angle - arrowAngle)
        );
        this.trajectoryGraphics.lineTo(
            lastPoint.position.x - arrowSize * Math.cos(angle + arrowAngle),
            lastPoint.position.y - arrowSize * Math.sin(angle + arrowAngle)
        );
        this.trajectoryGraphics.close();
        this.trajectoryGraphics.fill();
    }

    private drawSpeedIndicators(points: TrajectoryPoint[], baseColor: Color) {
        if (!this.trajectoryGraphics) return;

        for (let i = 0; i < points.length; i += 10) {
            const point = points[i];
            if (point.event) {
                const eventColor = point.event.includes('reject') ?
                    new Color(255, 0, 0) :
                    point.event.includes('arrive') ?
                        new Color(0, 255, 0) :
                        baseColor;

                this.trajectoryGraphics.fillColor = eventColor;
                this.trajectoryGraphics.circle(point.position.x, point.position.y, 6);
                this.trajectoryGraphics.fill();
            }
        }
    }

    highlightWrongPath(riderId: string, wrongStepIndex: number) {
        const points = this.currentTrajectories.get(riderId);
        if (!points || !this.trajectoryGraphics) return;

        const color = new Color(255, 0, 0, 255);
        this.trajectoryGraphics.strokeColor = color;
        this.trajectoryGraphics.lineWidth = 5;

        if (wrongStepIndex > 0 && wrongStepIndex < points.length) {
            const startIdx = Math.max(0, wrongStepIndex - 5);
            const endIdx = Math.min(points.length - 1, wrongStepIndex + 5);

            this.trajectoryGraphics.moveTo(
                points[startIdx].position.x,
                points[startIdx].position.y
            );

            for (let i = startIdx + 1; i <= endIdx; i++) {
                this.trajectoryGraphics.lineTo(
                    points[i].position.x,
                    points[i].position.y
                );
            }

            this.trajectoryGraphics.stroke();
        }
    }

    getTrajectory(riderId: string): TrajectoryPoint[] | undefined {
        return this.currentTrajectories.get(riderId);
    }

    setTrajectoryColor(riderId: string, color: Color) {
        this.trajectoryColors.set(riderId, color);
    }
}
