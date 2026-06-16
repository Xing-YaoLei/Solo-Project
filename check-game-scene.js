const fs = require('fs');
const path = require('path');

let errors = 0;
let passed = 0;

function checkScene(name, filePath, expectedScriptTypes) {
    console.log(`\n=== ${name} ===`);
    try {
        const d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (!Array.isArray(d)) { console.log('  FAIL: not an array'); errors++; return; }

        const scene = d.find(e => e.__type__ === 'cc.Scene');
        if (!scene) { console.log('  FAIL: no cc.Scene'); errors++; return; }

        const globalsIdx = scene._globals?.__id__;
        if (globalsIdx === undefined || globalsIdx >= d.length) {
            console.log(`  FAIL: globals __id__ ${globalsIdx} out of range (array length ${d.length})`);
            errors++;
        } else if (d[globalsIdx].__type__ !== 'cc.SceneGlobals') {
            console.log(`  FAIL: globals points to ${d[globalsIdx].__type__}, not cc.SceneGlobals`);
            errors++;
        } else {
            console.log(`  OK: SceneGlobals at index ${globalsIdx}`);
            passed++;
        }

        const canvas = d[1];
        if (!canvas || canvas.__type__ !== 'cc.Node') { console.log('  FAIL: no Canvas node at index 1'); errors++; return; }

        const children = canvas._children || [];
        let childErrors = 0;
        children.forEach((ref, i) => {
            const idx = ref.__id__;
            if (idx === undefined || idx >= d.length) {
                console.log(`  FAIL: Canvas child ${i} references index ${idx} out of range`);
                childErrors++;
            }
        });
        if (childErrors === 0) {
            console.log(`  OK: Canvas has ${children.length} children, all references valid`);
            passed++;
        } else {
            errors += childErrors;
        }

        for (const scriptType of expectedScriptTypes) {
            const script = d.find(e => e.__type__ === scriptType.type);
            if (!script) {
                console.log(`  FAIL: script ${scriptType.name} NOT FOUND`);
                errors++;
                continue;
            }
            const missingProps = [];
            for (const prop of scriptType.props) {
                if (!(prop in script)) {
                    missingProps.push(prop);
                }
            }
            if (missingProps.length > 0) {
                console.log(`  FAIL: ${scriptType.name} missing props: ${missingProps.join(', ')}`);
                errors++;
            } else {
                console.log(`  OK: ${scriptType.name} has all ${scriptType.props.length} properties bound`);
                passed++;
            }
        }
    } catch (e) {
        console.log(`  FAIL: JSON parse error: ${e.message}`);
        errors++;
    }
}

checkScene('MainMenu', 'assets/scenes/MainMenu.scene', [
    { name: 'MainMenuScene', type: 'a1b2c3d4e5f67890abcdef1234567801', props: ['playerNameLabel', 'playerRoleLabel', 'trainingTimeLabel', 'accuracyLabel', 'totalTasksLabel', 'formalTrainingButton', 'freePracticeButton', 'roleSelectPanel'] }
]);

checkScene('LevelSelect', 'assets/scenes/LevelSelect.scene', [
    { name: 'LevelSelectScene', type: 'a1b2c3d4e5f67890abcdef1234567802', props: ['modeLabel', 'roleFilterContainer', 'difficultyFilterContainer', 'levelScrollView', 'backButton', 'levelCountLabel'] }
]);

checkScene('Game', 'assets/scenes/Game.scene', [
    { name: 'GameScene', type: 'a1b2c3d4e5f67890abcdef1234567803', props: ['taskPanel', 'infoPanel', 'actionBar', 'tiledMapManager', 'prescriptionButton', 'replenishmentButton', 'insuranceButton', 'pausePanel', 'taskDescriptionLabel'] },
    { name: 'TaskPanel', type: 'a1b2c3d4e5f67890abcdef1234567806', props: ['taskNumberLabel', 'taskDescriptionLabel', 'timerLabel', 'scoreLabel', 'pauseButton'] },
    { name: 'ActionBar', type: 'a1b2c3d4e5f67890abcdef1234567805', props: ['approveButton', 'rejectButton', 'supplementButton', 'reportButton', 'feedbackPanel'] },
    { name: 'InfoPanel', type: 'a1b2c3d4e5f67890abcdef1234567807', props: ['prescriptionPanel', 'replenishmentPanel', 'insurancePanel', 'adviceContainer'] },
    { name: 'TiledMapManager', type: 'a1b2c3d4e5f67890abcdef1234567808', props: ['tiledMap', 'interactionLayer', 'highlightNode', 'areaHintLabel'] }
]);

checkScene('Result', 'assets/scenes/Result.scene', [
    { name: 'ResultScene', type: 'a1b2c3d4e5f67890abcdef1234567804', props: ['scoreLabel', 'gradeLabel', 'timeLabel', 'accuracyLabel', 'accuracyProgress', 'correctCountLabel', 'resultTitleLabel', 'levelNameLabel', 'wrongItemsScrollView', 'wrongItemsSection', 'retryButton', 'backButton', 'nextLevelButton', 'passedBadge', 'failedBadge'] }
]);

console.log(`\n=== SUMMARY: ${passed} passed, ${errors} errors ===`);
process.exit(errors > 0 ? 1 : 0);
