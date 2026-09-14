import { useState, useRef, useEffect } from 'react'
import lisdtLogo from '../assets/Lisdt.svg'
import { authApi } from '../lib/api'
import { toast } from '../context/ToastContext'

const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

interface SignUpViewProps {
  onBack: () => void
  onNavigateSignIn: () => void
}

export default function SignUpView({
  onBack,
  onNavigateSignIn,
}: SignUpViewProps) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const cardScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (cooldownRemaining <= 0) return
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldownRemaining])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (cooldownRemaining > 0) {
      toast.error(`ERR: RATE_LIMITED_WAIT_${cooldownRemaining}S`)
      return
    }

    const cleanUsername = username.trim()
    if (!cleanUsername) {
      toast.error('ERR: USERNAME_REQUIRED')
      return
    }

    if (/\s/.test(username)) {
      toast.error('ERR: USERNAME_CANNOT_CONTAIN_SPACES')
      return
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      toast.error('ERR: USERNAME_MUST_BE_3_TO_30_CHARACTERS')
      return
    }

    if (!USERNAME_REGEX.test(cleanUsername)) {
      toast.error('ERR: USERNAME_CAN_ONLY_CONTAIN_LETTERS_NUMBERS_UNDERSCORES_AND_HYPHENS')
      return
    }

    const cleanEmail = email.trim()
    if (!cleanEmail) {
      toast.error('ERR: EMAIL_REQUIRED')
      return
    }

    if (cleanEmail.length > 254) {
      toast.error('ERR: EMAIL_EXCEEDS_254_CHARACTERS')
      return
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      toast.error('ERR: INVALID_EMAIL_FORMAT')
      return
    }

    if (!password) {
      toast.error('ERR: PASSWORD_REQUIRED')
      return
    }

    if (password.length < 8) {
      toast.error('ERR: PASSWORD_TOO_SHORT (MIN 8 CHARS)')
      return
    }

    if (password.length > 128) {
      toast.error('ERR: PASSWORD_TOO_LONG (MAX 128 CHARS)')
      return
    }

    if (!confirmPassword) {
      toast.error('ERR: CONFIRM_PASSWORD_REQUIRED')
      return
    }

    if (password !== confirmPassword) {
      toast.error('ERR: PASSWORDS_DO_NOT_MATCH')
      return
    }

    setIsLoading(true)
    try {
      const result = await authApi.register({
        username: cleanUsername,
        email: cleanEmail,
        password,
      })
      
      setFailedAttempts(0)
      setCooldownRemaining(0)
      toast.success('VERIFICATION_EMAIL_SENT')
      
      // Navigate to verification pending screen
      const encodedEmail = encodeURIComponent(result.pendingEmail || cleanEmail)
      window.history.pushState({}, '', `/verify-email-pending?email=${encodedEmail}`)
      window.dispatchEvent(new Event('popstate'))

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'REGISTRATION_FAILED'
      const lower = msg.toLowerCase()

      if (lower.includes('too many') || lower.includes('429')) {
        setCooldownRemaining(60)
        toast.error('ERR: TOO_MANY_REGISTRATION_ATTEMPTS_PLEASE_WAIT')
      } else {
        const nextFailed = failedAttempts + 1
        setFailedAttempts(nextFailed)

        if (nextFailed >= 5) {
          setCooldownRemaining(30)
          setFailedAttempts(0)
          toast.error('ERR: TOO_MANY_FAILED_ATTEMPTS_LOCKED_30S')
        } else {
          toast.error(`ERR: ${msg.toUpperCase()}`)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen h-[100dvh] bg-[#080808] text-white flex flex-col justify-between overflow-hidden relative selection:bg-white selection:text-black">
      {/* Background Ambient Details */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.012] rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-emerald-500/[0.015] rounded-full blur-2xl" />

        <div className="absolute top-1/4 left-0 right-0 h-[1px] bg-zinc-900/40" />
        <div className="absolute bottom-1/4 left-0 right-0 h-[1px] bg-zinc-900/40" />
        <div className="absolute top-0 bottom-0 left-1/6 w-[1px] bg-zinc-900/25 hidden xl:block" />
        <div className="absolute top-0 bottom-0 right-1/6 w-[1px] bg-zinc-900/25 hidden xl:block" />

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-6 opacity-[0.015] select-none pointer-events-none">
          <img src={lisdtLogo} alt="" className="w-24 h-24 sm:w-36 sm:h-36 object-contain" />
          <span className="font-mono text-[10vw] font-black tracking-tighter uppercase">LISDT</span>
        </div>
      </div>

      {/* Top Navigation Bar */}
      <header className="shrink-0 sticky top-0 z-50 border-b border-zinc-900 bg-[#080808]/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-12 sm:h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 select-none">
            <img
              src={lisdtLogo}
              alt="Lisdt Logo"
              className="w-5 h-5 object-contain transition-transform duration-200 hover:scale-105"
            />
            <span className="font-mono font-bold text-white text-sm tracking-wide flicker">
              LISDT
            </span>
          </div>

          <button
            id="signup-btn-back"
            onClick={onBack}
            className="font-mono text-xs text-zinc-400 hover:text-white border border-zinc-900 hover:border-zinc-700 bg-zinc-950 px-3 py-1.5 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>RETURN_TO_HOME</span>
          </button>
        </div>
      </header>

      {/* Center Auth Area (Fixed to viewport height, outer page never scrolls) */}
      <main className="flex-1 min-h-0 relative z-10 flex items-center justify-center p-3 sm:p-5 overflow-hidden">
        <div className="w-full max-w-md max-h-[calc(100dvh-4.5rem)] sm:max-h-[calc(100dvh-5.5rem)] flex flex-col relative my-auto">
          {/* Decorative Corner Tech Brackets */}
          <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-zinc-500 pointer-events-none z-20" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-zinc-500 pointer-events-none z-20" />
          <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-zinc-500 pointer-events-none z-20" />
          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-zinc-500 pointer-events-none z-20" />

          {/* Terminal Window Frame */}
          <div className="flex flex-col h-full max-h-full border border-zinc-800 bg-[#0c0c0c]/95 shadow-2xl backdrop-blur-sm overflow-hidden">
            {/* Terminal Window Header (Fixed inside card) */}
            <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-zinc-900 bg-zinc-950 font-mono text-[10px]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-zinc-400 tracking-wider">CREATE ACCOUNT</span>
              </div>
            </div>

            {/* Scrollable Form Body (Scrollbar strictly inside the card) */}
            <div
              ref={cardScrollRef}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-thin"
            >
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0 mt-0.5">
                    <img
                      src={lisdtLogo}
                      alt="Lisdt Logo"
                      className="w-9 h-9 object-contain animate-logo-stumble hover-logo-stumble filter drop-shadow-[0_0_10px_rgba(255,255,255,0.12)] cursor-pointer"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                      Create an account
                    </h1>
                    <p className="font-mono text-xs text-zinc-500 mt-0.5">
                      Enter details to register your diary profile
                    </p>
                  </div>
                </div>

                {/* Username Input */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-username"
                    className="block font-mono text-xs text-zinc-400 tracking-wider"
                  >
                    USERNAME
                  </label>
                  <div className="relative">
                    <input
                      id="auth-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ''))}
                      onKeyDown={(e) => {
                        if (e.key === ' ') {
                          e.preventDefault()
                        }
                      }}
                      placeholder="Choose your username (3-30 chars)"
                      maxLength={30}
                      autoFocus
                      required
                      className="w-full bg-[#080808] border border-zinc-800 focus:border-white text-white font-mono text-xs sm:text-sm px-3.5 py-2.5 outline-none transition-colors placeholder:text-zinc-700"
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-email"
                    className="block font-mono text-xs text-zinc-400 tracking-wider"
                  >
                    EMAIL
                  </label>
                  <div className="relative">
                    <input
                      id="auth-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value.replace(/\s+/g, ''))}
                      onKeyDown={(e) => {
                        if (e.key === ' ') {
                          e.preventDefault()
                        }
                      }}
                      placeholder="lisdt.user@example.com"
                      maxLength={254}
                      required
                      className="w-full bg-[#080808] border border-zinc-800 focus:border-white text-white font-mono text-xs sm:text-sm px-3.5 py-2.5 outline-none transition-colors placeholder:text-zinc-700"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="auth-password"
                      className="block font-mono text-xs text-zinc-400 tracking-wider"
                    >
                      PASSWORD
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="font-mono text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer select-none"
                    >
                      {showPassword ? '[ HIDE ]' : '[ SHOW ]'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      minLength={8}
                      maxLength={128}
                      required
                      className="w-full bg-[#080808] border border-zinc-800 focus:border-white text-white font-mono text-xs sm:text-sm px-3.5 py-2.5 outline-none transition-colors placeholder:text-zinc-700"
                    />
                  </div>
                </div>

                {/* Re-enter Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="auth-confirm-password"
                      className="block font-mono text-xs text-zinc-400 tracking-wider"
                    >
                      RE-ENTER PASSWORD
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="font-mono text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer select-none"
                    >
                      {showConfirmPassword ? '[ HIDE ]' : '[ SHOW ]'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="auth-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      minLength={8}
                      maxLength={128}
                      required
                      className="w-full bg-[#080808] border border-zinc-800 focus:border-white text-white font-mono text-xs sm:text-sm px-3.5 py-2.5 outline-none transition-colors placeholder:text-zinc-700"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    id="signup-submit-btn"
                    type="submit"
                    disabled={isLoading || cooldownRemaining > 0}
                    className="w-full bg-white hover:bg-zinc-200 text-black font-mono font-bold text-xs sm:text-sm py-2.5 px-4 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                  >
                    {cooldownRemaining > 0 ? (
                      <span>RATE_LIMITED (WAIT {cooldownRemaining}s)</span>
                    ) : isLoading ? (
                      <>
                        <span className="animate-spin text-xs">◴</span>
                        <span>CREATING_ACCOUNT...</span>
                      </>
                    ) : (
                      <span>CREATE_ACCOUNT →</span>
                    )}
                  </button>

                  <div className="text-center pt-1 font-mono text-[11px] text-zinc-500">
                    <span>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={onNavigateSignIn}
                        className="text-zinc-300 hover:text-white underline cursor-pointer transition-colors"
                      >
                        Sign In
                      </button>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={onBack}
                    className="w-full font-mono text-xs text-zinc-500 hover:text-zinc-300 py-1.5 transition-colors cursor-pointer text-center mt-1"
                  >
                    [ CANCEL ]
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
