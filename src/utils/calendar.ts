export interface CalendarTask {
  id: string
  startTime: Date | string
  endTime: Date | string
  assignedTo: string
  roomId?: string
  priority?: number
}

export interface TimeConflictResult {
  hasConflict: boolean
  task1Id: string
  task2Id: string
  overlapStart?: Date
  overlapEnd?: Date
}

export interface PersonConflictResult {
  hasConflict: boolean
  assignedTo: string
  conflictingTaskIds: string[]
}

export interface PreparationGapResult {
  hasGap: boolean
  gapMinutes: number
  requiredMinutes: number
  isSufficient: boolean
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}

export function detectTimeConflict(
  task1: CalendarTask,
  task2: CalendarTask
): TimeConflictResult {
  const start1 = toDate(task1.startTime).getTime()
  const end1 = toDate(task1.endTime).getTime()
  const start2 = toDate(task2.startTime).getTime()
  const end2 = toDate(task2.endTime).getTime()

  const hasOverlap = start1 < end2 && start2 < end1

  if (!hasOverlap) {
    return {
      hasConflict: false,
      task1Id: task1.id,
      task2Id: task2.id
    }
  }

  const overlapStart = new Date(Math.max(start1, start2))
  const overlapEnd = new Date(Math.min(end1, end2))

  return {
    hasConflict: true,
    task1Id: task1.id,
    task2Id: task2.id,
    overlapStart,
    overlapEnd
  }
}

export function detectPersonConflict(tasks: CalendarTask[]): PersonConflictResult[] {
  const results: PersonConflictResult[] = []
  const personTasks: Record<string, string[]> = {}

  for (const task of tasks) {
    if (!personTasks[task.assignedTo]) {
      personTasks[task.assignedTo] = []
    }
    personTasks[task.assignedTo].push(task.id)
  }

  for (const [assignedTo, taskIds] of Object.entries(personTasks)) {
    if (taskIds.length < 2) {
      continue
    }

    const personTaskList = tasks.filter((t) => t.assignedTo === assignedTo)
    const conflictingIds: string[] = []

    for (let i = 0; i < personTaskList.length; i++) {
      for (let j = i + 1; j < personTaskList.length; j++) {
        const conflict = detectTimeConflict(personTaskList[i], personTaskList[j])
        if (conflict.hasConflict) {
          if (!conflictingIds.includes(personTaskList[i].id)) {
            conflictingIds.push(personTaskList[i].id)
          }
          if (!conflictingIds.includes(personTaskList[j].id)) {
            conflictingIds.push(personTaskList[j].id)
          }
        }
      }
    }

    if (conflictingIds.length > 0) {
      results.push({
        hasConflict: true,
        assignedTo,
        conflictingTaskIds: conflictingIds
      })
    }
  }

  return results
}

export function detectPreparationGap(
  checkOut: Date | string,
  nextCheckIn: Date | string,
  requiredMinutes: number
): PreparationGapResult {
  const checkOutTime = toDate(checkOut).getTime()
  const nextCheckInTime = toDate(nextCheckIn).getTime()
  const gapMs = nextCheckInTime - checkOutTime
  const gapMinutes = Math.max(0, Math.floor(gapMs / (1000 * 60)))
  const isSufficient = gapMinutes >= requiredMinutes

  return {
    hasGap: gapMinutes > 0,
    gapMinutes,
    requiredMinutes,
    isSufficient
  }
}
