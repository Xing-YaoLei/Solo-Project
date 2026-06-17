import { IRepairOrder, OrderType, OrderPriority, RepairCategory } from '../game/OrderTypes';
import { IWorker } from '../game/DispatchTypes';

export interface ILevelConfig {
    id: number;
    name: string;
    description: string;
    difficulty: 'easy' | 'normal' | 'hard';
    orderCount: number;
    timeLimit: number;
    targetScore: number;
    unlockRules: string[];
    workers: IWorker[];
    orders: IRepairOrder[];
    mapResource?: string;
    backgroundResource?: string;
    tutorialSteps?: string[];
    isUnlockable: boolean;
    requiredLevel?: number;
}

export interface IAssetConfig {
    id: string;
    type: 'sprite' | 'audio' | 'prefab' | 'map' | 'font' | 'animation';
    path: string;
    name: string;
    category: string;
    tags?: string[];
}

export interface IAssetCategory {
    id: string;
    name: string;
    assets: IAssetConfig[];
}

export interface IGameAssets {
    categories: IAssetCategory[];
}

export const ASSET_CATEGORIES: IAssetCategory[] = [
    {
        id: 'ui',
        name: 'UI界面',
        assets: [
            { id: 'ui_main_menu', type: 'prefab', path: 'prefabs/ui/MainMenu', name: '主菜单', category: 'ui' },
            { id: 'ui_level_select', type: 'prefab', path: 'prefabs/ui/LevelSelect', name: '关卡选择', category: 'ui' },
            { id: 'ui_order_panel', type: 'prefab', path: 'prefabs/ui/OrderPanel', name: '工单面板', category: 'ui' },
            { id: 'ui_dispatch_panel', type: 'prefab', path: 'prefabs/ui/DispatchPanel', name: '派单面板', category: 'ui' },
            { id: 'ui_choice_dialog', type: 'prefab', path: 'prefabs/ui/ChoiceDialog', name: '选择对话框', category: 'ui' },
            { id: 'ui_clue_panel', type: 'prefab', path: 'prefabs/ui/CluePanel', name: '线索面板', category: 'ui' },
            { id: 'ui_score_display', type: 'prefab', path: 'prefabs/ui/ScoreDisplay', name: '分数显示', category: 'ui' },
            { id: 'ui_timer_display', type: 'prefab', path: 'prefabs/ui/TimerDisplay', name: '计时器', category: 'ui' },
            { id: 'ui_tutorial_panel', type: 'prefab', path: 'prefabs/ui/TutorialPanel', name: '教程面板', category: 'ui' },
            { id: 'ui_result_panel', type: 'prefab', path: 'prefabs/ui/ResultPanel', name: '结果面板', category: 'ui' }
        ]
    },
    {
        id: 'sprites',
        name: '精灵图',
        assets: [
            { id: 'sprite_worker_electrician', type: 'sprite', path: 'sprites/workers/electrician', name: '电工', category: 'sprites' },
            { id: 'sprite_worker_plumber', type: 'sprite', path: 'sprites/workers/plumber', name: '水暖工', category: 'sprites' },
            { id: 'sprite_worker_carpenter', type: 'sprite', path: 'sprites/workers/carpenter', name: '木工', category: 'sprites' },
            { id: 'sprite_worker_general', type: 'sprite', path: 'sprites/workers/general', name: '杂工', category: 'sprites' },
            { id: 'sprite_icon_electrical', type: 'sprite', path: 'sprites/icons/electrical', name: '电力图标', category: 'sprites' },
            { id: 'sprite_icon_plumbing', type: 'sprite', path: 'sprites/icons/plumbing', name: '水暖图标', category: 'sprites' },
            { id: 'sprite_icon_structure', type: 'sprite', path: 'sprites/icons/structure', name: '土建图标', category: 'sprites' },
            { id: 'sprite_icon_equipment', type: 'sprite', path: 'sprites/icons/equipment', name: '设备图标', category: 'sprites' }
        ]
    },
    {
        id: 'maps',
        name: '地图',
        assets: [
            { id: 'map_park_residential', type: 'map', path: 'maps/park_residential', name: '住宅区地图', category: 'maps' },
            { id: 'map_park_commercial', type: 'map', path: 'maps/park_commercial', name: '商业区地图', category: 'maps' },
            { id: 'map_park_complete', type: 'map', path: 'maps/park_complete', name: '完整园区地图', category: 'maps' }
        ]
    },
    {
        id: 'audio',
        name: '音效',
        assets: [
            { id: 'audio_click', type: 'audio', path: 'audio/click', name: '点击音效', category: 'audio' },
            { id: 'audio_success', type: 'audio', path: 'audio/success', name: '成功音效', category: 'audio' },
            { id: 'audio_failure', type: 'audio', path: 'audio/failure', name: '失败音效', category: 'audio' },
            { id: 'audio_notification', type: 'audio', path: 'audio/notification', name: '通知音效', category: 'audio' },
            { id: 'audio_urgent', type: 'audio', path: 'audio/urgent', name: '紧急提示', category: 'audio' },
            { id: 'audio_bgm_main', type: 'audio', path: 'audio/bgm_main', name: '主背景音乐', category: 'audio' }
        ]
    }
];
