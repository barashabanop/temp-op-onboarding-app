import { Fragment } from 'react'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock3,
  Code2,
  ExternalLink,
  GitBranch,
  KeyRound,
  LockKeyhole,
  MessageSquareText,
  Network,
  Rocket,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Users,
} from 'lucide-react'
import type { TeamPortalData } from '../../../types/portal'
import { ChannelDirectory, MeetingCadence, TeammateRoster } from '../TeamDirectory'
import { TeamPageShell } from '../TeamPageShell'
import { WorkflowSteps } from '../WorkflowSteps'
import { PortalIntro } from '../../ui/PortalPrimitives'

function PendingRoster() {
  return (
    <section className="people-card" id="roster"><header><Users aria-hidden="true" /><div><p className="eyebrow">Team map</p><h2>Teammates around the work</h2></div></header><div className="people-roles"><article><span>TL</span><div><strong>Team lead</strong><small>Direction and escalation</small></div></article><article><span>EN</span><div><strong>Engineering</strong><small>Build, review, operate</small></div></article><article><span>PD</span><div><strong>Product partners</strong><small>Priorities and context</small></div></article></div><footer>Names and member count <span>Awaiting verification</span></footer></section>
  )
}

export function CommunicationPageView({ portal }: { portal: TeamPortalData }) {
  const { identity: team, communication } = portal
  const rosterVerified = (communication.rosterStatus ?? communication.status) === 'verified'
  return (
    <TeamPageShell team={team} active="communication">
      <PortalIntro {...communication.intro} />
      {communication.status === 'verified' ? (
        <>
          {rosterVerified ? <TeammateRoster groups={communication.groups} sectionId="roster" /> : <PendingRoster />}
          <ChannelDirectory channels={communication.channels} sectionId="channels" />
          {communication.meetings && <MeetingCadence meetings={communication.meetings} />}
          <section className="guideline-strip"><strong>{communication.agreementsTitle}</strong>{communication.agreements.map((agreement) => <span key={agreement}>{agreement}</span>)}</section>
        </>
      ) : (
        <>
          <div className="communication-layout">
            <PendingRoster />
            <section className="channel-card"><MessageSquareText aria-hidden="true" /><p className="eyebrow">Primary channel</p><h2>Confirm with team lead</h2><p>Use shared channels for decisions. Bring the ticket, impact, and a clear ask.</p><span className="status-badge"><i /> Channel pending</span></section>
          </div>
          <section className="meeting-board"><header><div><p className="eyebrow">Team cadence</p><h2>Meetings with a purpose</h2></div><span>Schedule to confirm</span></header><div><article><CalendarDays /><span><strong>Team sync</strong><small>Progress and blockers</small></span><em>Cadence pending</em></article><article><Network /><span><strong>Planning</strong><small>Priority and scope</small></span><em>Cadence pending</em></article><article><Sparkles /><span><strong>Review & retro</strong><small>Outcomes and improvement</small></span><em>Cadence pending</em></article></div></section>
          <section className="guideline-strip"><strong>{communication.agreementsTitle}</strong>{communication.agreements.map((agreement) => <span key={agreement}>{agreement}</span>)}</section>
        </>
      )}
    </TeamPageShell>
  )
}

