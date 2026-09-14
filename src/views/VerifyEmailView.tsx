import { useEffect, useState } from 'react'
import { authApi, setToken } from '../lib/api'
import { useToast } from '../context/ToastContext'

export default function VerifyEmailView() {
  const { showToast } = useToast()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [errorMsg, setErrorMsg] = useState('')

  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMsg('No verification token provided.')
      return
    }

    const verify = async () => {
      try {
        const res = await authApi.verifyEmail(token)
        setToken(res.token)
        setStatus('success')
        showToast('Email verified successfully!', 'success')
        
        // Redirect to app after a short delay
        setTimeout(() => {
          window.location.href = '/'
        }, 1500)
      } catch (err: any) {
        setStatus('error')
        setErrorMsg(err.message || 'Failed to verify email. The link may have expired.')
        showToast(err.message || 'Verification failed', 'error')
      }
    }

    verify()
  }, [token, showToast])

  const navigateToLogin = () => {
    window.location.href = '/signin'
  }

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center p-4">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-900/5 rounded-full blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-neutral-900/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-neutral-950/80 backdrop-blur-xl border border-neutral-800 rounded-2xl shadow-2xl p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 bg-neutral-900 rounded-xl flex items-center justify-center mx-auto mb-6 border border-neutral-800">
              <svg className="animate-spin h-8 w-8 text-neutral-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-neutral-100 mb-2">Verifying email...</h1>
            <p className="text-sm text-neutral-400">Please wait while we confirm your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
              <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-neutral-100 mb-2">Email Verified</h1>
            <p className="text-sm text-neutral-400">Redirecting you to the app...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-neutral-100 mb-2">Verification Failed</h1>
            <p className="text-sm text-neutral-400 mb-6">{errorMsg}</p>
            <button
              onClick={navigateToLogin}
              className="bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-sm font-medium py-2 px-6 rounded-xl transition-all border border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-700"
            >
              Go to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  )
}
