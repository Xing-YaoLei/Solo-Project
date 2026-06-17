export interface IAssetConfig {
    id: string;
    type: 'sprite' | 'audio' | 'prefab' | 'map' | 'font' | 'animation' | 'scene';
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
        id: 'scenes',
        name: '场景',
        assets: [
            { id: 'scene_boot', type: 'scene', path: 'scenes/Boot', name: '启动场景', category: 'scenes', tags: ['entry'] },
            { id: 'scene_main', type: 'scene', path: 'scenes/Main', name: '主菜单场景', category: 'scenes', tags: ['menu'] },
            { id: 'scene_game', type: 'scene', path: 'scenes/Game', name: '游戏场景', category: 'scenes', tags: ['gameplay'] }
        ]
    },
    {
        id: 'ui',
        name: 'UI预制体',
        assets: [
            { id: 'ui_order_list', type: 'prefab', path: 'prefabs/ui/OrderList', name: '工单列表', category: 'ui', tags: ['order'] },
            { id: 'ui_order_panel', type: 'prefab', path: 'prefabs/ui/OrderPanel', name: '工单详情面板', category: 'ui', tags: ['order', 'detail'] },
            { id: 'ui_hud_panel', type: 'prefab', path: 'prefabs/ui/HUDPanel', name: '顶部HUD', category: 'ui', tags: ['hud', 'status'] },
            { id: 'ui_tiled_map', type: 'prefab', path: 'prefabs/ui/TiledMap', name: 'Tiled地图', category: 'ui', tags: ['map', 'tiled'] },
            { id: 'ui_tutorial_overlay', type: 'prefab', path: 'prefabs/ui/TutorialOverlay', name: '新手引导遮罩', category: 'ui', tags: ['tutorial'] },
            { id: 'ui_review_panel', type: 'prefab', path: 'prefabs/ui/ReviewPanel', name: '复盘面板', category: 'ui', tags: ['review', 'stats'] }
        ]
    },
    {
        id: 'maps',
        name: 'Tiled地图',
        assets: [
            { id: 'map_residential', type: 'map', path: 'maps/residential', name: '住宅区地图', category: 'maps', tags: ['level1', 'level2'] },
            { id: 'map_commercial', type: 'map', path: 'maps/commercial', name: '商业区地图', category: 'maps', tags: ['level3', 'level4'] },
            { id: 'map_park_full', type: 'map', path: 'maps/park_full', name: '完整园区地图', category: 'maps', tags: ['level5', 'level6'] }
        ]
    },
    {
        id: 'sprites',
        name: '精灵图',
        assets: [
            { id: 'sprite_worker_electrician', type: 'sprite', path: 'textures/worker_electrician', name: '电工', category: 'sprites' },
            { id: 'sprite_worker_plumber', type: 'sprite', path: 'textures/worker_plumber', name: '水暖工', category: 'sprites' },
            { id: 'sprite_worker_carpenter', type: 'sprite', path: 'textures/worker_carpenter', name: '木工', category: 'sprites' },
            { id: 'sprite_worker_general', type: 'sprite', path: 'textures/worker_general', name: '杂工', category: 'sprites' },
            { id: 'sprite_worker_equipment', type: 'sprite', path: 'textures/worker_equipment', name: '设备工', category: 'sprites' },
            { id: 'sprite_bg_default', type: 'sprite', path: 'textures/bg_default', name: '默认背景', category: 'sprites' }
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

export const ASSET_PATHS = {
    scenes: {
        Boot: 'scenes/Boot',
        Main: 'scenes/Main',
        Game: 'scenes/Game'
    },
    prefabs: {
        OrderList: 'prefabs/ui/OrderList',
        OrderPanel: 'prefabs/ui/OrderPanel',
        HUDPanel: 'prefabs/ui/HUDPanel',
        TiledMap: 'prefabs/ui/TiledMap',
        TutorialOverlay: 'prefabs/ui/TutorialOverlay',
        ReviewPanel: 'prefabs/ui/ReviewPanel'
    },
    maps: {
        residential: 'maps/residential',
        commercial: 'maps/commercial',
        park_full: 'maps/park_full'
    }
} as const;

export function getAssetById(id: string): IAssetConfig | undefined {
    for (const category of ASSET_CATEGORIES) {
        const found = category.assets.find(a => a.id === id);
        if (found) return found;
    }
    return undefined;
}

export function getAssetsByCategory(categoryId: string): IAssetConfig[] {
    const category = ASSET_CATEGORIES.find(c => c.id === categoryId);
    return category ? category.assets : [];
}

export function getMapResourceForLevel(levelId: number): string {
    if (levelId <= 2) return ASSET_PATHS.maps.residential;
    if (levelId <= 4) return ASSET_PATHS.maps.commercial;
    return ASSET_PATHS.maps.park_full;
}
