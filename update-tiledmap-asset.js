const fs = require('fs');

const d = JSON.parse(fs.readFileSync('assets/scenes/Game.scene', 'utf8'));
const tiledMapComp = d.find(e => e.__type__ === 'cc.TiledMap');
if (!tiledMapComp) {
    console.log('ERROR: cc.TiledMap not found');
    process.exit(1);
}

tiledMapComp.tmxAsset = { __uuid__: 'c1b2c3d4-e5f6-7890-abcd-ef1234567804' };

fs.writeFileSync('assets/scenes/Game.scene', JSON.stringify(d, null, 2));
console.log('TiledMap.tmxAsset → pharmacy.tmx (c1b2c3d4-e5f6-7890-abcd-ef1234567804)');
