const fs = require('fs');

function checkPrefab(prefabPath, scriptType, expectedProps) {
    try {
        const d = JSON.parse(fs.readFileSync(prefabPath, 'utf8'));
        console.log(`\n=== ${prefabPath} ===`);
        console.log(`  Total elements: ${d.length}`);

        const prefab = d[0];
        if (prefab.__type__ !== 'cc.Prefab') {
            console.log('  FAIL: first element is not cc.Prefab');
            return false;
        }
        console.log(`  Prefab root id: ${prefab.data.__id__}`);

        const root = d[prefab.data.__id__];
        if (!root || root.__type__ !== 'cc.Node') {
            console.log('  FAIL: root is not cc.Node');
            return false;
        }
        console.log(`  Root name: ${root._name}`);
        console.log(`  Root children: ${root._children.length}`);

        const script = d.find(e => e.__type__ === scriptType);
        if (!script) {
            console.log(`  FAIL: script ${scriptType} NOT FOUND`);
            return false;
        }
        const scriptIdx = d.indexOf(script);
        console.log(`  Script at index: ${scriptIdx}`);

        let ok = true;
        for (const prop of expectedProps) {
            const val = script[prop];
            if (val === undefined) {
                console.log(`  FAIL: missing property "${prop}"`);
                ok = false;
            } else if (val === null) {
                console.log(`  WARN: property "${prop}" is null`);
            } else if (typeof val === 'object' && '__id__' in val) {
                const target = d[val.__id__];
                if (!target) {
                    console.log(`  FAIL: property "${prop}" references invalid __id__ ${val.__id__}`);
                    ok = false;
                } else {
                    console.log(`  OK: property "${prop}" → ${target.__type__} [${val.__id__}]`);
                }
            } else {
                console.log(`  OK: property "${prop}" = ${JSON.stringify(val).substring(0, 40)}`);
            }
        }
        return ok;
    } catch (e) {
        console.log(`  ERROR: ${e.message}`);
        return false;
    }
}

checkPrefab('assets/resources/prefabs/LevelCard.prefab',
    'a1b2c3d4e5f67890abcdef1234567809',
    ['nameLabel', 'descriptionLabel', 'difficultyLabel', 'timeLimitLabel', 'bestScoreLabel', 'difficultyBg', 'lockMask', 'completedBadge']);

checkPrefab('assets/resources/prefabs/WrongItemCard.prefab',
    'a1b2c3d4e5f67890abcdef1234567810',
    ['taskNumberLabel', 'descriptionLabel', 'playerActionLabel', 'correctActionLabel', 'reasonLabel', 'knowledgeLabel', 'knowledgePointLabel', 'expandButton', 'detailContainer', 'statusIcon']);

checkPrefab('assets/resources/prefabs/AdviceBubble.prefab',
    'a1b2c3d4e5f67890abcdef1234567811',
    ['contentLabel', 'iconSprite', 'backgroundSprite']);
