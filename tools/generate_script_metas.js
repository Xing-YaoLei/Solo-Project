const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function generateUUID() {
    const hex = crypto.randomBytes(16).toString('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function generateScriptMeta(scriptName) {
    return {
        ver: '4.0.23',
        importer: 'typescript',
        imported: true,
        uuid: generateUUID(),
        files: ['.js'],
        subMetas: {},
        userData: {
            isPlugin: false,
            sortIndex: 0,
            sourceMaps: false,
            loadPluginInWeb: false,
            loadPluginInNative: false,
            loadPluginInEditor: false,
        },
    };
}

function generateSceneMeta() {
    return {
        ver: '1.1.50',
        importer: 'scene',
        imported: true,
        uuid: generateUUID(),
        files: [],
        subMetas: {},
        userData: {},
    };
}

function writeMeta(filePath, metaObj) {
    const metaPath = `${filePath}.meta`;
    fs.writeFileSync(metaPath, JSON.stringify(metaObj, null, 2));
    return metaObj.uuid;
}

function updateSceneLauncherScript(scenePath, scriptUuid) {
    let content = fs.readFileSync(scenePath, 'utf-8');

    content = content.replace(
        /("_scriptAsset":\s*)null(,?)/g,
        `$1{"__uuid__": "${scriptUuid}", "__expectedType__": "cc.Script"}$2`
    );

    fs.writeFileSync(scenePath, content, 'utf-8');
    console.log(`✅ Updated scene with script UUID: ${scriptUuid}`);
}

function main() {
    const scriptsDir = path.join(__dirname, '..', 'assets', 'scripts');
    const scenesDir = path.join(__dirname, '..', 'assets', 'scenes');

    console.log('=== Generating script .meta files ===\n');

    const launcherMeta = generateScriptMeta('Launcher');
    const launcherPath = path.join(scriptsDir, 'Launcher.ts');
    const launcherUuid = writeMeta(launcherPath, launcherMeta);
    console.log(`  Launcher.ts uuid: ${launcherUuid}`);

    const appMeta = generateScriptMeta('App');
    const appPath = path.join(scriptsDir, 'App.ts');
    writeMeta(appPath, appMeta);
    console.log(`  App.ts uuid: ${appMeta.uuid}`);

    console.log('\n=== Updating scene file ===\n');

    const mainScenePath = path.join(scenesDir, 'Main.scene');
    if (fs.existsSync(mainScenePath)) {
        updateSceneLauncherScript(mainScenePath, launcherUuid);
    }

    const sceneMeta = generateSceneMeta();
    writeMeta(mainScenePath, sceneMeta);

    console.log('\n=== Done! ===');
}

main();
