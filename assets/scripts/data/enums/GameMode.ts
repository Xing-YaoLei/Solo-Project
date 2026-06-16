export enum GameMode {
    FORMAL_TRAINING = 'formal_training',
    FREE_PRACTICE = 'free_practice'
}

export namespace GameMode {
    export function getDisplayName(mode: GameMode): string {
        switch (mode) {
            case GameMode.FORMAL_TRAINING: return '正式训练';
            case GameMode.FREE_PRACTICE: return '自由练习';
            default: return '未知模式';
        }
    }
}
