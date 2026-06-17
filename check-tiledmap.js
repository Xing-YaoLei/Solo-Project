const fs = require('fs');

const d = JSON.parse(fs.readFileSync('assets/scenes/Game.scene', 'utf8'));

const tiledMapComp = d.find(e => e.__type__ === 'cc.TiledMap');
if (tiledMapComp) {
    const idx = d.indexOf(tiledMapComp);
    console.log(`TiledMap component at index ${idx}:`);
    Object.keys(tiledMapComp).forEach(k => {
        if (k.startsWith('_') || k === '__type__') return;
        const v = tiledMapComp[k];
        if (v && typeof v === 'object' && '__uuid__' in v) {
            console.log(`  ${k}: {uuid: ${v.__uuid__}}`);
        } else if (v && typeof v === 'object' && '__id__' in v) {
            console.log(`  ${k}: {id: ${v.__id__}}`);
        } else {
            console.log(`  ${k}:`, JSON.stringify(v).substring(0, 60));
        }
    });
} else {
    console.log('cc.TiledMap NOT FOUND in Game.scene');
}
