import { useState, useEffect } from 'react'
import { authApi } from '../lib/api'
import { useToast } from '../context/ToastContext'

export default function VerifyEmailPendingView() {
  const { showToast } = useToast()
  const [cooldown, setCooldown] = useState(0)
  const [isResending, setIsResending] = useState(false)

  // Get email from URL search params
  const urlParams = new URLSearchParams(window.location.search)
  const email = urlParams.get('email')

  useEffect(() => {
    let timer: number
    if (cooldown > 0) {
      timer = window.setInterval(() => setCooldown((c) => c - 1), 1000)
    }
    return () => clearInterval(timer)
  }, [cooldown])

  const handleResend = async () => {
    if (!email || cooldown > 0 || isResending) return

    setIsResending(true)
    try {
      await authApi.resendVerification({ email })
      showToast('Verification email resent successfully.', 'success')
      setCooldown(60) // 60 second cooldown
    } catch (err: any) {
      showToast(err.message || 'Failed to resend email', 'error')
    } finally {
      setIsResending(false)
    }
  }

  const navigateHome = () => {
    window.history.pushState({}, '', '/signin')
    window.dispatchEvent(new Event('popstate'))
  }

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center p-4">
      {/* Background glow (copied from SignInView) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-900/5 rounded-full blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-neutral-900/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-neutral-950/80 backdrop-blur-xl border border-neutral-800 rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-neutral-900 rounded-xl flex items-center justify-center mx-auto mb-6 border border-neutral-800">
            <svg
              className="w-8 h-8 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-neutral-100 mb-2">Check your email</h1>
          <p className="text-sm text-neutral-400">
            We sent a verification link to <br />
            <span className="text-neutral-200 font-medium">{email || 'your email address'}</span>
          </p>
        </div>

        <div className="space-y-6">
          <p className="text-sm text-neutral-500 text-center">
            Click the link in the email to verify your account. If you don't see it, check your spam folder.
          </p>

          <button
            onClick={handleResend}
            disabled={cooldown > 0 || isResending || !email}
            className="w-full bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-sm font-medium py-3 rounded-xl transition-all border border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isResending ? (
              <svg className="animate-spin h-5 w-5 text-neutral-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : cooldown > 0 ? (
              `Resend email in ${cooldown}s`
            ) : (
              'Resend verification email'
            )}
          </button>

          <div className="text-center pt-2">
            <button
              onClick={navigateHome}
              className="text-sm text-neutral-400 hover:text-neutral-300 transition-colors"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
