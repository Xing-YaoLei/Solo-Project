import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { LoadScene } from '../scenes/LoadScene';
import { InspectionScene } from '../scenes/InspectionScene';

class GameInstance {
  private game: Phaser.Game | null = null;
  private container: HTMLElement | null = null;
  private inspectionScene: InspectionScene | null = null;

  init(container: HTMLElement, levelId: string): Promise<void> {
    return new Promise((resolve) => {
      this.container = container;
      
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 500,
        parent: container,
        transparent: true,
        physics: {
          default: 'matter',
          matter: {
            gravity: { x: 0, y: 0 },
            debug: false,
          },
        },
        scene: [BootScene, LoadScene, InspectionScene],
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
      };

      this.game = new Phaser.Game(config);

      this.game.events.once('ready', () => {
        this.game?.scene.start('BootScene');

        const checkScene = () => {
          const scene = this.game?.scene.getScene('InspectionScene') as InspectionScene | null;
          if (scene && scene.scene.isActive()) {
            this.inspectionScene = scene;
            resolve();
          } else {
            setTimeout(checkScene, 100);
          }
        };

        setTimeout(() => {
          this.game?.scene.start('LoadScene', { levelId });
          checkScene();
        }, 200);
      });
    });
  }

  getInspectionScene(): InspectionScene | null {
    if (this.inspectionScene) {
      return this.inspectionScene;
    }
    const scene = this.game?.scene.getScene('InspectionScene') as InspectionScene | null;
    return scene || null;
  }

  destroy() {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
    this.inspectionScene = null;
    this.container = null;
  }
}

export const gameInstance = new GameInstance();
export default gameInstance;
