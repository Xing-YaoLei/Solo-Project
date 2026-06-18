import { GameManager, GameStateChangeListener, PlayerAction } from '../managers/GameManager';
import { sampleLevels } from '../data/sampleLevels';
import { TaskStep } from '../models';

describe('GameManager', () => {
  let gameManager: GameManager;

  beforeEach(() => {
    gameManager = new GameManager();
  });

  test('should initialize with menu phase', () => {
    const state = gameManager.getState();
    expect(state.phase).toBe('menu');
    expect(state.currentLevel).toBeNull();
    expect(state.totalScore).toBe(0);
    expect(state.errorCount).toBe(0);
  });

  test('should go to level select', () => {
    gameManager.goToLevelSelect();
    expect(gameManager.getState().phase).toBe('level_select');
  });

  test('should start a level correctly', () => {
    const level = sampleLevels[0];
    gameManager.startLevel(level);

    const state = gameManager.getState();
    expect(state.phase).toBe('briefing');
    expect(state.currentLevel?.id).toBe(level.id);
    expect(state.startTime).not.toBeNull();
  });

  test('should start gameplay from briefing', () => {
    const level = sampleLevels[0];
    gameManager.startLevel(level);
    gameManager.startGameplay();

    const state = gameManager.getState();
    expect(state.phase).toBe('playing');
    expect(state.currentStepIndex).toBe(0);
  });

  test('should get current step correctly', () => {
    const level = sampleLevels[0];
    gameManager.startLevel(level);
    gameManager.startGameplay();

    const step = gameManager.getCurrentStep();
    expect(step).not.toBeNull();
    expect(step?.stepNumber).toBe(1);
  });

  test('should submit correct action and earn points', () => {
    const level = sampleLevels[0];
    gameManager.startLevel(level);
    gameManager.startGameplay();

    const step = gameManager.getCurrentStep()!;
    const correctAction = step.availableActions.find((a) => a.isCorrect)!;
    const action = gameManager.submitAction(correctAction.id);

    expect(action.isCorrect).toBe(true);
    expect(action.pointsEarned).toBe(100);
    expect(action.pointsDeducted).toBe(0);
    expect(gameManager.getState().totalScore).toBe(100);
  });

  test('should submit wrong action and deduct points', () => {
    const level = sampleLevels[0];
    gameManager.startLevel(level);
    gameManager.startGameplay();

    const step = gameManager.getCurrentStep()!;
    const wrongAction = step.availableActions.find((a) => !a.isCorrect)!;
    const action = gameManager.submitAction(wrongAction.id);

    expect(action.isCorrect).toBe(false);
    expect(action.pointsEarned).toBe(0);
    expect(action.pointsDeducted).toBeGreaterThan(0);
    expect(gameManager.getState().errorCount).toBe(1);
  });

  test('should progress to next step after action', () => {
    const level = sampleLevels[0];
    gameManager.startLevel(level);
    gameManager.startGameplay();

    expect(gameManager.getState().currentStepIndex).toBe(0);

    const step = gameManager.getCurrentStep()!;
    const correctAction = step.availableActions.find((a) => a.isCorrect)!;
    gameManager.submitAction(correctAction.id);

    expect(gameManager.getState().currentStepIndex).toBe(1);
  });

  test('should end game after all steps completed', () => {
    const level = sampleLevels[0];
    gameManager.startLevel(level);
    gameManager.startGameplay();

    const totalSteps = level.task.steps.length;
    for (let i = 0; i < totalSteps; i++) {
      const step = gameManager.getCurrentStep()!;
      const correctAction = step.availableActions.find((a) => a.isCorrect)!;
      gameManager.submitAction(correctAction.id);
    }

    expect(gameManager.getState().phase).toBe('result');
    expect(gameManager.getState().endTime).not.toBeNull();
  });

  test('should calculate result correctly for perfect game', () => {
    const level = sampleLevels[0];
    gameManager.startLevel(level);
    gameManager.startGameplay();

    const totalSteps = level.task.steps.length;
    for (let i = 0; i < totalSteps; i++) {
      const step = gameManager.getCurrentStep()!;
      const correctAction = step.availableActions.find((a) => a.isCorrect)!;
      gameManager.submitAction(correctAction.id);
    }

    const result = gameManager.calculateResult();
    expect(result.totalScore).toBe(totalSteps * 100);
    expect(result.errorCount).toBe(0);
    expect(result.accuracyPercentage).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.grade).toBe('S');
  });

  test('should call state change listeners', () => {
    const listener: GameStateChangeListener = {
      onStateChange: jest.fn(),
      onActionSubmitted: jest.fn(),
      onGameComplete: jest.fn(),
      onStepChange: jest.fn()
    };

    gameManager.addListener(listener);
    gameManager.goToLevelSelect();

    expect(listener.onStateChange).toHaveBeenCalled();

    const level = sampleLevels[0];
    gameManager.startLevel(level);
    gameManager.startGameplay();

    expect(listener.onStepChange).toHaveBeenCalled();

    const step = gameManager.getCurrentStep()!;
    const correctAction = step.availableActions.find((a) => a.isCorrect)!;
    gameManager.submitAction(correctAction.id);

    expect(listener.onActionSubmitted).toHaveBeenCalled();
  });

  test('should return hint for current step', () => {
    const level = sampleLevels[0];
    gameManager.startLevel(level);
    gameManager.startGameplay();

    const hint = gameManager.getHint();
    expect(hint).not.toBeNull();
    expect(typeof hint).toBe('string');
  });

  test('should format time correctly', () => {
    expect(gameManager.formatTime(0)).toBe('00:00');
    expect(gameManager.formatTime(5000)).toBe('00:05');
    expect(gameManager.formatTime(65000)).toBe('01:05');
    expect(gameManager.formatTime(3665000)).toBe('61:05');
  });

  test('should go back to menu correctly', () => {
    const level = sampleLevels[0];
    gameManager.startLevel(level);
    gameManager.goToMenu();

    const state = gameManager.getState();
    expect(state.phase).toBe('menu');
    expect(state.currentLevel).toBeNull();
    expect(state.totalScore).toBe(0);
    expect(state.actions).toHaveLength(0);
  });

  test('should retry level correctly', () => {
    const level = sampleLevels[0];
    gameManager.startLevel(level);
    gameManager.startGameplay();

    const step = gameManager.getCurrentStep()!;
    const wrongAction = step.availableActions.find((a) => !a.isCorrect)!;
    gameManager.submitAction(wrongAction.id);

    expect(gameManager.getState().errorCount).toBe(1);

    gameManager.retryLevel();
    expect(gameManager.getState().errorCount).toBe(0);
    expect(gameManager.getState().phase).toBe('briefing');
  });

  test('should calculate grade correctly', () => {
    const level = sampleLevels[0];
    gameManager.startLevel(level);
    gameManager.startGameplay();

    const totalSteps = level.task.steps.length;
    for (let i = 0; i < totalSteps; i++) {
      const step = gameManager.getCurrentStep()!;
      const correctAction = step.availableActions.find((a) => a.isCorrect)!;
      gameManager.submitAction(correctAction.id);
    }

    const result = gameManager.calculateResult();
    expect(['S', 'A', 'B', 'C', 'D', 'F']).toContain(result.grade);
  });
});
