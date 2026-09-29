import { Component, type ErrorInfo, type ReactNode, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { LogOut, Menu, Shield } from 'lucide-react'
import { ApiError, getMe, getPortalContent, type Profile } from './auth/api'
import { currentSupabaseSession, isSupabaseConfigured, supabase } from './auth/supabase'
import { ContentProvider } from './content/ContentContext'
import { AdminPanel } from './components/AdminPanel'
import { AuthPortal } from './components/AuthPortal'
import { PageContent } from './components/PageContent'
import { Sidebar } from './components/Sidebar'
import type { PortalContent } from './types/content'
import type { PageContent as PageContentType } from './types/navigation'
import { pageHref, pageIdFromHash, sectionIdFromHash } from './utils/routes'

const readPageFromHash = () => pageIdFromHash(window.location.hash)
const readSectionFromHash = () => sectionIdFromHash(window.location.hash)
const sessionKey = 'op-onboarding:access-token'
// This route is intentionally outside the authored page namespace. `admin`
// remains a valid page ID for content authors, while the app's own management
// surface has a stable, clearly reserved destination.
const adminPanelRouteId = '__op-admin-panel'
const legacyAdminRouteId = 'admin'
const fallbackPage: PageContentType = {
  id: 'home',
  eyebrow: 'Onboarding',
  title: 'Onboarding workspace',
  description: '',
  kind: 'blocks',
  renderMode: 'blocks',
}

if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'

class ContentRenderBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Rendering errors stay contained so a malformed authored block cannot
    // unmount the whole workspace. The page key below resets this boundary
    // when the user chooses another route.
  }

  render() {
    if (this.state.failed) {
      return (
        <section className="content-render-error" role="alert">
          <p className="eyebrow">Content unavailable</p>
          <h1>We couldn’t display this onboarding page.</h1>
          <p>Try reloading the workspace. If this continues, ask an administrator to review the content block for this page.</p>
          <button className="button button--primary" type="button" onClick={() => window.location.reload()}>Reload workspace</button>
        </section>
      )
    }
    return this.props.children
  }
}