export function WorkPageView({ portal }: { portal: TeamPortalData }) {
  const { identity: team, work } = portal
  const verified = work.verifiedContent
  const sprint = ['Planning', 'Development', 'Review', 'QA', 'Release']
  return (
    <TeamPageShell team={team} active="work">
      <PortalIntro {...work.intro} />
      {work.status === 'verified' && verified ? (
        <>
          <section className="jira-preview moapt-jira" id="jira"><div><span className="jira-logo">J</span><div><p className="eyebrow">{verified.ticketEyebrow}</p><h2>{verified.ticketTitle}</h2><small>{verified.ticketSummary}</small></div></div><div className="jira-badges"><span>Branch pattern<strong>{verified.branchPattern}</strong></span><span>Release cadence<strong>{verified.releaseCadence}</strong></span></div><a href={work.pullRequestsUrl} target="_blank" rel="noreferrer">{work.workLinkLabel ?? 'Open pull requests'} <ExternalLink /></a></section>
          <section className="process-section" id="ticket-lifecycle"><header><div><p className="eyebrow">{verified.workflowEyebrow}</p><h2>{verified.workflowTitle}</h2></div><span className="status-badge"><CircleDot /> Verified workflow</span></header><WorkflowSteps steps={work.workflow} expanded /></section>
          <section className="delivery-board" id="delivery-workflow"><header><p className="eyebrow">{verified.deliveryEyebrow}</p><h2>{verified.deliveryTitle}</h2></header><div>{work.delivery.map((phase, index) => <article key={phase.title}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{phase.title}</strong><p>{phase.detail}</p></div></article>)}</div></section>
          <section className="release-callout" id="release-info"><Rocket /><div><p className="eyebrow">{verified.releaseEyebrow}</p><h3>{verified.releaseTitle}</h3><p>{verified.releaseSummary}</p></div></section>
        </>
      ) : (
        <>
          <section className="jira-preview"><div><span className="jira-logo">J</span><div><p className="eyebrow">Jira workspace</p><h2>Team board</h2><small>Board link awaiting verification</small></div></div><div className="jira-badges"><span>Methodology <strong>To confirm</strong></span><span>Sprint duration <strong>To confirm</strong></span></div><button type="button" disabled>Board pending</button></section>
          <section className="process-section"><header><div><p className="eyebrow">Ticket lifecycle</p><h2>A clear path to done.</h2></div><span className="status-badge"><CircleDot /> Shared baseline</span></header><WorkflowSteps steps={work.workflow} /></section>
          <section className="sprint-panel"><header><div><p className="eyebrow">Sprint lifecycle</p><h2>One delivery rhythm.</h2></div><div><Clock3 /><span><small>Typical duration</small><strong>Team to confirm</strong></span></div></header><div className="sprint-timeline">{sprint.map((step, index) => <article key={step}><span><i /></span><small>Phase {index + 1}</small><strong>{step}</strong></article>)}</div></section>
            {work.delivery.length > 0 && <section className="delivery-board" id="source-guidance"><header><p className="eyebrow">Source guide · {work.guidanceStatus ?? 'pending'}</p><h2>{work.guidanceTitle}</h2></header><div>{work.delivery.map((phase, index) => <article key={phase.title}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{phase.title}</strong><p>{phase.detail}</p></div></article>)}</div></section>}
            {work.ticketQuestions && <section className="guideline-strip" id="ticket-questions"><strong>Questions for every ticket</strong>{work.ticketQuestions.map((question) => <span key={question}>{question}</span>)}</section>}
        </>
      )}
    </TeamPageShell>
  )
}

const repositorySlots = [
  { code: 'APP', type: 'Product application' },
  { code: 'SVC', type: 'Service or API' },
  { code: 'OPS', type: 'Infrastructure & operations' },
]

