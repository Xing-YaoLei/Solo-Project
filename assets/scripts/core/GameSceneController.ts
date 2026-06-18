import { EventManager, GameEvents } from '../utils/EventManager';
import { GameManager } from '../managers/GameManager';
import { DataManager } from '../managers/DataManager';
import { LevelManager } from '../managers/LevelManager';
import { ScoreManager } from '../managers/ScoreManager';
import { LeaderboardManager } from '../managers/LeaderboardManager';
import { TutorialManager } from '../managers/TutorialManager';
import { AudioManager } from '../managers/AudioManager';
import { InputManager, InputAction } from '../managers/InputManager';
import { HUD } from '../ui/HUD';
import { TaskBriefingPanel } from '../ui/TaskBriefingPanel';
import { CluePanel } from '../ui/CluePanel';
import { DocumentPanel } from '../ui/DocumentPanel';
import { ApprovalPanel } from '../ui/ApprovalPanel';
import { ResultPanel } from '../ui/ResultPanel';
import { ReviewPanel } from '../ui/ReviewPanel';
import { TutorialUI } from '../ui/TutorialUI';
import { GamePhase } from '../core/GameState';

export class GameSceneController {
  private _node: any = null;
  private _canvas: any = null;

  private _hud: HUD | null = null;
  private _taskBriefingPanel: TaskBriefingPanel | null = null;
  private _cluePanel: CluePanel | null = null;
  private _documentPanel: DocumentPanel | null = null;
  private _approvalPanel: ApprovalPanel | null = null;
  private _resultPanel: ResultPanel | null = null;
  private _reviewPanel: ReviewPanel | null = null;
  private _tutorialUI: TutorialUI | null = null;

  private _initialized: boolean = false;

  constructor(node?: any) {
    this._node = node || null;
  }

  public async init(): Promise<void> {
    if (this._initialized) return;

    await this.initManagers();
    this.initUI();
    this.registerEvents();
    this._initialized = true;
  }

  private async initManagers(): Promise<void> {
    GameManager.instance.init();
    ScoreManager.instance.init();
    LeaderboardManager.instance.init();
    TutorialManager.instance.init();
    AudioManager.instance.init();
    InputManager.instance.attach();

    await DataManager.instance.loadAllConfig();
    await TutorialManager.instance.loadTutorials();
  }

  private initUI(): void {
    if (!this._node) return;

    const hudNode = this._node.getChildByName('HUD');
    if (hudNode) {
      this._hud = new HUD(hudNode);
    }

    const taskPanelNode = this._node.getChildByName('TaskBriefingPanel');
    if (taskPanelNode) {
      this._taskBriefingPanel = new TaskBriefingPanel(taskPanelNode);
    }

    const cluePanelNode = this._node.getChildByName('CluePanel');
    if (cluePanelNode) {
      this._cluePanel = new CluePanel(cluePanelNode);
    }

    const docPanelNode = this._node.getChildByName('DocumentPanel');
    if (docPanelNode) {
      this._documentPanel = new DocumentPanel(docPanelNode);
    }

    const approvalPanelNode = this._node.getChildByName('ApprovalPanel');
    if (approvalPanelNode) {
      this._approvalPanel = new ApprovalPanel(approvalPanelNode);
    }

    const resultPanelNode = this._node.getChildByName('ResultPanel');
    if (resultPanelNode) {
      this._resultPanel = new ResultPanel(resultPanelNode);
    }

    const reviewPanelNode = this._node.getChildByName('ReviewPanel');
    if (reviewPanelNode) {
      this._reviewPanel = new ReviewPanel(reviewPanelNode);
    }

    const tutorialUINode = this._node.getChildByName('TutorialUI');
    if (tutorialUINode) {
      this._tutorialUI = new TutorialUI(tutorialUINode);
    }
  }

  private registerEvents(): void {
    EventManager.instance.on(GameEvents.PHASE_CHANGED, this.onPhaseChanged.bind(this));
    EventManager.instance.on(GameEvents.INPUT_ACTION, this.onInputAction.bind(this));
  }

  private onPhaseChanged(phase: GamePhase): void {
    this.updatePanelVisibility(phase);
  }