function App() {
  const assetBase = import.meta.env.BASE_URL
  const [activeId, setActiveId] = useState(readPageFromHash)
  const [activeSection, setActiveSection] = useState(readSectionFromHash)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [auth, setAuth] = useState<{ status: 'checking' } | { status: 'signed-out' } | { status: 'signed-in', token: string, profile: Profile } | { status: 'unavailable' }>({ status: 'checking' })
  const [content, setContent] = useState<PortalContent | null>(null)
  const [contentError, setContentError] = useState<string | null>(null)

  const pages = useMemo(() => {
    const registry = new Map<string, PageContentType>()
    content?.pages.forEach((workspacePage) => registry.set(workspacePage.id, workspacePage))
    registry.set(adminPanelRouteId, {
      id: adminPanelRouteId,
      eyebrow: 'Administrator workspace',
      title: 'People and access',
      description: '',
      kind: 'blocks',
      renderMode: 'blocks',
      category: 'Administration',
    })
    return registry
  }, [content])
  const startPage = useMemo(
    () => content?.pages.find((candidate) => candidate.id === 'home') ?? content?.pages[0] ?? fallbackPage,
    [content],
  )
  const hasAuthoredAdminPage = Boolean(content?.pages.some((candidate) => candidate.id === legacyAdminRouteId))
  // Keep old #/admin bookmarks working for the management panel until an
  // author creates a real `admin` page. From that point the authored page wins.
  const routeId = content !== null && activeId === legacyAdminRouteId && !hasAuthoredAdminPage
    ? adminPanelRouteId
    : activeId
  const page = useMemo(() => pages.get(routeId) ?? startPage, [pages, routeId, startPage])
  const locationTrail = useMemo(() => {
    const team = content?.teams.find((candidate) => page.id === candidate.id || page.id.startsWith(`${candidate.id}-`))
    if (page.id === startPage.id) return [{ id: startPage.id, label: page.title || 'Home' }]
    if (page.id === 'hearst') return [{ id: 'hearst', label: 'Hearst' }]
    if (team) {
      const trail = [{ id: 'hearst', label: 'Hearst' }, { id: team.id, label: team.shortName }]
      if (page.id !== team.id) trail.push({ id: page.id, label: page.title })
      return trail
    }
    return [{ id: startPage.id, label: startPage.title || 'Home' }, { id: page.id, label: page.title }]
  }, [content, page, startPage])

  useEffect(() => {
    const handleHashChange = () => {
      setActiveId(readPageFromHash())
      setActiveSection(readSectionFromHash())
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    if (auth.status !== 'signed-in') {
      setContent(null)
      setContentError(null)
      return
    }
    let active = true
    setContentError(null)
    getPortalContent(auth.token)
      .then((result) => { if (active) setContent(result as PortalContent) })
      .catch((error) => {
        if (!active) return
        setContent(null)
        setContentError(error instanceof ApiError ? error.message : 'Unable to load onboarding content.')
      })
    return () => { active = false }
  }, [auth])

  useEffect(() => {
    let active = true
    const hydrate = async (token: string | null) => {
      try {
        if (!token) throw new ApiError(401, 'Authentication required.')
        const profile = await getMe(token)
        if (!active) return
        window.sessionStorage.setItem(sessionKey, token)
        setAuth({ status: 'signed-in', token, profile })
      } catch (error) {
        if (!active) return
        window.sessionStorage.removeItem(sessionKey)
        setAuth(error instanceof ApiError && error.status !== 401 ? { status: 'unavailable' } : { status: 'signed-out' })
      }
    }

    void (async () => {
      try {
        const session = isSupabaseConfigured
          ? await currentSupabaseSession()
          : null
        await hydrate(session?.access_token ?? window.sessionStorage.getItem(sessionKey))
      } catch {
        if (!active) return
        window.sessionStorage.removeItem(sessionKey)
        setAuth({ status: 'signed-out' })
      }
    })()

    if (!supabase) return () => { active = false }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        window.sessionStorage.removeItem(sessionKey)
        if (active) setAuth({ status: 'signed-out' })
        return
      }
      void hydrate(session.access_token)
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (auth.status === 'signed-in' && routeId === adminPanelRouteId && auth.profile.role !== 'admin') navigate('home')
  // `navigate` is deliberately local to this component and changes only the hash.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, routeId])

  useLayoutEffect(() => {
    document.title = `${page.title} · Optimum Partners Onboarding`
    const sectionId = readSectionFromHash()
    if (sectionId) {
      document.getElementById(sectionId)?.scrollIntoView({ block: 'start', behavior: 'instant' })
      return
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page, activeSection])

  const navigate = (id: string) => {
    if (id === activeId) return
    window.location.hash = id === 'home' ? '/' : `/${id}`
    setActiveId(id)
    setActiveSection(null)
  }

  if (auth.status === 'checking') return <main className="auth-loading" aria-live="polite">Checking your workspace identity…</main>
  if (auth.status === 'unavailable') return <main className="auth-loading"><p>The onboarding API is unavailable.</p><button className="button button--primary" type="button" onClick={() => window.location.reload()}>Try again</button></main>
  if (auth.status === 'signed-out') return <AuthPortal onAuthenticated={(token, profile) => {
    window.sessionStorage.setItem(sessionKey, token)
    setAuth({ status: 'signed-in', token, profile })
  }} />

  const { token, profile } = auth
  const signOut = () => {
    window.sessionStorage.removeItem(sessionKey)
    if (supabase) void supabase.auth.signOut()
    setAuth({ status: 'signed-out' })
  }
  if (!content && contentError) return <main className="auth-loading" aria-live="polite"><p>{contentError}</p><small>Ask an administrator to grant the onboarding blocks you need.</small><div className="auth-loading__actions"><button className="button button--primary" type="button" onClick={() => window.location.reload()}>Check access again</button><button className="button button--secondary" type="button" onClick={signOut}>Sign out</button></div></main>
  if (!content) return <main className="auth-loading" aria-live="polite">Loading onboarding content from your workspace…</main>

  return (
    <ContentProvider value={content}>
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      <Sidebar
        activeId={page.id}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onCollapsedChange={setSidebarCollapsed}
        onMobileClose={() => setMobileOpen(false)}
        onNavigate={navigate}
        profile={profile}
        onSignOut={signOut}
        navigation={content.navigation}
        footerNavigation={content.footerNavigation}
        adminPanelRouteId={adminPanelRouteId}
      />
      <main className="main-content">
        <header className="topbar">
          <nav className="breadcrumbs" aria-label="Current location">
            {locationTrail.map((item, index) => <span key={item.id}>{index > 0 && <b>/</b>}{index === locationTrail.length - 1 ? <a href={pageHref(item.id)} aria-current="page"><i />{item.label}</a> : <a href={pageHref(item.id)}>{item.label}</a>}</span>)}
          </nav>
          <div className="topbar__account"><span>{profile.email || profile.id}</span>{profile.role === 'admin' && <Shield aria-label="Administrator" />}<button type="button" onClick={signOut} aria-label="Sign out"><LogOut /></button></div>
        </header>
        <div className="mobile-bar">
          <button className="icon-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation" type="button">
            <Menu size={20} />
          </button>
          <img src={`${assetBase}brand/optimum-partners-logo.png`} alt="Optimum Partners" />
          <span className="mobile-bar__dot" />
        </div>
        <div className="content-frame">
          <ContentRenderBoundary key={`${page.id}:${content.version}`}>
            {page.id === adminPanelRouteId && profile.role === 'admin'
              ? <AdminPanel token={token} profile={profile} onContentUpdated={(next) => setContent(next)} />
              : <PageContent page={page} content={content} token={token} profile={profile} onContentUpdated={(next) => setContent(next)} />}
          </ContentRenderBoundary>
        </div>
        <footer className="site-footer">
          <span>Optimum Partners · Onboarding</span>
        </footer>
      </main>
    </div>
    </ContentProvider>
  )
}

export default App
