#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log('=== 游戏流程验证 ===\n');

const check = (desc, condition) => {
  const status = condition ? '✓' : '✗';
  console.log(`${status} ${desc}`);
  return condition;
};

let allOk = true;

const readTS = (relPath) => {
  const fullPath = path.join(PROJECT_ROOT, relPath);
  return fs.readFileSync(fullPath, 'utf8');
};

console.log('--- 1. GameMain 启动流程 ---');
const gameMain = readTS('assets/scripts/GameMain.ts');
allOk &= check('loadConfigs 完成后 emit UI_SHOW_MENU', 
  gameMain.includes("EventManager.instance.emit(GameEvents.UI_SHOW_MENU)"));
allOk &= check('监听 UI_SHOW_MENU 显示 MainMenu',
  gameMain.includes("_showMainMenu") && gameMain.includes("mainMenuNode.active = true"));

console.log('\n--- 2. MainMenu 按钮绑定 ---');
const mainMenu = readTS('assets/scripts/ui/MainMenu.ts');
allOk &= check('4 个按钮都用 bindButtonClick 绑定',
  mainMenu.includes("bindButtonClick(this.startButton") &&
  mainMenu.includes("bindButtonClick(this.levelSelectButton") &&
  mainMenu.includes("bindButtonClick(this.leaderboardButton") &&
  mainMenu.includes("bindButtonClick(this.tutorialButton"));
allOk &= check('PHASE_CHANGED 时隐藏 MainMenu',
  mainMenu.includes("onPhaseChanged") && mainMenu.includes("this.hide()"));
allOk &= check('点击开始调用 GameManager.startLevel',
  mainMenu.includes("GameManager.instance.startLevel"));

console.log('\n--- 3. 游戏阶段流转 ---');
const gm = readTS('assets/scripts/managers/GameManager.ts');
allOk &= check('startLevel 发出 GAME_START 和 PHASE_CHANGED(task_briefing)',
  gm.includes("emit(GameEvents.GAME_START") &&
  gm.includes("emit(GameEvents.PHASE_CHANGED, 'task_briefing')"));
allOk &= check('startGameplay 切换到 clue_investigation',
  gm.includes("changePhase('clue_investigation')"));
allOk &= check('goToDocumentEditing 切换到 document_editing',
  gm.includes("changePhase('document_editing')"));
allOk &= check('goToApproval 切换到 approval',
  gm.includes("changePhase('approval')"));
allOk &= check('restartLevel 重新调用 startLevel',
  gm.includes("restartLevel") && gm.includes("this.startLevel(this._gameState.currentLevelId)"));
allOk &= check('exitToMenu 发出 UI_SHOW_MENU',
  gm.includes("exitToMenu") && gm.includes("emit(GameEvents.UI_SHOW_MENU)"));

console.log('\n--- 4. TaskBriefingPanel ---');
const taskBriefing = readTS('assets/scripts/ui/TaskBriefingPanel.ts');
allOk &= check('监听 GAME_START 更新信息并显示',
  taskBriefing.includes("onGameStart") && taskBriefing.includes("this.show()"));
allOk &= check('监听 PHASE_CHANGED(task_briefing) 显示',
  taskBriefing.includes("phase === 'task_briefing'"));
allOk &= check('startButton 绑定到 onStartClicked',
  taskBriefing.includes("bindButtonClick(this.startButton"));
allOk &= check('onStartClicked 调用 startGameplay',
  taskBriefing.includes("GameManager.instance.startGameplay()"));

console.log('\n--- 5. CluePanel ---');
const cluePanel = readTS('assets/scripts/ui/CluePanel.ts');
allOk &= check('监听 PHASE_CHANGED(clue_investigation) 显示',
  cluePanel.includes("phase === 'clue_investigation'"));
allOk &= check('continueButton 绑定',
  cluePanel.includes("bindButtonClick(this.continueButton"));
allOk &= check('点击继续调用 goToDocumentEditing',
  cluePanel.includes("GameManager.instance.goToDocumentEditing()"));

console.log('\n--- 6. DocumentPanel ---');
const docPanel = readTS('assets/scripts/ui/DocumentPanel.ts');
allOk &= check('PHASE_CHANGED(document_editing) 时调用 getDocumentItems',
  docPanel.includes("phase === 'document_editing'") &&
  docPanel.includes("GameManager.instance.getDocumentItems()"));
allOk &= check('调用 setDocument 填充明细',
  docPanel.includes("this.setDocument(items, title)"));
allOk &= check('可改数量/单价（onItemTapped, updateItemValue）',
  docPanel.includes("_editMode = 'quantity'") &&
  docPanel.includes("_editMode = 'unitPrice'") &&
  docPanel.includes("updateItemValue"));
