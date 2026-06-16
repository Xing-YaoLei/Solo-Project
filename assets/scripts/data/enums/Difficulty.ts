export enum Difficulty {
    BEGINNER = 'beginner',
    INTERMEDIATE = 'intermediate',
    ADVANCED = 'advanced',
    CHALLENGE = 'challenge'
}

export namespace Difficulty {
    export function getDisplayName(difficulty: Difficulty): string {
        switch (difficulty) {
            case Difficulty.BEGINNER: return '初级';
            case Difficulty.INTERMEDIATE: return '中级';
            case Difficulty.ADVANCED: return '高级';
            case Difficulty.CHALLENGE: return '挑战级';
            default: return '未知难度';
        }
    }

    export function getColor(difficulty: Difficulty): string {
        switch (difficulty) {
            case Difficulty.BEGINNER: return '#4CAF50';
            case Difficulty.INTERMEDIATE: return '#FF9800';
            case Difficulty.ADVANCED: return '#F44336';
            case Difficulty.CHALLENGE: return '#9C27B0';
            default: return '#999999';
        }
    }
}
