const fs = require('fs');

function findScriptProps(scenePath, scriptType, props) {
    const d = JSON.parse(fs.readFileSync(scenePath, 'utf8'));
    const script = d.find(e => e.__type__ === scriptType);
    if (!script) {
        console.log(`${scenePath}: script ${scriptType} NOT FOUND`);
        return;
    }
    const idx = d.indexOf(script);
    console.log(`\n${scenePath} [index ${idx}]:`);
    for (const prop of props) {
        const val = script[prop];
        if (val === undefined) {
            console.log(`  ${prop}: <MISSING>`);
        } else if (val === null) {
            console.log(`  ${prop}: null`);
        } else if (typeof val === 'object' && '__uuid__' in val) {
            console.log(`  ${prop}: {uuid: ${val.__uuid__}, type: ${val.__expectedType__ || '?'}}`);
        } else {
            console.log(`  ${prop}:`, JSON.stringify(val).substring(0, 80));
        }
    }
}

findScriptProps('assets/scenes/LevelSelect.scene', 'a1b2c3d4e5f67890abcdef1234567802',
    ['levelCardPrefab', 'levelScrollView', 'modeLabel', 'backButton', 'levelCountLabel']);

findScriptProps('assets/scenes/Result.scene', 'a1b2c3d4e5f67890abcdef1234567804',
    ['wrongItemCardPrefab', 'scoreLabel', 'wrongItemsScrollView', 'retryButton']);

findScriptProps('assets/scenes/Game.scene', 'a1b2c3d4e5f67890abcdef1234567807',
    ['adviceBubblePrefab', 'prescriptionPanel', 'adviceContainer']);