allOk &= check('submitButton 绑定并调用 goToApproval',
  docPanel.includes("bindButtonClick(this.submitButton") &&
  docPanel.includes("GameManager.instance.goToApproval()"));

console.log('\n--- 7. ApprovalPanel ---');
const appPanel = readTS('assets/scripts/ui/ApprovalPanel.ts');
allOk &= check('监听 PHASE_CHANGED(approval) 显示并 refreshNode',
  appPanel.includes("phase === 'approval'") &&
  appPanel.includes("this.refreshNode()"));
allOk &= check('continueButton 绑定',
  appPanel.includes("bindButtonClick(this.continueButton"));
allOk &= check('点击继续调用 advanceApproval',
  appPanel.includes("GameManager.instance.advanceApproval()"));
allOk &= check('选择后调用 makeChoice',
  appPanel.includes("GameManager.instance.makeChoice(choice.id)"));

console.log('\n--- 8. ResultPanel ---');
const resultPanel = readTS('assets/scripts/ui/ResultPanel.ts');
allOk &= check('监听 PHASE_CHANGED(result) 显示',
  resultPanel.includes("phase === 'result'"));
allOk &= check('restartButton 绑定并调用 restartLevel',
  resultPanel.includes("bindButtonClick(this.restartButton") &&
  resultPanel.includes("GameManager.instance.restartLevel()"));
allOk &= check('R 键 (restart 输入动作) 绑定到 onRestartClicked',
  resultPanel.includes("registerInput('restart'"));
allOk &= check('nextLevelButton 加载下一关',
  resultPanel.includes("onNextLevelClicked") &&
  resultPanel.includes("GameManager.instance.startLevel(nextLevel.id)"));
allOk &= check('menuButton 绑定并调用 exitToMenu',
  resultPanel.includes("bindButtonClick(this.menuButton") &&
  resultPanel.includes("GameManager.instance.exitToMenu()"));

console.log('\n--- 9. TiledMapController ---');
const tmc = readTS('assets/scripts/controllers/TiledMapController.ts');
allOk &= check('监听 GAME_START 事件',
  tmc.includes("EventManager.instance.on(GameEvents.GAME_START"));
allOk &= check('加载 TMX 资源 via resources.load',
  tmc.includes("resources.load(tmxPath, TiledMapAsset"));
allOk &= check('赋值给 tiledMap.tmxAsset',
  tmc.includes("this.tiledMap.tmxAsset = tmxAsset"));
allOk &= check('监听 UI_SHOW_MENU 隐藏地图',
  tmc.includes("EventManager.instance.on(GameEvents.UI_SHOW_MENU"));
allOk &= check('关卡 tiledMap 路径获取（tiled/level_001）',
  tmc.includes("levelConfig.tiledMap"));

console.log('\n--- 10. UIBase bindButtonClick ---');
const uiBase = readTS('assets/scripts/ui/UIBase.ts');
allOk &= check('bindButtonClick 方法存在且注册 TOUCH_END',
  uiBase.includes("bindButtonClick") &&
  uiBase.includes("Node.EventType.TOUCH_END"));

console.log('\n--- 11. build.js 成功条件 ---');
const buildJS = readTS('scripts/build.js');
allOk &= check('成功条件检查 buildDir 和 index.html',
  buildJS.includes("dirExists(buildDir) && fileExists(path.join(buildDir, 'index.html'))"));
allOk &= check('未找到 Cocos Creator 时 exit 1',
  buildJS.includes("process.exit(1)"));

console.log('\n--- 12. 其它面板 PHASE_CHANGED 隐藏 ---');
const levelSelect = readTS('assets/scripts/ui/LevelSelectPanel.ts');
const tutorial = readTS('assets/scripts/ui/TutorialUI.ts');
const leaderboard = readTS('assets/scripts/ui/LeaderboardUI.ts');
allOk &= check('LevelSelectPanel 监听 PHASE_CHANGED 隐藏',
  levelSelect.includes("onPhaseChanged") && levelSelect.includes("this.hide()"));
allOk &= check('TutorialUI 监听 PHASE_CHANGED 隐藏',
  tutorial.includes("onPhaseChanged") && tutorial.includes("this.hide()"));
allOk &= check('LeaderboardUI 监听 PHASE_CHANGED 隐藏',
  leaderboard.includes("onPhaseChanged") && leaderboard.includes("this.hide()"));

console.log('\n--- 13. HUD 按钮 ---');
const hud = readTS('assets/scripts/ui/HUD.ts');
allOk &= check('pauseButton 绑定',
  hud.includes("bindButtonClick(this.pauseButton"));
allOk &= check('menuButton 绑定',
  hud.includes("bindButtonClick(this.menuButton"));

console.log('\n' + (allOk ? '✓ 所有流程检查通过！' : '✗ 存在未通过的检查项'));
process.exit(allOk ? 0 : 1);
