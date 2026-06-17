/**
 * 养老护理入住评估经营模拟游戏
 * 
 * 功能列表：
 * 1. 用药清单处理 - 判断药物是否正确
 * 2. 探访记录处理 - 核对探访信息
 * 3. 活动签到处理 - 管理活动参与
 * 4. 评分系统 - 速度、错误次数、连续正确数
 * 5. 设置系统 - 声音、震动、动画强度开关
 * 6. 关卡系统 - 5个难度递增的关卡
 * 7. 复盘系统 - 护理达标比较
 * 8. 新手引导 - 用药清单入门教程
 * 
 * 技术栈：
 * - Cocos Creator 3.8
 * - TypeScript
 * - Tiled Map
 */

export * from './GameManager';
export * from './ScoreManager';
export * from './LevelManager';
export * from './SceneManager';
export * from './GameController';
export * from './SettingsPanel';
export * from './LevelSelectPanel';
export * from './MainMenu';
export * from './TutorialManager';
export * from './ReviewPanel';
export * from './TiledMapController';
export * from './GameBootstrap';
export * from './App';
export * from './Launcher';
export * from './data/ElderlyData';
export * from './data/LevelConfig';
export * from './utils/AnimationHelper';
export * from './utils/ScorePopup';
export * from './utils/AvatarGenerator';
export * from './utils/ResourceGenerator';
export * from './utils/UIBuilder';
