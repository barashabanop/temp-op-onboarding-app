import type { HearstTeam } from '../types/content'
import type { TeamPortalData } from '../types/portal'

export const progressKey = (team: HearstTeam) => `op-onboarding:${team.id}:levels`

export const taskProgressKey = (team: HearstTeam) =>
    `op-onboarding:${team.id}:tasks:v2`

function readStoredArray<T>(key: string): T[] {
    try {
        const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
        return Array.isArray(value) ? (value as T[]) : []
    } catch {
        return []
    }
}

export const readCompletedLevels = (team: HearstTeam) =>
    readStoredArray<number>(progressKey(team))

export const readCompletedTasks = (team: HearstTeam) =>
    readStoredArray<string>(taskProgressKey(team))

export function progressFor(portal: TeamPortalData) {
    if (portal.journey.mode === 'tasks') {
        const taskIds = new Set(portal.journey.levels.flatMap(
            (level) => level.tasks?.map((task) => task.id) ?? [],
        ))
        const taskCount = taskIds.size
        const completedTaskCount = readCompletedTasks(portal.identity).filter(
            (id) => taskIds.has(id),
        ).length
        return taskCount === 0
            ? 0
            : Math.round((completedTaskCount / taskCount) * 100)
    }

    const totalLevels = portal.journey.levels.length
    return totalLevels === 0
        ? 0
        : Math.min(
            Math.round(
                (readCompletedLevels(portal.identity).length / totalLevels) * 100,
            ),
            100,
        )
}
