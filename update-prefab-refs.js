const fs = require('fs');

function setPrefabRef(scenePath, scriptType, propName, prefabUuid) {
    const d = JSON.parse(fs.readFileSync(scenePath, 'utf8'));
    const script = d.find(e => e.__type__ === scriptType);
    if (!script) {
        console.log(`ERROR: ${scenePath} script ${scriptType} not found`);
        return false;
    }
    script[propName] = { __uuid__: prefabUuid };
    fs.writeFileSync(scenePath, JSON.stringify(d, null, 2));
    console.log(`${scenePath}: ${propName} → ${prefabUuid}`);
    return true;
}

// LevelSelect - levelCardPrefab
setPrefabRef('assets/scenes/LevelSelect.scene',
    'a1b2c3d4e5f67890abcdef1234567802',
    'levelCardPrefab',
    'c1b2c3d4-e5f6-7890-abcd-ef1234567801');

// Result - wrongItemCardPrefab
setPrefabRef('assets/scenes/Result.scene',
    'a1b2c3d4e5f67890abcdef1234567804',
    'wrongItemCardPrefab',
    'c1b2c3d4-e5f6-7890-abcd-ef1234567802');

// Game/InfoPanel - adviceBubblePrefab
setPrefabRef('assets/scenes/Game.scene',
    'a1b2c3d4e5f67890abcdef1234567807',
    'adviceBubblePrefab',
    'c1b2c3d4-e5f6-7890-abcd-ef1234567803');

console.log('\nAll prefab refs updated.');
