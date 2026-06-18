import { UIBase } from './UIBase';
import { GameManager } from '../managers/GameManager';
import { LevelManager } from '../managers/LevelManager';
import { LeaderboardManager } from '../managers/LeaderboardManager';
import { TutorialManager } from '../managers/TutorialManager';
import { AudioManager } from '../managers/AudioManager';

export class MainMenu extends UIBase {
  constructor(node?: any) {
    super(node);
  }

  public onStartGame(): void {
    AudioManager.instance.playClick();
  }

  public onLevelSelect(): void {
    AudioManager.instance.playClick();
  }

  public onLeaderboard(): void {
    AudioManager.instance.playClick();
  }

  public onTutorial(): void {
    AudioManager.instance.playClick();
    TutorialManager.instance.startTutorial('basic_gameplay');
  }

  public onSettings(): void {
    AudioManager.instance.playClick();
  }

  public onResetProgress(): void {
    if (confirm('确定要重置所有进度吗？此操作不可撤销！')) {
      LevelManager.instance.resetProgress();
      LeaderboardManager.instance.clearAll();
      TutorialManager.instance.resetProgress();
      alert('进度已重置');
    }
  }
}
