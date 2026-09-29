import { ArrowRight, Check, CheckCircle2, ExternalLink, LockKeyhole } from 'lucide-react'
import type { TeamPortalData } from '../../../types/portal'
import { useLevelJourneyProgress, useTaskJourneyProgress } from '../../../hooks/useJourneyProgress'
import { TeamPageShell } from '../TeamPageShell'
import { ProgressRing } from '../../ui/PortalPrimitives'

function TaskJourney({ portal }: { portal: TeamPortalData }) {
  const { identity: team, journey } = portal
  const { completedTasks, updateCompletedTasks } = useTaskJourneyProgress(team)
  const taskIds = new Set(journey.levels.flatMap((level) => level.tasks?.map((task) => task.id) ?? []))
  const currentCompletedTasks = completedTasks.filter((id) => taskIds.has(id))
  const totalTasks = journey.levels.reduce((total, level) => total + (level.tasks?.length ?? 0), 0)
  const progress = totalTasks === 0 ? 0 : Math.round((currentCompletedTasks.length / totalTasks) * 100)
  const levelIsComplete = (levelIndex: number) => {
    const tasks = journey.levels[levelIndex].tasks ?? []
    return tasks.every((task) => currentCompletedTasks.includes(task.id))
  }
  const toggleTask = (id: string) => {
    updateCompletedTasks(currentCompletedTasks.includes(id) ? currentCompletedTasks.filter((item) => item !== id) : [...currentCompletedTasks, id])
  }
  const toggleLevel = (levelIndex: number) => {
    const ids = (journey.levels[levelIndex].tasks ?? []).map((task) => task.id)
    updateCompletedTasks(levelIsComplete(levelIndex) ? currentCompletedTasks.filter((id) => !ids.includes(id)) : [...new Set([...currentCompletedTasks, ...ids])])
  }

  return (
    <>
      <section className="journey-hero moapt-journey-hero"><div><p className="eyebrow">{journey.eyebrow}</p><h1>{journey.title}</h1><p>{journey.summary}</p></div><div><ProgressRing value={progress} /><span><strong>{currentCompletedTasks.length} of {totalTasks}</strong><small>Tasks complete · {journey.levels.length} levels</small></span></div></section>
      <div className="journey-track moapt-journey-track">{journey.levels.map((level, levelIndex) => {
        const tasks = level.tasks ?? []
        const isComplete = levelIsComplete(levelIndex)
        const unlocked = levelIndex === 0 || levelIsComplete(levelIndex - 1)
        const completeCount = tasks.filter((task) => currentCompletedTasks.includes(task.id)).length
        const Icon = level.icon
        return <article className={`journey-level moapt-journey-level ${isComplete ? 'is-complete' : ''} ${unlocked ? 'is-unlocked' : 'is-locked'}`} key={level.id}>
          <div className="journey-node">{isComplete ? <Check /> : unlocked ? <span>{String(levelIndex + 1).padStart(2, '0')}</span> : <LockKeyhole />}<i /></div>
          <div className="journey-card moapt-journey-card">
            <header><span>Level {String(levelIndex + 1).padStart(2, '0')}</span><em>{isComplete ? 'Completed' : unlocked ? `${completeCount}/${tasks.length} tasks` : 'Locked'}</em></header>
            <div className="journey-card__body"><Icon /><div><h2>{level.title}</h2><p>{level.body}</p></div></div>
            <div className="journey-task-list" aria-label={`${level.title} tasks`}>{tasks.map((task) => {
              const checked = currentCompletedTasks.includes(task.id)
              const commands = task.commands ?? []
              const external = task.reference.url.startsWith('http')
              return <article className={`journey-task ${checked ? 'is-checked' : ''}`} key={task.id}>
                <button type="button" className="journey-task__check" aria-label={`${checked ? 'Mark incomplete' : 'Mark complete'}: ${task.title}`} aria-pressed={checked} disabled={!unlocked} onClick={() => toggleTask(task.id)}><span>{checked && <Check />}</span></button>
                <div className="journey-task__content"><strong>{task.title}</strong><p>{task.detail}</p>{commands.length > 0 && <div className="journey-task__commands">{commands.map((command) => <code key={command}>{command}</code>)}</div>}<small><CheckCircle2 /><span><b>Done when</b>{task.evidence}</span></small></div>
                <a href={task.reference.url} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>{task.reference.label}{external ? <ExternalLink /> : <ArrowRight />}</a>
              </article>
            })}</div>
            <footer><span><CheckCircle2 />{level.outcome}</span><button type="button" disabled={!unlocked} onClick={() => toggleLevel(levelIndex)}>{isComplete ? 'Reset level' : 'Complete all tasks'}<ArrowRight /></button></footer>
          </div>
        </article>
      })}</div>
    </>
  )
}

function LevelJourney({ portal }: { portal: TeamPortalData }) {
  const { identity: team, journey } = portal
  const { completedLevels: completed, updateCompletedLevels } = useLevelJourneyProgress(team)
  const updateLevel = (index: number) => {
    const next = completed.includes(index) ? completed.filter((level) => level !== index && level < index) : [...completed, index].sort()
    updateCompletedLevels(next)
  }
  const progress = journey.levels.length === 0 ? 0 : Math.round((completed.length / journey.levels.length) * 100)
  return (
    <>
      <section className="journey-hero"><div><p className="eyebrow">{journey.eyebrow}</p><h1>{journey.title}</h1><p>{journey.summary}</p></div><div><ProgressRing value={progress} /><span><strong>{completed.length} of {journey.levels.length}</strong><small>Levels complete</small></span></div></section>
      <div className="journey-track">{journey.levels.map((level, index) => { const isComplete = completed.includes(index); const unlocked = index === 0 || completed.includes(index - 1); const Icon = level.icon; return <article className={`journey-level ${isComplete ? 'is-complete' : ''} ${unlocked ? 'is-unlocked' : 'is-locked'}`} key={level.id}>
        <div className="journey-node">{isComplete ? <Check /> : unlocked ? <span>{index + 1}</span> : <LockKeyhole />}<i /></div><div className="journey-card"><header><span>Level {index + 1}</span><em>{isComplete ? 'Completed' : unlocked ? 'Unlocked' : 'Locked'}</em></header><div className="journey-card__body"><Icon /><div><h2>{level.title}</h2><p>{level.body}</p></div></div><footer><span><CheckCircle2 />{level.outcome}</span><button type="button" disabled={!unlocked} onClick={() => updateLevel(index)}>{isComplete ? 'Mark incomplete' : unlocked ? 'Mark complete' : 'Complete previous level'}<ArrowRight /></button></footer></div>
      </article> })}</div>
    </>
  )
}

export function JourneyPage({ portal }: { portal: TeamPortalData }) {
  return (
    <TeamPageShell team={portal.identity} active="roadmap">
      {portal.journey.mode === 'tasks' ? <TaskJourney portal={portal} /> : <LevelJourney portal={portal} />}
    </TeamPageShell>
  )
}
