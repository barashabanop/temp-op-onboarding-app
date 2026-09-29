import { useState } from 'react'
import type { HearstTeam } from '../types/content'
import {
    progressKey,
    readCompletedLevels,
    readCompletedTasks,
    taskProgressKey,
} from '../utils/progress'

export function useTaskJourneyProgress(team: HearstTeam) {
    const [completedTasks, setCompletedTasks] = useState<string[]>(() =>
        readCompletedTasks(team),
    )

    const updateCompletedTasks = (next: string[]) => {
        setCompletedTasks(next)
        localStorage.setItem(taskProgressKey(team), JSON.stringify(next))
    }

    return { completedTasks, updateCompletedTasks }
}

export function useLevelJourneyProgress(team: HearstTeam) {
    const [completedLevels, setCompletedLevels] = useState<number[]>(() =>
        readCompletedLevels(team),
    )

    const updateCompletedLevels = (next: number[]) => {
        setCompletedLevels(next)
        localStorage.setItem(progressKey(team), JSON.stringify(next))
    }

    return { completedLevels, updateCompletedLevels }
}
