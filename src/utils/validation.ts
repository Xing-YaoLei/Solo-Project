import type { GameTask, ActionType, ValidationResult } from '../types/game';
import { calculateScore, calculateErrorPenalty, getErrorCategory } from './scoring';

export function validateAction(
  task: GameTask,
  selectedAction: ActionType,
  responseTime: number,
  combo: number
): ValidationResult {
  const isCorrect = selectedAction === task.correctAction;

  let points: number;
  let errorCategory: string | undefined;

  if (isCorrect) {
    points = calculateScore(task.points, responseTime, combo, task.timeLimit);
  } else {
    points = calculateErrorPenalty(task.points);
    errorCategory = getErrorCategory(selectedAction, task.correctAction);
  }

  return {
    isCorrect,
    correctAction: task.correctAction,
    reason: task.correctReason,
    points,
    errorCategory,
  };
}

export function checkImagesCompleteness(task: GameTask): {
  complete: boolean;
  missingImages: string[];
} {
  const allRequiredImages: string[] = [];
  task.treatmentPlan.steps.forEach(step => {
    allRequiredImages.push(...step.requiredImages);
  });

  const availableImageIds = task.images.map(img => img.id);
  const missingImages = allRequiredImages.filter(id => !availableImageIds.includes(id));

  return {
    complete: missingImages.length === 0,
    missingImages,
  };
}

export function hasFollowUpTask(task: GameTask): boolean {
  return !!task.treatmentPlan.followUp;
}

export function hasMissedAppointment(task: GameTask): boolean {
  return task.correctAction === 'missed_appointment';
}

export function needsDoctorReview(task: GameTask): boolean {
  return task.correctAction === 'forward_doctor';
}

export function needsFrontdeskReview(task: GameTask): boolean {
  return task.correctAction === 'forward_front';
}

export function hasQualityIssues(task: GameTask): boolean {
  return task.correctAction === 'return_quality';
}

export function canArchive(task: GameTask): boolean {
  const completeness = checkImagesCompleteness(task);
  const hasFollowUp = hasFollowUpTask(task);
  const hasMissed = hasMissedAppointment(task);
  const needsDoctor = needsDoctorReview(task);
  const needsFrontdesk = needsFrontdeskReview(task);
  const hasQuality = hasQualityIssues(task);

  return (
    completeness.complete &&
    !hasFollowUp &&
    !hasMissed &&
    !needsDoctor &&
    !needsFrontdesk &&
    !hasQuality
  );
}