  private updatePanelVisibility(phase: GamePhase): void {
    this._taskBriefingPanel?.hide();
    this._cluePanel?.hide();
    this._documentPanel?.hide();
    this._approvalPanel?.hide();
    this._resultPanel?.hide();
    this._reviewPanel?.hide();

    switch (phase) {
      case 'task_briefing':
        this._taskBriefingPanel?.show();
        break;
      case 'clue_investigation':
        this._cluePanel?.show();
        break;
      case 'document_editing':
        this._documentPanel?.show();
        break;
      case 'approval':
        this._approvalPanel?.show();
        break;
      case 'result':
        this._resultPanel?.show();
        break;
      case 'review':
        this._reviewPanel?.show();
        break;
    }
  }

  private onInputAction(action: InputAction, source: string): void {
    if (!GameManager.instance.isRunning) return;
    if (GameManager.instance.gameState?.isPaused) {
      if (action === 'pause' || action === 'cancel') {
        GameManager.instance.resumeGame();
      }
      return;
    }

    const phase = GameManager.instance.gameState?.currentPhase;
    if (!phase) return;

    switch (phase) {
      case 'task_briefing':
        this.handleTaskBriefingInput(action);
        break;
      case 'clue_investigation':
        this.handleClueInput(action);
        break;
      case 'document_editing':
        this.handleDocumentInput(action);
        break;
      case 'approval':
        this.handleApprovalInput(action);
        break;
      case 'result':
        this.handleResultInput(action);
        break;
      case 'review':
        this.handleReviewInput(action);
        break;
    }

    if (action === 'pause') {
      GameManager.instance.pauseGame();
    }

    if (action === 'restart') {
      GameManager.instance.restartLevel();
    }
  }

  private handleTaskBriefingInput(action: InputAction): void {
    if (action === 'confirm' || action === 'next') {
      this._taskBriefingPanel?.onStartClick();
    } else if (action === 'cancel') {
      this._taskBriefingPanel?.onCancelClick();
    }
  }

  private handleClueInput(action: InputAction): void {
    if (action === 'left' || action === 'prev') {
      this._cluePanel?.onPrevClick();
    } else if (action === 'right' || action === 'next') {
      this._cluePanel?.onNextClick();
    } else if (action === 'confirm') {
      this._cluePanel?.onConfirmClick();
    } else if (action === 'up' || action === 'page_up') {
    } else if (action === 'down' || action === 'page_down') {
    }
  }

  private handleDocumentInput(action: InputAction): void {
    if (action === 'up' || action === 'prev') {
    } else if (action === 'down' || action === 'next') {
    } else if (action === 'left') {
      this._documentPanel?.onQuantityDecrease();
    } else if (action === 'right') {
      this._documentPanel?.onQuantityIncrease();
    } else if (action === 'confirm') {
      this._documentPanel?.onConfirmClick();
    } else if (action === 'cancel') {
      this._documentPanel?.onBackClick();
    } else if (action === 'select_1') {
      this._documentPanel?.onPriceDecrease();
    } else if (action === 'select_2') {
      this._documentPanel?.onPriceIncrease();
    }
  }

  private handleApprovalInput(action: InputAction): void {
    if (action === 'select_1') {
      this._approvalPanel?.onChoice1Click();
    } else if (action === 'select_2') {
      this._approvalPanel?.onChoice2Click();
    } else if (action === 'select_3') {
      this._approvalPanel?.onChoice3Click();
    } else if (action === 'select_4') {
      this._approvalPanel?.onChoice4Click();
    } else if (action === 'confirm') {
      this._approvalPanel?.onConfirmClick();
    }
  }

  private handleResultInput(action: InputAction): void {
    if (action === 'confirm' || action === 'restart') {
      this._resultPanel?.onRestartClick();
    } else if (action === 'select_1') {
      this._resultPanel?.onRestartClick();
    } else if (action === 'select_2') {
      this._resultPanel?.onReviewClick();
    } else if (action === 'select_3') {
      this._resultPanel?.onMenuClick();
    }
  }

  private handleReviewInput(action: InputAction): void {
    if (action === 'cancel') {
      this._reviewPanel?.onBackClick();
    } else if (action === 'restart') {
      this._reviewPanel?.onRestartClick();
    } else if (action === 'select_1') {
      this._reviewPanel?.onTab1Click();
    } else if (action === 'select_2') {
      this._reviewPanel?.onTab2Click();
    } else if (action === 'select_3') {
      this._reviewPanel?.onTab3Click();
    }
  }

  public startGame(levelId: string): void {
    GameManager.instance.startLevel(levelId);
  }

  public update(dt: number): void {
  }

  public destroy(): void {
    InputManager.instance.detach();
    EventManager.instance.clear();
  }
}
