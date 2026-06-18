import { LevelManager } from '../managers/LevelManager';
import { Position } from '../models';
import { sampleLevels } from '../data/sampleLevels';

describe('LevelManager', () => {
  let levelManager: LevelManager;

  beforeEach(() => {
    levelManager = new LevelManager();
  });

  test('should initialize with sample levels', () => {
    const levels = levelManager.getAllLevels();
    expect(levels.length).toBeGreaterThan(0);
    expect(levels.length).toBe(sampleLevels.length);
  });

  test('should build level groups correctly', () => {
    const groups = levelManager.getLevelGroups();
    expect(groups.length).toBeGreaterThan(0);

    groups.forEach((group) => {
      expect(group.id).toBeDefined();
      expect(group.name).toBeDefined();
      expect(group.position).toBeDefined();
      expect(Array.isArray(group.levels)).toBe(true);
    });
  });

  test('should filter levels by position', () => {
    const transferLevels = levelManager.getLevelsByPosition('过户专员');
    expect(transferLevels.length).toBeGreaterThan(0);
    transferLevels.forEach((level) => {
      expect(level.position).toBe('过户专员');
    });

    const financeLevels = levelManager.getLevelsByPosition('金融专员');
    expect(financeLevels.length).toBeGreaterThan(0);
    financeLevels.forEach((level) => {
      expect(level.position).toBe('金融专员');
    });
  });

  test('should find level by id', () => {
    const firstLevel = sampleLevels[0];
    const found = levelManager.getLevelById(firstLevel.id);
    expect(found).toBeDefined();
    expect(found?.id).toBe(firstLevel.id);
    expect(found?.name).toBe(firstLevel.name);
  });

  test('should return undefined for non-existent level', () => {
    const found = levelManager.getLevelById('non_existent_id');
    expect(found).toBeUndefined();
  });

  test('should filter levels by difficulty', () => {
    const easyLevels = levelManager.getLevelsByDifficulty(1, 2);
    easyLevels.forEach((level) => {
      expect(level.difficulty).toBeGreaterThanOrEqual(1);
      expect(level.difficulty).toBeLessThanOrEqual(2);
    });

    const hardLevels = levelManager.getLevelsByDifficulty(4, 5);
    hardLevels.forEach((level) => {
      expect(level.difficulty).toBeGreaterThanOrEqual(4);
      expect(level.difficulty).toBeLessThanOrEqual(5);
    });
  });

  test('should find levels with missing materials', () => {
    const missingLevels = levelManager.getLevelsWithMissingMaterials();
    missingLevels.forEach((level) => {
      expect(level.hasMissingMaterials).toBe(true);
      expect(level.missingMaterialsCount).toBeGreaterThan(0);
    });
  });

  test('should filter levels with combined options', () => {
    const filtered = levelManager.filterLevels({
      position: '过户专员',
      difficulty: 1
    });

    filtered.forEach((level) => {
      expect(level.position).toBe('过户专员');
      expect(level.difficulty).toBe(1);
    });
  });

  test('should get random level', () => {
    const level1 = levelManager.getRandomLevel();
    const level2 = levelManager.getRandomLevel();
    expect(level1).toBeDefined();
    expect(level2).toBeDefined();
    expect(['过户专员', '金融专员', '评估师', '综合岗位']).toContain(level1.position);
  });

  test('should get random level by position', () => {
    const level = levelManager.getRandomLevel('金融专员');
    expect(level.position).toBe('金融专员');
  });

  test('should have valid level data structure', () => {
    const levels = levelManager.getAllLevels();

    levels.forEach((level) => {
      expect(level.id).toBeDefined();
      expect(level.name).toBeDefined();
      expect(level.description).toBeDefined();
      expect(level.position).toBeDefined();
      expect(level.difficulty).toBeGreaterThanOrEqual(1);
      expect(level.difficulty).toBeLessThanOrEqual(5);
      expect(level.estimatedTimeMinutes).toBeGreaterThan(0);
      expect(level.task).toBeDefined();
      expect(level.task.steps.length).toBeGreaterThan(0);
      expect(level.vehicleArchive).toBeDefined();
      expect(level.quoteHistory).toBeDefined();
      expect(level.financeDocuments).toBeDefined();
    });
  });

  test('should have valid task steps', () => {
    const levels = levelManager.getAllLevels();

    levels.forEach((level) => {
      level.task.steps.forEach((step, idx) => {
        expect(step.stepNumber).toBe(idx + 1);
        expect(step.prompt).toBeDefined();
        expect(step.availableActions.length).toBeGreaterThanOrEqual(2);
        expect(step.correctActionId).toBeDefined();

        const correctCount = step.availableActions.filter((a) => a.isCorrect).length;
        expect(correctCount).toBe(1);

        const correctAction = step.availableActions.find((a) => a.id === step.correctActionId);
        expect(correctAction).toBeDefined();
        expect(correctAction?.isCorrect).toBe(true);
      });
    });
  });
});
