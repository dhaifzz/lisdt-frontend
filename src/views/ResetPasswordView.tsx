import { useState, useEffect } from 'react'
import lisdtLogo from '../assets/Lisdt.svg'
import { authApi } from '../lib/api'
import { toast } from '../context/ToastContext'

interface ResetPasswordViewProps {
  onNavigateSignIn: () => void
  onNavigateHome: () => void
}

export default function ResetPasswordView({
  onNavigateSignIn,
  onNavigateHome,
}: ResetPasswordViewProps) {
  const [token, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tokenParam = urlParams.get('token')
    if (!tokenParam) {
      setErrorMsg('No password reset token was provided in the link.')
    } else {
      setToken(tokenParam)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      toast.error('ERR: MISSING_RESET_TOKEN')
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

    if (password !== confirmPassword) {
      toast.error('ERR: PASSWORDS_DO_NOT_MATCH')
      return
    }

    try {
      setIsLoading(true)
      const res = await authApi.resetPassword({ token, password })
      setIsSuccess(true)
      toast.success(res.message || 'Password reset successfully')
      setTimeout(() => {
        onNavigateSignIn()
      }, 2500)
    } catch (err: any) {
      const msg = err.message || 'Failed to reset password'
      setErrorMsg(msg)
      toast.error(`ERR: ${msg.toUpperCase()}`)
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
            onClick={onNavigateHome}
            className="font-mono text-xs text-zinc-400 hover:text-white border border-zinc-900 hover:border-zinc-700 bg-zinc-950 px-3 py-1.5 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>RETURN_TO_HOME</span>
          </button>
        </div>
      </header>

      {/* Center Auth Area */}
      <main className="flex-1 min-h-0 relative z-10 flex items-center justify-center p-3 sm:p-5 overflow-hidden">
        <div className="w-full max-w-md max-h-[calc(100dvh-4.5rem)] sm:max-h-[calc(100dvh-5.5rem)] flex flex-col relative my-auto">
          {/* Decorative Corner Tech Brackets */}
          <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-zinc-500 pointer-events-none z-20" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-zinc-500 pointer-events-none z-20" />
          <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-zinc-500 pointer-events-none z-20" />
          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-zinc-500 pointer-events-none z-20" />

          {/* Terminal Window Frame */}
          <div className="flex flex-col h-full max-h-full border border-zinc-800 bg-[#0c0c0c]/95 shadow-2xl backdrop-blur-sm overflow-hidden">
            {/* Terminal Window Header */}
            <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-zinc-900 bg-zinc-950 font-mono text-[10px]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-zinc-400 tracking-wider">ESTABLISH NEW CREDENTIALS</span>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-thin p-6 sm:p-8 space-y-5">
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
                    Reset Password
                  </h1>
                  <p className="font-mono text-xs text-zinc-500 mt-0.5">
                    Define new security credentials for your account
                  </p>
                </div>
              </div>

              {isSuccess ? (
                <div className="space-y-4 pt-2">
                  <div className="p-4 border border-emerald-500/30 bg-emerald-950/20 text-emerald-300 font-mono text-xs space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <span>✓</span>
                      <span>PASSWORD OVERRIDE SUCCESSFUL</span>
                    </div>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      Your new password has been verified and registered with Lisdt.
                    </p>
                    <p className="text-zinc-500 text-[10px]">
                      Redirecting to sign in...
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onNavigateSignIn}
                    className="w-full bg-white hover:bg-zinc-200 text-black font-mono font-bold text-xs sm:text-sm py-2.5 px-4 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>SIGN IN NOW →</span>
                  </button>
                </div>
              ) : errorMsg && !token ? (
                <div className="space-y-4 pt-2">
                  <div className="p-4 border border-red-500/30 bg-red-950/20 text-red-300 font-mono text-xs space-y-2">
                    <div className="flex items-center gap-2 text-red-400 font-bold">
                      <span>⚠</span>
                      <span>INVALID OR MISSING TOKEN</span>
                    </div>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      {errorMsg}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onNavigateSignIn}
                    className="w-full bg-white hover:bg-zinc-200 text-black font-mono font-bold text-xs sm:text-sm py-2.5 px-4 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>← RETURN TO SIGN IN</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* New Password Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="reset-password-new"
                        className="block font-mono text-xs text-zinc-400 tracking-wider"
                      >
                        NEW PASSWORD
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
                        id="reset-password-new"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        minLength={8}
                        maxLength={128}
                        autoFocus
                        required
                        className="w-full bg-[#080808] border border-zinc-800 focus:border-white text-white font-mono text-xs sm:text-sm px-3.5 py-2.5 outline-none transition-colors placeholder:text-zinc-700"
                      />
                    </div>
                  </div>

                  {/* Confirm Password Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="reset-password-confirm"
                        className="block font-mono text-xs text-zinc-400 tracking-wider"
                      >
                        CONFIRM NEW PASSWORD
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
                        id="reset-password-confirm"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
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
                      id="reset-submit-btn"
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-white hover:bg-zinc-200 text-black font-mono font-bold text-xs sm:text-sm py-2.5 px-4 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                    >
                      {isLoading ? (
                        <>
                          <span className="animate-spin text-xs">◴</span>
                          <span>RESETTING_CREDENTIALS...</span>
                        </>
                      ) : (
                        <span>UPDATE_PASSWORD →</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={onNavigateSignIn}
                      className="w-full font-mono text-xs text-zinc-500 hover:text-zinc-300 py-1.5 transition-colors cursor-pointer text-center mt-1"
                    >
                      [ CANCEL ]
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
