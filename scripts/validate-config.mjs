import * as fs from 'fs';
import * as path from 'path';

console.log('==============================================');
console.log('康复中心康复评估经营模拟游戏 - 配置完整性自检');
console.log('==============================================');

const configDir = path.join(__dirname, '..', 'assets', 'resources', 'configs');
const configFiles = [
    'LevelsConfig.json',
    'TasksConfig.json',
    'CluesConfig.json',
    'PrescriptionsConfig.json',
    'TutorialsConfig.json',
    'QuestionSetsConfig.json',
    'ScenesConfig.json'
];

console.log('\n📁 第一步: 配置文件存在性检查');
let allFilesExist = true;
const fileSizes: Record<string, number> = {};

configFiles.forEach(file => {
    const filePath = path.join(configDir, file);
    try {
        const stats = fs.statSync(filePath);
        fileSizes[file] = stats.size;
        console.log(`  ✅ ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
    } catch (e: any) {
        console.log(`  ❌ ${file} - 不存在`);
        allFilesExist = false;
    }
});

console.log('\n📋 第二步: 配置内容有效性检查');
let allJsonValid = true;
let totalLevels = 0;
let totalTasks = 0;
let totalClues = 0;
let totalQuestions = 0;
let totalTutorials = 0;
const errorTypes: Set<string> = new Set();
const clueCategories: Set<string> = new Set();

configFiles.forEach(file => {
    const filePath = path.join(configDir, file);
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const json = JSON.parse(content);

        switch (file) {
            case 'LevelsConfig.json':
                totalLevels = json.levels?.length || 0;
                console.log(`  ✅ ${file}: ${totalLevels}个关卡`);
                json.levels?.forEach((l: any) => {
                    console.log(`     - ${l.id}: ${l.name} [难度${l.difficulty}, ${l.tasks.length}任务]`);
                });
                break;
            case 'TasksConfig.json':
                totalTasks = Object.keys(json.tasks || {}).length;
                console.log(`  ✅ ${file}: ${totalTasks}个任务`);
                Object.values(json.tasks || {}).forEach((t: any) => {
                    t.actionOptions?.forEach((o: any) => {
                        if (o.errorType) errorTypes.add(o.errorType);
                    });
                });
                break;
            case 'CluesConfig.json':
                totalClues = Object.keys(json.clues || {}).length;
                console.log(`  ✅ ${file}: ${totalClues}条线索`);
                Object.values(json.clues || {}).forEach((c: any) => {
                    clueCategories.add(c.category || '未知');
                });
                break;
            case 'PrescriptionsConfig.json':
                console.log(`  ✅ ${file}: ${Object.keys(json.prescriptions || {}).length}个训练处方`);
                break;
            case 'TutorialsConfig.json':
                totalTutorials = Object.keys(json.tutorials || {}).length;
                console.log(`  ✅ ${file}: ${totalTutorials}个教程`);
                break;
            case 'QuestionSetsConfig.json':
                const sets = Object.keys(json.questionSets || {});
                sets.forEach(sid => {
                    totalQuestions += json.questionSets[sid].questions?.length || 0;
                });
                console.log(`  ✅ ${file}: ${sets.length}个题组, ${totalQuestions}道题`);
                break;
            case 'ScenesConfig.json':
                console.log(`  ✅ ${file}: ${Object.keys(json.scenes || {}).length}个场景`);
                break;
        }
    } catch (e: any) {
        console.log(`  ❌ ${file} - JSON解析错误: ${e.message}`);
        allJsonValid = false;
    }
});

console.log('\n🔗 第三步: 引用完整性检查');
const levelsPath = path.join(configDir, 'LevelsConfig.json');
const tasksPath = path.join(configDir, 'TasksConfig.json');
const cluesPath = path.join(configDir, 'CluesConfig.json');
const prescPath = path.join(configDir, 'PrescriptionsConfig.json');
const scenesPath = path.join(configDir, 'ScenesConfig.json');

const levels = JSON.parse(fs.readFileSync(levelsPath, 'utf-8')).levels || [];
const tasks: any = JSON.parse(fs.readFileSync(tasksPath, 'utf-8')).tasks || {};
const clues: any = JSON.parse(fs.readFileSync(cluesPath, 'utf-8')).clues || {};
const prescriptions: any = JSON.parse(fs.readFileSync(prescPath, 'utf-8')).prescriptions || {};
const scenes: any = JSON.parse(fs.readFileSync(scenesPath, 'utf-8')).scenes || {};

let brokenLinks: string[] = [];
let linkedTasks = new Set<string>();
let linkedClues = new Set<string>();
let linkedPrescriptions = new Set<string>();
let linkedScenes = new Set<string>();

levels.forEach((l: any) => {
    linkedPrescriptions.add(l.prescriptionId);
    linkedScenes.add(l.sceneId);
    if (!prescriptions[l.prescriptionId]) {
        brokenLinks.push(`关卡${l.id}引用不存在的处方: ${l.prescriptionId}`);
    }
    if (!scenes[l.sceneId]) {
        brokenLinks.push(`关卡${l.id}引用不存在的场景: ${l.sceneId}`);
    }
    l.tasks.forEach((tid: string) => {
        linkedTasks.add(tid);
        if (!tasks[tid]) {
            brokenLinks.push(`关卡${l.id}引用不存在的任务: ${tid}`);
        }
    });
});

Object.values(tasks).forEach((t: any) => {
    (t.clueIds || []).forEach((cid: string) => {
        linkedClues.add(cid);
        if (!clues[cid]) {
            brokenLinks.push(`任务${t.id}引用不存在的线索: ${cid}`);
        }
    });
    (t.actionOptions || []).forEach((o: any) => {
        if (o.nextTask && !tasks[o.nextTask]) {
            brokenLinks.push(`任务${t.id}选项${o.id}引用不存在的nextTask: ${o.nextTask}`);
        }
    });
});

console.log(`  关卡引用任务覆盖率: ${linkedTasks.size}/${Object.keys(tasks).length} (${((linkedTasks.size / Math.max(1, Object.keys(tasks).length)) * 100).toFixed(1)}%)`);
console.log(`  任务引用线索覆盖率: ${linkedClues.size}/${Object.keys(clues).length} (${((linkedClues.size / Math.max(1, Object.keys(clues).length)) * 100).toFixed(1)}%)`);
console.log(`  关卡引用处方: ${linkedPrescriptions.size}/${Object.keys(prescriptions).length}`);
console.log(`  关卡引用场景: ${linkedScenes.size}/${Object.keys(scenes).length}`);

if (brokenLinks.length > 0) {
    console.log(`  ❌ 发现${brokenLinks.length}个断裂引用:`);
    brokenLinks.forEach(b => console.log(`     - ${b}`));
} else {
    console.log(`  ✅ 所有引用关系完整`);
}

console.log('\n📊 配置内容统计摘要');
console.log(`  ├─ 关卡数: ${totalLevels} (难度1-4级)`);
console.log(`  ├─ 任务数: ${totalTasks}`);
console.log(`  ├─ 线索数: ${totalClues} (分类: ${Array.from(clueCategories).join(', ')})`);
console.log(`  ├─ 训练处方: ${Object.keys(prescriptions).length}`);
console.log(`  ├─ 教程数: ${totalTutorials}`);
console.log(`  ├─ 评估题组: ${totalQuestions}道题`);
console.log(`  └─ 错因分类: ${errorTypes.size}种 (${Array.from(errorTypes).join(', ')})`);

console.log('\n🧪 第四步: 代码结构检查');
const scriptsDir = path.join(__dirname, '..', 'assets', 'scripts');
const scriptDirs = ['core', 'types', 'ui', 'scene', 'main', 'tests'];
const tsFileCounts: Record<string, number> = {};

scriptDirs.forEach(dir => {
    const dirPath = path.join(scriptsDir, dir);
    try {
        const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.ts'));
        tsFileCounts[dir] = files.length;
        console.log(`  ✅ ${dir}/: ${files.length}个TypeScript文件`);
        files.forEach(f => console.log(`     - ${f}`));
    } catch (e: any) {
        console.log(`  ⚠️  ${dir}/: 目录不存在`);
        tsFileCounts[dir] = 0;
    }
});

const totalTSFiles = Object.values(tsFileCounts).reduce((a, b) => a + b, 0);

console.log('\n🏁 最终检查结果');
const finalPass = allFilesExist && allJsonValid && brokenLinks.length === 0;

if (finalPass) {
    console.log('  ✅✅✅ 全部检查通过！项目配置完整有效');
} else {
    console.log('  ⚠️  发现需要关注的问题：');
    if (!allFilesExist) console.log('    - 有缺失的配置文件');
    if (!allJsonValid) console.log('    - 有无效的JSON文件');
    if (brokenLinks.length > 0) console.log(`    - 有${brokenLinks.length}个断裂的配置引用`);
}

console.log('\n📁 配置文件总计:');
const totalKB = Object.values(fileSizes).reduce((a, b) => a + b, 0);
console.log(`  ${configFiles.length}个配置文件, 合计${(totalKB / 1024).toFixed(1)}KB`);
console.log(`  ${totalTSFiles}个TypeScript源码文件`);

console.log('\n==============================================');
console.log('配置自检完成');
console.log('==============================================\n');

process.exit(finalPass ? 0 : 1);
