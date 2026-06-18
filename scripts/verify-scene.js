#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const PROJECT_ROOT = path.resolve(__dirname, '..');

const scenePath = path.join(PROJECT_ROOT, 'assets/scenes/Main.scene');
const scene = JSON.parse(fs.readFileSync(scenePath, 'utf8'));

console.log('总对象数:', scene.length);

const panels = [
  'MainMenu', 'HUD', 'TaskBriefingPanel', 'CluePanel', 'DocumentPanel',
  'ApprovalPanel', 'ResultPanel', 'ReviewPanel', 'LevelSelectPanel',
  'TutorialUI', 'LeaderboardUI', 'TiledMapContainer', 'GameMain'
];

console.log('\n--- 面板节点检查 ---');
for (const p of panels) {
  const obj = scene.find(o => o.__type__ === 'cc.Node' && o._name === p);
  if (obj) {
    console.log(`  ✓ ${p} - 子节点: ${obj._children?.length || 0}, 组件: ${obj._components?.length || 0}`);
  } else {
    console.log(`  ✗ ${p} - 未找到!`);
  }
}

console.log('\n--- GameMain canvas 绑定 ---');
const gm = scene.find(o => o.canvas !== undefined && o.__scriptAsset);
if (gm) {
  const canvasNode = scene.find(s => s.__id__ === gm.canvas.__id__);
  console.log(`  ✓ canvas 引用: ${canvasNode?._name || '???'}`);
}

console.log('\n--- TiledMapController 绑定 ---');
const tmScriptUuid = require(path.join(PROJECT_ROOT, 'temp/uuid-map.json'))['TiledMapController'];
const tmType = `s${tmScriptUuid.replace(/-/g, '')}`;
const tmComp = scene.find(o => o.__type__ === tmType);
if (tmComp) {
  console.log(`  ✓ playerNode: ${tmComp.playerNode ? '已绑定' : '缺失'}`);
  console.log(`  ✓ mapScale: ${tmComp.mapScale}`);
  console.log(`  ✓ tiledMap 引用: ${tmComp.tiledMap ? '存在' : '缺失'}`);
}

console.log('\n--- DocumentPanel 绑定 ---');
const dpUuid = require(path.join(PROJECT_ROOT, 'temp/uuid-map.json'))['DocumentPanel'];
const dpType = `s${dpUuid.replace(/-/g, '')}`;
const dp = scene.find(o => o.__type__ === dpType);
if (dp) {
  const props = ['itemList','itemTemplate','totalLabel','documentTitleLabel','submitButton'];
  for (const p of props) console.log(`  ✓ ${p}: ${dp[p] ? '已绑定' : '缺失'}`);
}

console.log('\n--- ApprovalPanel 绑定 ---');
const apUuid = require(path.join(PROJECT_ROOT, 'temp/uuid-map.json'))['ApprovalPanel'];
const apType = `s${apUuid.replace(/-/g, '')}`;
const ap = scene.find(o => o.__type__ === apType);
if (ap) {
  const props = ['nodeTitleLabel','nodeDescriptionLabel','approverLabel','choicesContainer','choiceTemplate','feedbackLabel','continueButton'];
  for (const p of props) console.log(`  ✓ ${p}: ${ap[p] ? '已绑定' : '缺失'}`);
}

console.log('\n--- ResultPanel 绑定 ---');
const rpUuid = require(path.join(PROJECT_ROOT, 'temp/uuid-map.json'))['ResultPanel'];
const rpType = `s${rpUuid.replace(/-/g, '')}`;
const rp = scene.find(o => o.__type__ === rpType);
if (rp) {
  const props = ['resultTitleLabel','scoreLabel','moneyLabel','timeLabel','starsContainer','starTemplate','restartButton','reviewButton','menuButton','nextLevelButton'];
  for (const p of props) console.log(`  ✓ ${p}: ${rp[p] ? '已绑定' : '缺失'}`);
}

console.log('\n--- Canvas 子节点完整列表 ---');
const canvas = scene.find(o => o.__type__ === 'cc.Node' && o._name === 'Canvas');
if (canvas && canvas._children) {
  for (const c of canvas._children) {
    const node = scene.find(n => n.__id__ === c.__id__);
    if (node) {
      console.log(`  · ${node._name} (active: ${node._active})`);
    }
  }
}

console.log('\n✓ 场景结构验证完成');
