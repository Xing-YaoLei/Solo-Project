import * as fs from 'fs';
import * as path from 'path';

const scenePath = path.join(process.cwd(), 'assets/scenes/MainScene.scene');
const sceneData = JSON.parse(fs.readFileSync(scenePath, 'utf-8'));

interface SceneObj {
    __type__: string;
    __id__?: number;
    _name?: string;
    node?: any;
    parent?: any;
    _children?: any[];
    _components?: any[];
    [key: string]: any;
}

const objects = new Map<number, SceneObj>();
sceneData.forEach((obj: SceneObj, idx: number) => {
    obj.__id__ = idx;
    objects.set(idx, obj);
});

console.log('=== 场景对象总数:', objects.size, '===\n');

const errors: string[] = [];
const warnings: string[] = [];

function checkRef(ref: any, context: string, expectedType?: string): void {
    if (!ref || typeof ref !== 'object' || !('__id__' in ref)) return;
    const id = ref.__id__;
    if (!objects.has(id)) {
        errors.push(`[断裂引用] ${context} → __id__:${id} 不存在`);
        return;
    }
    const target = objects.get(id)!;
    if (expectedType && target.__type__ !== expectedType) {
        warnings.push(`[类型不匹配] ${context} → __id__:${id} 期望 ${expectedType} 实际 ${target.__type__}`);
    }
}

function walk(obj: any, pathStr: string): void {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
        obj.forEach((item, i) => walk(item, `${pathStr}[${i}]`));
        return;
    }
    if ('__id__' in obj && Object.keys(obj).length === 1) {
        checkRef(obj, pathStr);
        return;
    }
    for (const key of Object.keys(obj)) {
        if (key === '__id__') continue;
        walk(obj[key], `${pathStr}.${key}`);
    }
}

sceneData.forEach((obj: SceneObj, idx: number) => {
    walk(obj, `obj[${idx}]{${obj.__type__}${obj._name ? '/' + obj._name : ''}}`);
});

console.log('--- 节点层级结构 ---');
function printNode(id: number, indent: string = ''): void {
    const obj = objects.get(id);
    if (!obj || obj.__type__ !== 'cc.Node') return;
    const comps = (obj._components || []).map((c: any) => {
        const comp = objects.get(c.__id__);
        return comp ? comp.__type__ : `?${c.__id__}`;
    }).join(', ');
    console.log(`${indent}📦 ${obj._name} [${id}] (${comps})`);
    (obj._children || []).forEach(child => printNode(child.__id__, indent + '  '));
}

const rootScenes = sceneData.filter((o: SceneObj) => o.__type__ === 'cc.Scene');
rootScenes.forEach((scene: SceneObj) => {
    console.log(`🌆 ${scene._name} [${scene.__id__}]`);
    (scene._children || []).forEach((child: any) => printNode(child.__id__, '  '));
});

console.log('\n--- 组件-节点归属检查 ---');
sceneData.forEach((obj: SceneObj) => {
    if (obj.__type__?.startsWith?.('cc.') && obj.node && obj.node.__id__ !== undefined) {
        const node = objects.get(obj.node.__id__);
        if (!node) {
            errors.push(`[组件无节点] ${obj.__type__} [${obj.__id__}] → node:${obj.node.__id__} 不存在`);
            return;
        }
        const comps = node._components || [];
        const found = comps.some((c: any) => c.__id__ === obj.__id__);
        if (!found) {
            warnings.push(`[组件未挂入节点] ${obj.__type__} [${obj.__id__}] 不在节点 ${node._name} [${obj.node.__id__}] 的 _components 列表中`);
        }
    }
});

console.log('\n--- MainSceneController 属性引用检查 ---');
const scriptComp = sceneData.find((o: SceneObj) => 
    o.__type__ === 'cc.Component' && o.__scriptAsset && o.missionHallPanel
);
if (scriptComp) {
    console.log(`脚本组件 [${scriptComp.__id__}]:`);
    const checkProp = (name: string, expectedType: string) => {
        const val = scriptComp[name];
        if (!val || !val.__id__) {
            warnings.push(`  ${name}: 空引用`);
            return;
        }
        const target = objects.get(val.__id__);
        const status = target ? `✓ ${target._name || target.__type__} [${val.__id__}]` : `✗ 不存在 [${val.__id__}]`;
        console.log(`  ${name}: ${status}`);
        if (!target) errors.push(`属性 ${name} 引用断裂: __id__:${val.__id__}`);
    };
    checkProp('missionHallPanel', 'cc.Node');
    checkProp('casePlayPanel', 'cc.Node');
    checkProp('cluePanel', 'cc.Node');
    checkProp('resultPanel', 'cc.Node');
    checkProp('loadingLabel', 'cc.Label');
    checkProp('loadingPanel', 'cc.Node');
    checkProp('caseListContainer', 'cc.Node');
    checkProp('clueListContainer', 'cc.Node');
    checkProp('actionListContainer', 'cc.Node');
    checkProp('stageInfoLabel', 'cc.Label');
    checkProp('playerInfoLabel', 'cc.Label');
} else {
    errors.push('未找到 MainSceneController 脚本组件');
}

console.log('\n=== 统计 ===');
console.log(`错误: ${errors.length}`);
errors.forEach(e => console.log('  ✗', e));
console.log(`警告: ${warnings.length}`);
warnings.forEach(w => console.log('  ⚠️ ', w));

if (errors.length === 0) {
    console.log('\n✅ 所有引用正确!');
}
