const fs = require('fs');
const path = require('path');

console.log('=== 养老护理入住评估游戏 - 代码验证 ===\n');

const scriptsDir = path.join(__dirname, 'assets/scripts');

function checkDirectory(dirPath, indent = '') {
  const items = fs.readdirSync(dirPath);
  let fileCount = 0;
  let tsFileCount = 0;

  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      console.log(`${indent}📁 ${item}/`);
      const counts = checkDirectory(fullPath, indent + '  ');
      fileCount += counts.fileCount;
      tsFileCount += counts.tsFileCount;
    } else {
      fileCount++;
      if (item.endsWith('.ts')) {
        tsFileCount++;
        console.log(`${indent}📄 ${item}`);
      }
    }
  });

  return { fileCount, tsFileCount };
}

console.log('📂 脚本目录结构：');
const counts = checkDirectory(scriptsDir);
console.log(`\n总计：${counts.tsFileCount} 个 TypeScript 文件`);

console.log('\n=== 功能模块验证 ===');

const modules = [
  { name: '数据模型', file: 'assets/scripts/data/ElderlyData.ts', desc: '老人资料、用药、探访、活动数据结构' },
  { name: '关卡配置', file: 'assets/scripts/data/LevelConfig.ts', desc: '5个关卡配置 + 数据生成器' },
  { name: '游戏管理器', file: 'assets/scripts/GameManager.ts', desc: '全局状态、设置、存档管理' },
  { name: '评分系统', file: 'assets/scripts/ScoreManager.ts', desc: '速度、准确率、连击评分' },
  { name: '关卡管理', file: 'assets/scripts/LevelManager.ts', desc: '关卡加载、任务追踪' },
  { name: '游戏控制器', file: 'assets/scripts/GameController.ts', desc: '游戏主循环、任务处理' },
  { name: '设置面板', file: 'assets/scripts/SettingsPanel.ts', desc: '声音、震动、动画强度' },
  { name: '关卡选择', file: 'assets/scripts/LevelSelectPanel.ts', desc: '关卡列表、解锁状态' },
  { name: '主菜单', file: 'assets/scripts/MainMenu.ts', desc: '主界面入口' },
  { name: '新手引导', file: 'assets/scripts/TutorialManager.ts', desc: '用药清单引导教程' },
  { name: '复盘页面', file: 'assets/scripts/ReviewPanel.ts', desc: '护理达标比较、柱状图' },
  { name: 'Tiled地图', file: 'assets/scripts/TiledMapController.ts', desc: 'Tiled地图解析与交互' },
  { name: '场景管理', file: 'assets/scripts/SceneManager.ts', desc: '场景切换管理' },
  { name: '游戏启动', file: 'assets/scripts/GameBootstrap.ts', desc: '游戏初始化入口' },
  { name: '动画工具', file: 'assets/scripts/utils/AnimationHelper.ts', desc: '通用动画效果' },
  { name: '得分弹窗', file: 'assets/scripts/utils/ScorePopup.ts', desc: '分数弹出动画' },
  { name: '头像生成', file: 'assets/scripts/utils/AvatarGenerator.ts', desc: '程序化生成老人头像' },
];

modules.forEach((mod, index) => {
  const filePath = path.join(__dirname, mod.file);
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${index + 1}. ${mod.name}`);
  console.log(`   ${mod.desc}`);
  if (exists) {
    const stats = fs.statSync(filePath);
    console.log(`   文件大小：${stats.size} 字节`);
  }
  console.log('');
});

console.log('=== 游戏特色 ===');
console.log('🎮 核心玩法：');
console.log('   • 用药清单：判断药物是否正确');
console.log('   • 探访记录：核对访客信息');
console.log('   • 活动签到：管理活动参与');
console.log('');
console.log('📊 评分维度：');
console.log('   • 速度分：剩余时间奖励');
console.log('   • 准确率：正确答案比例');
console.log('   • 连击分：连续正确奖励');
console.log('');
console.log('⚙️ 设置选项：');
console.log('   • 声音开关');
console.log('   • 震动开关');
console.log('   • 动画强度（低/中/高）');
console.log('');
console.log('📈 复盘系统：');
console.log('   • 护理达标柱状图');
console.log('   • S/A/B/C/D 五级评价');
console.log('   • 各关卡详细对比');
console.log('');
console.log('🎓 新手引导：');
console.log('   • 围绕用药清单展开');
console.log('   • 7步渐进式教学');
console.log('   • 支持随时跳过');

console.log('\n=== 验证完成 ===');