export function ResourcesPageView({ portal }: { portal: TeamPortalData }) {
  const { identity: team, resources } = portal
  const verified = resources.verifiedContent
  const accessIcons = [KeyRound, Users, ShieldCheck, CheckCircle2]
  return (
    <TeamPageShell team={team} active="resources">
      <PortalIntro {...resources.intro} />
      {resources.status === 'verified' && verified ? (
        <>
          {verified.primaryRepository && <section className="primary-repo" id="primary-repo"><div><span className="status-badge"><i /> {verified.primaryRepository.type}</span><GitBranch /></div><p className="eyebrow">{verified.primaryRepository.owner}</p><h2>{verified.primaryRepository.name}</h2><p>{verified.primaryRepository.purpose}</p><div className="repo-tech">{verified.primaryRepository.stack.map((item) => <span key={item}>{item}</span>)}</div><a href={verified.primaryRepository.url} target="_blank" rel="noreferrer">Open repository <ExternalLink /></a></section>}
          {!resources.articleOnly && <>
          <section className="portal-section" id="services"><header><div><p className="eyebrow">{verified.servicesEyebrow}</p><h2>{verified.servicesTitle}</h2></div><p>{verified.servicesSummary}</p></header><div className="service-grid">{resources.services.map((service) => <article key={service.name}><header><span>{service.type}</span><Code2 /></header><h3>{service.name}</h3><p>{service.purpose}</p><footer><span>{service.stack}</span><small>{service.access}</small></footer></article>)}</div></section>
          <section className="system-map" id="system-map"><header><p className="eyebrow">{verified.systemEyebrow}</p><h2>{verified.systemTitle}</h2></header><div className="system-flow">{verified.systemFlow.map((step) => <span key={step}>{step}</span>).flatMap((step, index) => index < verified.systemFlow.length - 1 ? [step, <ArrowRight key={`arrow-${index}`} />] : [step])}<ArrowRight /><strong>{verified.systemOutcome}</strong></div>{resources.architectureVisual && <figure className="architecture-visual"><img src={resources.architectureVisual.src} alt={resources.architectureVisual.alt} /><figcaption>{resources.architectureVisual.caption}{resources.architectureVisual.url && <> <a href={resources.architectureVisual.url} target="_blank" rel="noreferrer">Open full diagram <ExternalLink /></a></>}</figcaption></figure>}<div className="system-cards">{resources.systems.map((system) => <article key={system.name}><strong>{system.name}</strong><p>{system.role}</p></article>)}</div></section>
          <div className="resource-split"><section className="access-checklist" id="access-checklist"><header><KeyRound /><div><p className="eyebrow">{verified.accessEyebrow}</p><h2>{verified.accessTitle}</h2></div></header><div>{resources.accessItems.map((item, index) => <span key={item}><i>{index + 1}</i>{item}</span>)}</div></section>{resources.commands.length > 0 && <section className="command-card"><header><TerminalSquare /><div><p className="eyebrow">{verified.commandsEyebrow}</p><h2>{verified.commandsTitle}</h2></div></header><div>{resources.commands.map(({ command, purpose }) => <article key={command}><code>{command}</code><span>{purpose}</span></article>)}</div><footer>{verified.commandsFooter} <code>{verified.commandsFooterCommand}</code></footer></section>}</div>
          <section className="access-flow-panel" id="access-flow"><header><ShieldCheck /><div><p className="eyebrow">{verified.accessFlowEyebrow}</p><h2>{verified.accessFlowTitle}</h2></div></header><div className="access-product-flow">{verified.accessFlow.map((step, index) => { const Icon = accessIcons[index]; return <Fragment key={step.title}><article><Icon /><span><small>{String(index + 1).padStart(2, '0')}</small><strong>{step.title}</strong><em>{step.detail}</em></span></article>{index < verified.accessFlow.length - 1 && <ArrowRight />}</Fragment> })}</div>{verified.secretSharing && <footer><LockKeyhole /><span>{verified.secretSharing.guidance} <a href={verified.secretSharing.url} target="_blank" rel="noreferrer">{verified.secretSharing.label} <ExternalLink /></a></span></footer>}</section>
          </>}
          {resources.safetyGuidance && <section className="release-callout resource-safety"><ShieldCheck /><div><p className="eyebrow">Important safety rule</p><h3>Experiment in feature environments</h3><p>{resources.safetyGuidance}</p></div></section>}
          {resources.linkGroups?.map((group) => <section className="portal-section resource-links" key={group.title}><header><div><p className="eyebrow">Reference library</p><h2>{group.title}</h2></div></header><div>{group.links.map((link) => <a href={link.url} target="_blank" rel="noreferrer" key={link.label}><span><strong>{link.label}</strong><small>{link.description}</small></span><ExternalLink /></a>)}</div></section>)}
          {resources.guideSections?.map((section) => <section className={`portal-section resource-guide resource-guide--${section.presentation ?? 'cards'}`} id={section.id} key={section.id}><header><div><p className="eyebrow">{section.eyebrow}</p><h2>{section.title}</h2></div>{section.summary && <p>{section.summary}</p>}</header>{section.presentation === 'prose' ? <div className="resource-guide__prose">{section.items.map((item) => <section key={item.title}><div><h3>{item.title}</h3>{item.meta && <span>{item.meta}</span>}</div><p>{item.detail}</p>{item.links && <div className="resource-guide__item-links">{item.links.map((link) => <a href={link.url} target="_blank" rel="noreferrer" key={link.label}>{link.label}<ExternalLink /></a>)}</div>}{item.code && <pre><code>{item.code}</code></pre>}</section>)}</div> : section.presentation === 'list' ? <ol className="resource-guide__list">{section.items.map((item) => <li key={item.title}><div><h3>{item.title}</h3><p>{item.detail}</p>{item.code && <pre><code>{item.code}</code></pre>}</div>{item.meta && <span>{item.meta}</span>}</li>)}</ol> : <div className="resource-guide__grid">{section.items.map((item) => <article key={item.title}><div>{item.meta && <span>{item.meta}</span>}<strong>{item.title}</strong></div><p>{item.detail}</p>{item.code && <pre><code>{item.code}</code></pre>}</article>)}</div>}{section.image && <figure className="architecture-visual"><img src={section.image.src} alt={section.image.alt} /><figcaption>{section.image.caption}{section.image.url && <> <a href={section.image.url} target="_blank" rel="noreferrer">Open full diagram <ExternalLink /></a></>}</figcaption></figure>}{section.images && <div className="resource-guide__gallery">{section.images.map((image) => <figure key={image.src}><img src={image.src} alt={image.alt} /><figcaption>{image.caption}</figcaption></figure>)}</div>}{section.links && <div className="resource-guide__links">{section.links.map((link) => <a href={link.url} target="_blank" rel="noreferrer" key={link.label}><span><strong>{link.label}</strong><small>{link.description}</small></span><ExternalLink /></a>)}</div>}</section>)}
        </>
      ) : (
        <>
          <section className="portal-section repository-section"><header><div><p className="eyebrow">Repository inventory</p><h2>Codebases at a glance.</h2></div><span className="status-badge"><i /> Awaiting team data</span></header><div className="repository-grid">{repositorySlots.map((slot) => <article key={slot.code}><header><span>{slot.code}</span><GitBranch /></header><h3>Repository name pending</h3><p>{slot.type}</p><dl><div><dt>Purpose</dt><dd>Confirm with owner</dd></div><div><dt>Stack</dt><dd>To be documented</dd></div><div><dt>Access</dt><dd>Role based</dd></div><div><dt>Owner</dt><dd>Team to assign</dd></div></dl></article>)}</div></section>
          <section className="access-flow-panel"><header><ShieldCheck /><div><p className="eyebrow">Permission flow</p><h2>From need to access granted.</h2></div></header><div className="access-product-flow"><article><KeyRound /><span><small>01</small><strong>Need access</strong><em>Name scope and level</em></span></article><ArrowRight /><article><Users /><span><small>02</small><strong>Request from</strong><em>Repository owner</em></span></article><ArrowRight /><article><ShieldCheck /><span><small>03</small><strong>Approval</strong><em>Work item + checks</em></span></article><ArrowRight /><article><CheckCircle2 /><span><small>04</small><strong>Access granted</strong><em>Verify permissions</em></span></article></div><footer><LockKeyhole /><span>Share credentials, tokens, and other secrets only through Hearst SnapPass, never directly in chat. <a href="https://snappass.hearstapps.com/" target="_blank" rel="noreferrer">Open SnapPass <ExternalLink /></a></span></footer></section>
        </>
      )}
    </TeamPageShell>
  )
}
