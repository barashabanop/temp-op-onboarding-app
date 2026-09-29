import { FormEvent, useState } from 'react'
import { ArrowRight, KeyRound, ShieldCheck, UserPlus } from 'lucide-react'
import { ApiError, createDevelopmentSession, getMe, type Profile } from '../auth/api'
import { isSupabaseConfigured, supabase } from '../auth/supabase'

interface AuthPortalProps {
  onAuthenticated: (token: string, profile: Profile) => void
}

export function AuthPortal({ onAuthenticated }: AuthPortalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [userId, setUserId] = useState('u-admin')
  const [email, setEmail] = useState(() => isSupabaseConfigured ? '' : 'admin@hearst.com')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(null)
    setSubmitting(true)
    try {
      if (supabase) {
        if (mode === 'login') {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          })
          if (error) throw error
          if (!data.session) throw new Error('Supabase did not return an active session.')
          onAuthenticated(data.session.access_token, await getMe(data.session.access_token))
        } else {
          const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { data: fullName.trim() ? { full_name: fullName.trim() } : {} },
          })
          if (error) throw error
          if (!data.session) {
            setMessage('Account created. Check your email to confirm it, then sign in to the workspace.')
            return
          }
          onAuthenticated(data.session.access_token, await getMe(data.session.access_token))
        }
      } else {
        const session = await createDevelopmentSession(userId.trim(), email.trim())
        onAuthenticated(session.access_token, session.profile)
      }
    } catch (error) {
      setMessage(error instanceof ApiError
        ? error.status === 404
          ? 'Development sign-in is unavailable. Use your organization’s configured identity provider.'
          : error.message
        : error instanceof Error
          ? error.message
          : 'The onboarding service is unavailable. Try again shortly.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-heading">
        <div className="auth-panel__brand">
          <img src={`${import.meta.env.BASE_URL}brand/optimum-partners-logo.png`} alt="Optimum Partners" />
          <span>Onboarding workspace</span>
        </div>
        <div className="auth-panel__intro">
          <p className="eyebrow">Secure workspace</p>
          <h1 id="auth-heading">Start with your<br />workspace identity.</h1>
          <p>We check your profile with the onboarding API before opening team materials and role-specific tools.</p>
        </div>
        <div className="auth-tabs" role="tablist" aria-label="Account action">
          <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'is-active' : ''} onClick={() => setMode('login')}>Sign in</button>
          <button type="button" role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'is-active' : ''} onClick={() => setMode('signup')}>Sign up</button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {isSupabaseConfigured ? mode === 'signup' && <label>
            <span>Name <em>Optional</em></span>
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" />
          </label> : <label>
            <span>Workspace ID</span>
            <input value={userId} onChange={(event) => setUserId(event.target.value)} pattern="[A-Za-z0-9][A-Za-z0-9_-]{1,63}" required autoComplete="username" />
          </label>}
          <label>
            <span>Work email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          </label>
          {isSupabaseConfigured && <label>
            <span>Password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </label>}
          {message && <p className="auth-form__error" role="alert">{message}</p>}
          <button className="button button--primary" type="submit" disabled={submitting}>
            {mode === 'login' ? <KeyRound /> : <UserPlus />}
            {submitting ? 'Checking workspace…' : mode === 'login' ? 'Sign in to workspace' : 'Create workspace account'}
            {!submitting && <ArrowRight />}
          </button>
        </form>
        <aside className="auth-panel__notice">
          <ShieldCheck aria-hidden="true" />
          {isSupabaseConfigured
            ? <p><strong>Account access:</strong> your role and each onboarding block are resolved by the backend after you sign in. Ask an administrator if your account needs access.</p>
            : <p><strong>Local setup:</strong> <code>u-admin</code> is an administrator and <code>u-trainee</code> starts with no content access. Configure Supabase for production sign-in.</p>}
        </aside>
      </section>
      <aside className="auth-aside" aria-label="About this workspace">
        <span className="status-badge"><i /> Profile check required</span>
        <h2>One onboarding hub.<br />The right access.</h2>
        <p>Your role is resolved by the backend every time you begin a session, so the workspace can show the right tools without trusting the browser.</p>
      </aside>
    </main>
  )
}
