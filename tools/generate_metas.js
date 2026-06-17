const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function generateUUID() {
    const hex = crypto.randomBytes(16).toString('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function generateImageMeta() {
    return {
        ver: '1.1.50',
        importer: 'image',
        imported: true,
        uuid: generateUUID(),
        files: ['.json'],
        subMetas: {
            '6c48a': {
                importer: 'texture',
                uuid: generateUUID(),
                userData: {
                    wrapModeS: 'clamp-to-edge',
                    wrapModeT: 'clamp-to-edge',
                    minfilter: 'linear',
                    magfilter: 'linear',
                    mipfilter: 'none',
                    anisotropy: 0,
                    isUuid: false,
                    imageUuidOrDatabaseUri: '',
                },
                displayName: 'texture',
                id: '6c48a',
                name: 'texture',
                userData: {},
            },
        },
        userData: {
            type: 'sprite-frame',
            hasAlpha: true,
            fixAlphaTransparencyArtifacts: false,
            redirect: '6c48a',
        },
    };
}

function generateTmxMeta() {
    return {
        ver: '1.1.50',
        importer: 'tiled-map',
        imported: true,
        uuid: generateUUID(),
        files: ['.json'],
        subMetas: {},
        userData: {},
    };
}

function writeMeta(filePath, metaObj) {
    const metaPath = `${filePath}.meta`;
    fs.writeFileSync(metaPath, JSON.stringify(metaObj, null, 2));
    console.log(`✅ Generated .meta for: ${path.relative(process.cwd(), filePath)}`);
    return metaObj.uuid;
}

function main() {
    const assetsDir = path.join(__dirname, '..', 'assets');
    const tiledDir = path.join(assetsDir, 'tiled');
    const resourcesTiledDir = path.join(assetsDir, 'resources', 'tiled');

    const processDir = (dir) => {
        if (!fs.existsSync(dir)) return;

        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            const metaPath = `${fullPath}.meta`;

            if (fs.existsSync(metaPath)) {
                console.log(`⏭️  Skipping (meta exists): ${file}`);
                return;
            }

            if (file.endsWith('.png') || file.endsWith('.jpg')) {
                writeMeta(fullPath, generateImageMeta());
            } else if (file.endsWith('.tmx')) {
                writeMeta(fullPath, generateTmxMeta());
            }
        });
    };

    console.log('=== Generating Cocos Creator .meta files ===\n');

    console.log('Processing assets/tiled/:');
    processDir(tiledDir);

    console.log('\nProcessing assets/resources/tiled/:');
    processDir(resourcesTiledDir);

    console.log('\n🎉 .meta generation complete!');
}

main();
