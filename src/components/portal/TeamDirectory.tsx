import { CalendarDays, MessageSquareText } from 'lucide-react'
import type { TeamChannel, TeamMeeting, TeammateGroup } from '../../types/portal'

interface TeammateRosterProps {
  groups: TeammateGroup[]
  sectionId?: string
}

export function TeammateRoster({ groups, sectionId }: TeammateRosterProps) {
  return (
    <div className="moapt-roster" id={sectionId}>
      {groups.map((group, index) => (
        <section key={group.name}>
          <header>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{group.name}</strong>
            <em>{group.members.length}</em>
          </header>
          <div>
            {group.members.map(({ name, role }) => (
              <article key={`${name}-${role}`}>
                <span>
                  {name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)}
                </span>
                <div>
                  <strong>{name}</strong>
                  <small>{role}</small>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

interface ChannelDirectoryProps {
  channels: TeamChannel[]
  sectionId?: string
}

export function ChannelDirectory({ channels, sectionId }: ChannelDirectoryProps) {
  return (
    <section className="moapt-channels" id={sectionId}>
      <header>
        <div>
          <p className="eyebrow">Slack workspace</p>
          <h2>{channels.length} channels. Clear purpose.</h2>
        </div>
        <MessageSquareText aria-hidden="true" />
      </header>
      <div>
        {channels.map((channel) => (
          <article key={channel.name}>
            <span>#</span>
            <div>
              <strong>{channel.name.replace(/^#/, '')}</strong>
              <small>{channel.purpose}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export function MeetingCadence({ meetings }: { meetings: TeamMeeting[] }) {
  return (
    <section className="meeting-board" id="cadence">
      <header>
        <div>
          <p className="eyebrow">Team cadence</p>
          <h2>Meetings with a purpose</h2>
        </div>
        <span>{meetings.length} verified meetings</span>
      </header>
      <div>
        {meetings.map((meeting) => (
          <article key={meeting.name}>
            <CalendarDays aria-hidden="true" />
            <span><strong>{meeting.name}</strong></span>
            <em>{meeting.schedule}</em>
          </article>
        ))}
      </div>
    </section>
  )
}
