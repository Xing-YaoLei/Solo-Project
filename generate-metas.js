const fs = require('fs');
const path = require('path');

function generateUUID(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
    }
    const h = Math.abs(hash).toString(16).padStart(8, '0');
    return `${h.substring(0, 8)}-${h.substring(0, 4)}-${h.substring(0, 4)}-${h.substring(0, 4)}-${h.padEnd(12, '0').substring(0, 12)}`;
}

function getScriptMeta(filePath) {
    const rel = path.relative(process.cwd(), filePath);
    const uuid = generateUUID(rel);
    return {
        "ver": "1.1.50",
        "importer": "typescript",
        "imported": true,
        "uuid": uuid,
        "files": [],
        "subMetas": {},
        "userData": {
            "id": "cc.UserScript"
        }
    };
}

function getJsonMeta(filePath) {
    const rel = path.relative(process.cwd(), filePath);
    const uuid = generateUUID(rel);
    return {
        "ver": "1.1.50",
        "importer": "json",
        "imported": true,
        "uuid": uuid,
        "files": [".json"],
        "subMetas": {},
        "userData": {}
    };
}

function getTmxMeta(filePath) {
    const rel = path.relative(process.cwd(), filePath);
    const uuid = generateUUID(rel);
    return {
        "ver": "1.1.50",
        "importer": "tiled-map",
        "imported": true,
        "uuid": uuid,
        "files": [],
        "subMetas": {},
        "userData": {}
    };
}

function getSceneMeta(filePath) {
    const rel = path.relative(process.cwd(), filePath);
    const uuid = generateUUID(rel);
    return {
        "ver": "1.1.50",
        "importer": "scene",
        "imported": true,
        "uuid": uuid,
        "files": [],
        "subMetas": {},
        "userData": {}
    };
}

function getDefaultMeta(filePath) {
    const rel = path.relative(process.cwd(), filePath);
    const uuid = generateUUID(rel);
    return {
        "ver": "1.1.50",
        "importer": "default",
        "imported": true,
        "uuid": uuid,
        "files": [],
        "subMetas": {},
        "userData": {}
    };
}

function walkDir(dir, callback) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        if (entry.isDirectory()) {
            walkDir(full, callback);
        } else {
            callback(full);
        }
    }
}

const assetsDir = path.join(process.cwd(), 'assets');
const uuidMap = {};

walkDir(assetsDir, (filePath) => {
    if (filePath.endsWith('.meta')) return;
    const metaPath = filePath + '.meta';
    if (fs.existsSync(metaPath)) {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        uuidMap[path.relative(process.cwd(), filePath)] = meta.uuid;
        return;
    }

    let meta;
    if (filePath.endsWith('.ts') || filePath.endsWith('.js')) {
        meta = getScriptMeta(filePath);
    } else if (filePath.endsWith('.json')) {
        meta = getJsonMeta(filePath);
    } else if (filePath.endsWith('.tmx') || filePath.endsWith('.tsx')) {
        meta = getTmxMeta(filePath);
    } else if (filePath.endsWith('.scene')) {
        meta = getSceneMeta(filePath);
    } else {
        meta = getDefaultMeta(filePath);
    }

    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    uuidMap[path.relative(process.cwd(), filePath)] = meta.uuid;
    console.log(`Generated: ${path.relative(process.cwd(), metaPath)} (${meta.uuid})`);
});

const uuidMapPath = path.join(process.cwd(), '.uuids.json');
fs.writeFileSync(uuidMapPath, JSON.stringify(uuidMap, null, 2));
console.log(`\nUUID map saved to: ${uuidMapPath}`);
console.log(`\nBootstrap UUID: ${uuidMap['assets/scripts/bootstrap.ts']}`);
console.log(`GameSceneLoader UUID: ${uuidMap['assets/scripts/utils/GameSceneLoader.ts']}`);
console.log(`MainMenu UUID: ${uuidMap['assets/scripts/ui/MainMenu.ts']}`);
console.log(`GameMain UUID: ${uuidMap['assets/scripts/scenes/GameMain.ts']}`);
