import { useEffect, useState } from 'react'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Profile } from '../auth/api'
import type { NavigationItem } from '../types/navigation'
import { Brand } from './Brand'

interface SidebarProps {
  activeId: string
  collapsed: boolean
  mobileOpen: boolean
  onCollapsedChange: (value: boolean) => void
  onMobileClose: () => void
  onNavigate: (id: string) => void
  profile: Profile
  onSignOut: () => void
  navigation: NavigationItem[]
  footerNavigation: NavigationItem[]
  adminPanelRouteId: string
}

interface NavItemProps {
  item: NavigationItem
  activeId: string
  depth?: number
  collapsed: boolean
  onNavigate: (id: string) => void
}

const routeIdFor = (item: NavigationItem) => item.pageId

const matchesActiveRoute = (item: NavigationItem, activeId: string) =>
  routeIdFor(item) === activeId

const hasActiveChild = (item: NavigationItem, activeId: string): boolean =>
  matchesActiveRoute(item, activeId) ||
  Boolean(item.children?.some((child) => hasActiveChild(child, activeId)))

/**
 * Content arrives as JSON, so a real icon can only be a locally hydrated
 * Lucide forward-ref component. Do not invoke arbitrary Drive JSON as a React
 * component: an invalid `icon` must degrade to the normal child-route dot.
 */
function isRenderableIcon(value: unknown): value is LucideIcon {
  if (typeof value === 'function') return true
  if (!value || typeof value !== 'object') return false
  return (value as { $$typeof?: unknown }).$$typeof === Symbol.for('react.forward_ref')
}

function NavItem({
  item,
  activeId,
  depth = 0,
  collapsed,
  onNavigate,
}: NavItemProps) {
  const containsActive = hasActiveChild(item, activeId)
  const [expanded, setExpanded] = useState(containsActive)
  const Icon = isRenderableIcon(item.icon) ? item.icon : undefined
  const hasChildren = Boolean(item.children?.length && !item.hideChildren)
  const isActive = matchesActiveRoute(item, activeId)
  const isSelected = isActive || Boolean(item.hideChildren && containsActive)

  useEffect(() => {
    if (containsActive) setExpanded(true)
  }, [containsActive])

  const activate = () => {
    const routeId = routeIdFor(item)
    if (routeId) onNavigate(routeId)
    if (hasChildren) setExpanded((current) => !current)
  }

  if (collapsed && depth > 0) return null

  return (
    <li className="nav-item">
      <button
        className={`nav-button ${isSelected ? 'is-active' : ''} ${containsActive ? 'has-active-child' : ''}`}
        style={{ '--nav-depth': depth } as React.CSSProperties}
        onClick={activate}
        aria-expanded={hasChildren ? expanded : undefined}
        aria-current={isSelected ? 'page' : undefined}
        title={collapsed ? item.label : undefined}
        type="button"
      >
        {Icon && <Icon className="nav-button__icon" size={18} aria-hidden="true" />}
        {!Icon && depth > 0 && <span className="nav-button__dot" aria-hidden="true" />}
        {!collapsed && <span className="nav-button__label">{item.label}</span>}
        {!collapsed && hasChildren && (
          <ChevronDown
            className={`nav-button__chevron ${expanded ? 'is-open' : ''}`}
            size={15}
            aria-hidden="true"
          />
        )}
      </button>
      {!collapsed && hasChildren && expanded && (
        <ul className="nav-children">
          {item.children?.map((child) => (
            <NavItem
              key={child.id}
              item={child}
              activeId={activeId}
              depth={depth + 1}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export function Sidebar({
  activeId,
  collapsed,
  mobileOpen,
  onCollapsedChange,
  onMobileClose,
  onNavigate,
  profile,
  onSignOut,
  navigation,
  footerNavigation,
  adminPanelRouteId,
}: SidebarProps) {
  const navigate = (id: string) => {
    onNavigate(id)
    onMobileClose()
  }

  return (
    <>
      <button
        className={`sidebar-scrim ${mobileOpen ? 'is-visible' : ''}`}
        onClick={onMobileClose}
        aria-label="Close navigation"
        type="button"
      />
      <aside
        className={`sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`}
        onClickCapture={() => {
          if (collapsed) onCollapsedChange(false)
        }}
      >
        <div className="sidebar__header">
          <Brand compact={collapsed} />
          <button
            className="icon-button sidebar__mobile-close"
            onClick={onMobileClose}
            aria-label="Close navigation"
            type="button"
          >
            <X size={19} />
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Primary navigation">
          {!collapsed && <p className="nav-label">Explore</p>}
          <ul className="nav-list">
            {navigation.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                activeId={activeId}
                collapsed={collapsed}
                onNavigate={navigate}
              />
            ))}
          </ul>
        </nav>

        <div className="sidebar__footer">
          <ul className="nav-list nav-list--footer">
            {profile.role === 'admin' && (
              <NavItem
                item={{ id: adminPanelRouteId, label: 'Admin panel', icon: Shield, pageId: adminPanelRouteId }}
                activeId={activeId}
                collapsed={collapsed}
                onNavigate={navigate}
              />
            )}
            {footerNavigation.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                activeId={activeId}
                collapsed={collapsed}
                onNavigate={navigate}
              />
            ))}
          </ul>
          {!collapsed && <div className="sidebar-account"><span>{profile.email || profile.id}</span><button type="button" onClick={onSignOut}>Sign out</button></div>}
          <button
            className="collapse-button"
            onClick={() => onCollapsedChange(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            type="button"
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            {!collapsed && <span>Minimize sidebar</span>}
            {!collapsed && <ChevronLeft size={15} className="collapse-button__end" />}
            {collapsed && <ChevronRight size={0} aria-hidden="true" />}
          </button>
        </div>
      </aside>
    </>
  )
}
