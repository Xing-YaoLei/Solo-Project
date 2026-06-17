const fs = require('fs');
const path = require('path');

const TRANSFORM_VAR_PATTERNS = [
    /^transform$/,
    /^t$/,
    /^uiTransform$/,
    /Transform$/,
    /_transform$/,
];

function isTransformVar(varName) {
    return TRANSFORM_VAR_PATTERNS.some(pattern => pattern.test(varName));
}

const OPACITY_VAR_PATTERNS = [
    /^opacity$/,
    /^uiOpacity$/,
    /Opacity$/,
    /_opacity$/,
];

function isOpacityVar(varName) {
    return OPACITY_VAR_PATTERNS.some(pattern => pattern.test(varName));
}

function addNodeUtilImport(content, importPathPrefix) {
    if (content.includes('NodeUtil')) {
        return content;
    }

    const importRegex = /(import\s+\{\s*[^}]*\}\s+from\s+['"]\.\.?\/utils\/ResourceGenerator['"];?\n)/;
    if (importRegex.test(content)) {
        return content.replace(
            importRegex,
            `$1import { NodeUtil } from '${importPathPrefix}utils/NodeUtil';\n`
        );
    }

    const firstImportRegex = /(import\s+.*from\s+['"]\.\.?\/.*['"];?\n)/;
    const match = content.match(firstImportRegex);
    if (match) {
        const idx = content.indexOf(match[0]) + match[0].length;
        return content.slice(0, idx) + `import { NodeUtil } from '${importPathPrefix}utils/NodeUtil';\n` + content.slice(idx);
    }

    return content;
}

function fixFile(filePath, importPrefix) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let changed = false;

    content = addNodeUtilImport(content, importPrefix);
    changed = true;

    const setContentSizeRegex = /([a-zA-Z_$][a-zA-Z0-9_$]*)\.setContentSize\(\s*([^)]+)\s*\)/g;
    let newContent = content.replace(setContentSizeRegex, (match, varName, args) => {
        if (isTransformVar(varName)) {
            return match;
        }
        changed = true;
        return `NodeUtil.setContentSize(${varName}, ${args})`;
    });
    content = newContent;

    const opacityRegex = /([a-zA-Z_$][a-zA-Z0-9_$]*)\.opacity\s*=\s*([^;]+);/g;
    newContent = content.replace(opacityRegex, (match, varName, value) => {
        if (isOpacityVar(varName) || varName.startsWith('node.getComponent') || value.includes('=>')) {
            return match;
        }
        if (value.includes('?') || value.includes('||') || value.includes('&&')) {
            return match;
        }
        changed = true;
        return `NodeUtil.setOpacity(${varName}, ${value});`;
    });
    content = newContent;

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
    } else {
        console.log(`⏭️  Skipped: ${path.relative(process.cwd(), filePath)}`);
    }

    return changed;
}

function main() {
    const files = [
        { path: 'assets/scripts/App.ts', prefix: './' },
        { path: 'assets/scripts/utils/UIBuilder.ts', prefix: './' },
        { path: 'assets/scripts/TiledMapController.ts', prefix: './' },
        { path: 'assets/scripts/Launcher.ts', prefix: './' },
        { path: 'assets/scripts/utils/ScorePopup.ts', prefix: '../' },
        { path: 'assets/scripts/utils/AnimationHelper.ts', prefix: '../' },
        { path: 'assets/scripts/TutorialManager.ts', prefix: './' },
        { path: 'assets/scripts/MainMenu.ts', prefix: './' },
        { path: 'assets/scripts/GameController.ts', prefix: './' },
    ];

    console.log('=== Fixing Cocos Creator 3.8 API usage ===\n');

    let totalFixed = 0;
    files.forEach(file => {
        const fullPath = path.join(process.cwd(), file.path);
        if (fs.existsSync(fullPath)) {
            if (fixFile(fullPath, file.prefix)) {
                totalFixed++;
            }
        } else {
            console.log(`⚠️  Not found: ${file.path}`);
        }
    });

    console.log(`\n🎉 Done! Fixed ${totalFixed} files.`);
}

main();
