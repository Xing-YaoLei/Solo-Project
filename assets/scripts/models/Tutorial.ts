export interface TutorialStep {
    id: string;
    title: string;
    content: string;
    targetNodePath?: string;
    highlightType?: 'node' | 'area' | 'none';
    position?: { x: number; y: number };
    autoNext?: boolean;
    nextDelay?: number;
    requireAction?: string;
}

export interface TutorialConfig {
    id: string;
    name: string;
    steps: TutorialStep[];
    triggerCondition: string;
}
