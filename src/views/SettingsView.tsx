import { useState, useEffect, useRef } from 'react'
import Header from '../components/layout/Header'
import { authApi, setToken, AuthUser } from '../lib/api'
import { toast } from '../context/ToastContext'
import { useTheme } from '../context/ThemeContext'

interface SettingsViewProps {
  currentUser: string | null
  currentAvatar?: string | null
  onBack: () => void
  onNavigateHome: () => void
  onNavigateLibrary: () => void
  onNavigateSettings: () => void
  onUpdateUser: (newUsername: string, newAvatar?: string | null) => void
  onSignOut: () => void
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif']
const MAX_BYTES = 3 * 1024 * 1024 // 3 MB
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 32 32' fill='%233f3f46'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E"

export default function SettingsView({
  currentUser,
  currentAvatar,
  onBack,
  onNavigateHome,
  onNavigateLibrary,
  onNavigateSettings,
  onUpdateUser,
  onSignOut,
}: SettingsViewProps) {
  const { theme, setTheme } = useTheme()
  const isLight = theme === 'light'

  // Ensure page starts at the top
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  // Handle ESC key to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onBack])

  const [userProfile, setUserProfile] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Profile Form state
  const rawUsername = currentUser?.replace(/^@/, '') || ''
  const [username, setUsername] = useState(rawUsername)
  const [profileSaving, setProfileSaving] = useState(false)

  // Avatar state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatar || null)
  const [avatarUploading, setAvatarUploading] = useState(false)

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)

  // Delete Account Form state
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteSaving, setDeleteSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteToken, setDeleteToken] = useState('')

  const generateDeleteToken = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  // Load user details
  useEffect(() => {
    let mounted = true
    authApi
      .me()
      .then((res) => {
        if (!mounted) return
        setUserProfile(res.user)
        setUsername(res.user.username)
        if (res.user.avatar) {
          setAvatarPreview(res.user.avatar)
        }
      })
      .catch((err) => {
        console.error('Failed to load user settings:', err)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  // Handle Avatar Change
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('ERR: ONLY_PNG_JPEG_OR_GIF_ALLOWED')
      return
    }

    if (file.size > MAX_BYTES) {
      toast.error('ERR: IMAGE_EXCEEDS_3MB_LIMIT')
      return
    }

    setAvatarUploading(true)

    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      setAvatarPreview(dataUrl)
      try {
        const res = await authApi.uploadAvatar(dataUrl)
        const updatedAvatar = res.user.avatar ?? dataUrl
        onUpdateUser(currentUser || `@${username}`, updatedAvatar)
        toast.success('AVATAR_UPDATED_SUCCESSFULLY')
      } catch (err: any) {
        toast.error(`ERR: ${err?.message || 'UPLOAD_FAILED'}`)
        setAvatarPreview(userProfile?.avatar || currentAvatar || null)
      } finally {
        setAvatarUploading(false)
      }
    }
    reader.onerror = () => {
      toast.error('ERR: FILE_READ_ERROR')
      setAvatarUploading(false)
    }
    reader.readAsDataURL(file)
  }

  // Handle Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    const clean = username.trim().replace(/^@/, '')
    if (!clean) {
      toast.error('ERR: USERNAME_REQUIRED')
      return
    }

    if (/\s/.test(clean)) {
      toast.error('ERR: USERNAME_CANNOT_CONTAIN_SPACES')
      return
    }

    if (clean.length < 3 || clean.length > 30) {
      toast.error('ERR: USERNAME_MUST_BE_3_TO_30_CHARACTERS')
      return
    }

    if (!USERNAME_REGEX.test(clean)) {
      toast.error('ERR: USERNAME_CAN_ONLY_CONTAIN_LETTERS_NUMBERS_UNDERSCORES_AND_HYPHENS')
      return
    }

    setProfileSaving(true)
    try {
      const res = await authApi.updateProfile({
        username: clean,
      })

      if (res.token) {
        setToken(res.token)
      }

      const formattedName = `@${res.user.username}`
      onUpdateUser(formattedName, res.user.avatar)
      toast.success('PROFILE_SAVED_SUCCESSFULLY')
    } catch (err: any) {
      toast.error(`ERR: ${err?.message?.toUpperCase() || 'UPDATE_FAILED'}`)
    } finally {
      setProfileSaving(false)
    }
  }

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword) {
      toast.error('ERR: CURRENT_PASSWORD_REQUIRED')
      return
    }

    if (!newPassword || newPassword.length < 8) {
      toast.error('ERR: NEW_PASSWORD_MIN_8_CHARS')
      return
    }

    if (newPassword.length > 128) {
      toast.error('ERR: NEW_PASSWORD_MAX_128_CHARS')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('ERR: PASSWORDS_DO_NOT_MATCH')
      return
    }

    setPasswordSaving(true)
    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
      })
      toast.success('PASSWORD_UPDATED_SUCCESSFULLY')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast.error(`ERR: ${err?.message?.toUpperCase() || 'PASSWORD_UPDATE_FAILED'}`)
    } finally {
      setPasswordSaving(false)
    }
  }

  // Handle Account Deletion
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!deletePassword) {
      toast.error('ERR: PASSWORD_REQUIRED_FOR_DELETION')
      return
    }

    if (deleteConfirmText.trim() !== deleteToken) {
      toast.error('ERR: CONFIRMATION_CODE_MISMATCH')
      return
    }

    setDeleteSaving(true)
    try {
      await authApi.deleteAccount({ password: deletePassword })
      toast.success('ACCOUNT_DELETED_PERMANENTLY')
      onSignOut()
    } catch (err: any) {
      toast.error(`ERR: ${err?.message?.toUpperCase() || 'DELETION_FAILED'}`)
      setDeleteSaving(false)
    }
  }

  const memberSince = userProfile?.createdAt
    ? new Date(userProfile.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Unknown'

  return (
    <div
      className={`min-h-screen flex flex-col justify-between overflow-x-clip relative transition-colors duration-200 ${
        isLight
          ? 'bg-[#f5f5f7] text-zinc-900 selection:bg-zinc-900 selection:text-white'
          : 'bg-[#080808] text-white selection:bg-white selection:text-black'
      }`}
    >
      {/* Background Ambient Cybernetic Lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
        <div
          className={`absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[450px] rounded-full blur-3xl ${
            isLight ? 'bg-zinc-200/50' : 'bg-white/[0.012]'
          }`}
        />
        <div
          className={`absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full blur-3xl ${
            isLight ? 'bg-emerald-500/[0.03]' : 'bg-emerald-500/[0.012]'
          }`}
        />
        <div className={`absolute top-20 left-0 right-0 h-[1px] ${isLight ? 'bg-zinc-200' : 'bg-zinc-900/40'}`} />
        <div className={`absolute top-2/3 left-0 right-0 h-[1px] ${isLight ? 'bg-zinc-200' : 'bg-zinc-900/30'}`} />
      </div>

      {/* Shared Navigation Bar (same as Library page, with activeRoute="settings") */}
      <Header
        onNavigateHome={onNavigateHome}
        onNavigateLibrary={onNavigateLibrary}
        onNavigateSettings={onNavigateSettings}
        currentUser={currentUser}
        onSignOut={onSignOut}
        activeRoute="settings"
        isLight={isLight}
      />

      {/* Main Settings Body */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 relative z-10">
        {/* Page Header */}
        <div className={`mb-4 pb-3 md:mb-8 md:pb-6 border-b ${isLight ? 'border-zinc-200' : 'border-zinc-900'}`}>
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight mt-1 ${isLight ? 'text-zinc-950' : 'text-white'}`}>
              Account Settings
            </h1>
            <p className={`font-mono text-xs mt-1 ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>
              Manage your personal diary profile, credentials, and system preferences.
            </p>
          </div>
        </div>

        {loading ? (
          <div className={`py-20 flex flex-col items-center justify-center gap-3 font-mono text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-600'}`}>
            <div className={`w-5 h-5 border-2 rounded-full animate-spin ${isLight ? 'border-zinc-300 border-t-zinc-700' : 'border-zinc-800 border-t-zinc-400'}`} />
            <span>LOADING_USER_DATA...</span>
          </div>
        ) : (
          <div className="space-y-10">
            {/* ─── SECTION 1: USER IDENTITY & AVATAR ─────────────────── */}
            <div
              className={`border p-6 sm:p-8 relative transition-colors ${
                isLight ? 'border-zinc-200 bg-white shadow-xs' : 'border-zinc-900 bg-zinc-950/70'
              }`}
            >
              <div className={`absolute -top-1 -left-1 w-2 h-2 border-t border-l pointer-events-none ${isLight ? 'border-zinc-300' : 'border-zinc-700'}`} />
              <div className={`absolute -top-1 -right-1 w-2 h-2 border-t border-r pointer-events-none ${isLight ? 'border-zinc-300' : 'border-zinc-700'}`} />

              <div className={`flex items-center gap-2 mb-6 border-b pb-3 font-mono text-xs ${isLight ? 'border-zinc-200 text-zinc-600' : 'border-zinc-900 text-zinc-400'}`}>
                <span className="text-emerald-500">■</span>
                <span className="font-semibold tracking-wider uppercase">01 · PROFILE &amp; IDENTITY</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-8 items-start">
                {/* Left: Avatar Management */}
                <div className="flex flex-col items-center sm:items-start gap-3">
                  <span className={`font-mono text-[10px] tracking-wider uppercase ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>
                    AVATAR_PHOTO
                  </span>
                  <div
                    onClick={() => !avatarUploading && fileInputRef.current?.click()}
                    className={`group relative w-32 h-32 border transition-all cursor-pointer overflow-hidden flex items-center justify-center shadow-md ${
                      isLight
                        ? 'bg-zinc-100 border-zinc-300 hover:border-zinc-500'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600 shadow-lg'
                    }`}
                    title="Click to update avatar"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.gif"
                      className="hidden"
                      onChange={handleAvatarFileChange}
                    />

                    <img
                      src={avatarPreview || DEFAULT_AVATAR}
                      alt="Avatar Preview"
                      className={`w-full h-full object-cover transition-opacity ${
                        avatarUploading ? 'opacity-30' : 'opacity-100'
                      }`}
                    />

                    {/* Hover Overlay */}
                    {!avatarUploading && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 pointer-events-none">
                        <span className="font-mono text-[9px] text-white tracking-widest font-bold">CHANGE</span>
                        <span className="font-mono text-[8px] text-zinc-400">PNG·JPG·GIF</span>
                      </div>
                    )}

                    {/* Upload Spinner */}
                    {avatarUploading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  <p className={`font-mono text-[9px] text-center sm:text-left ${isLight ? 'text-zinc-500' : 'text-zinc-600'}`}>
                    Max size: 3 MB. Square 1:1 ratio recommended.
                  </p>
                </div>

                {/* Right: Username Form */}
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className={`block font-mono text-[10px] uppercase tracking-wider mb-1.5 ${isLight ? 'text-zinc-600' : 'text-zinc-500'}`}>
                      Username (Display Handle)
                    </label>
                    <div
                      className={`flex items-center border transition-colors ${
                        isLight
                          ? 'border-zinc-300 bg-zinc-50 focus-within:border-zinc-600 focus-within:bg-white'
                          : 'border-zinc-900 bg-zinc-950 focus-within:border-zinc-700'
                      }`}
                    >
                      <span className={`pl-3 font-mono text-xs select-none ${isLight ? 'text-zinc-400' : 'text-zinc-600'}`}>@</span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="your_handle"
                        maxLength={30}
                        className={`w-full bg-transparent font-mono text-xs px-2 py-2.5 outline-none ${
                          isLight ? 'text-zinc-900 placeholder-zinc-400' : 'text-white placeholder-zinc-700'
                        }`}
                      />
                    </div>
                    <span className={`font-mono text-[9px] block mt-1 ${isLight ? 'text-zinc-500' : 'text-zinc-600'}`}>
                      {username.replace(/^@/, '').length}/30 characters. Letters, numbers, _ and - only.
                    </span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className={`font-mono text-xs font-semibold px-4 py-2 transition-colors cursor-pointer disabled:opacity-50 ${
                        isLight
                          ? 'bg-zinc-900 hover:bg-black text-white shadow-xs'
                          : 'bg-white hover:bg-zinc-200 text-black'
                      }`}
                    >
                      {profileSaving ? 'SAVING_CHANGES...' : 'SAVE_USERNAME'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* ─── SECTION 2: SECURITY & CREDENTIALS ─────────────────── */}
            <div
              className={`border p-6 sm:p-8 relative transition-colors ${
                isLight ? 'border-zinc-200 bg-white shadow-xs' : 'border-zinc-900 bg-zinc-950/70'
              }`}
            >
              <div className={`absolute -top-1 -left-1 w-2 h-2 border-t border-l pointer-events-none ${isLight ? 'border-zinc-300' : 'border-zinc-700'}`} />
              <div className={`absolute -top-1 -right-1 w-2 h-2 border-t border-r pointer-events-none ${isLight ? 'border-zinc-300' : 'border-zinc-700'}`} />

              <div className={`flex items-center gap-2 mb-6 border-b pb-3 font-mono text-xs ${isLight ? 'border-zinc-200 text-zinc-600' : 'border-zinc-900 text-zinc-400'}`}>
                <span className="text-blue-500">■</span>
                <span className="font-semibold tracking-wider uppercase">02 · SECURITY &amp; PASSWORD</span>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                <div>
                  <label className={`block font-mono text-[10px] uppercase tracking-wider mb-1.5 ${isLight ? 'text-zinc-600' : 'text-zinc-500'}`}>
                    Current Password
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full font-mono text-xs p-2.5 outline-none transition-colors border ${
                      isLight
                        ? 'bg-zinc-50 border-zinc-300 focus:border-zinc-600 focus:bg-white text-zinc-900 placeholder-zinc-400'
                        : 'bg-zinc-950 border-zinc-900 focus:border-zinc-700 text-white placeholder-zinc-700'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block font-mono text-[10px] uppercase tracking-wider mb-1.5 ${isLight ? 'text-zinc-600' : 'text-zinc-500'}`}>
                      New Password
                    </label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters (max 128)"
                      minLength={8}
                      maxLength={128}
                      className={`w-full font-mono text-xs p-2.5 outline-none transition-colors border ${
                        isLight
                          ? 'bg-zinc-50 border-zinc-300 focus:border-zinc-600 focus:bg-white text-zinc-900 placeholder-zinc-400'
                          : 'bg-zinc-950 border-zinc-900 focus:border-zinc-700 text-white placeholder-zinc-700'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block font-mono text-[10px] uppercase tracking-wider mb-1.5 ${isLight ? 'text-zinc-600' : 'text-zinc-500'}`}>
                      Confirm New Password
                    </label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      minLength={8}
                      maxLength={128}
                      className={`w-full font-mono text-xs p-2.5 outline-none transition-colors border ${
                        isLight
                          ? 'bg-zinc-50 border-zinc-300 focus:border-zinc-600 focus:bg-white text-zinc-900 placeholder-zinc-400'
                          : 'bg-zinc-950 border-zinc-900 focus:border-zinc-700 text-white placeholder-zinc-700'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className={`font-mono text-[10px] transition-colors cursor-pointer ${
                      isLight ? 'text-zinc-600 hover:text-zinc-950' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    [{showPasswords ? 'HIDE_PASSWORDS' : 'SHOW_PASSWORDS'}]
                  </button>

                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className={`font-mono text-xs border px-4 py-2 transition-colors cursor-pointer disabled:opacity-50 ${
                      isLight
                        ? 'border-zinc-300 text-zinc-800 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200'
                        : 'border-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-850'
                    }`}
                  >
                    {passwordSaving ? 'UPDATING...' : 'UPDATE_PASSWORD'}
                  </button>
                </div>
              </form>
            </div>

            {/* ─── SECTION 3: INTERFACE & DISPLAY THEME ─────────────────── */}
            <div
              className={`border p-6 sm:p-8 relative transition-colors ${
                isLight ? 'border-zinc-200 bg-white shadow-xs' : 'border-zinc-900 bg-zinc-950/70'
              }`}
            >
              <div className={`absolute -top-1 -left-1 w-2 h-2 border-t border-l pointer-events-none ${isLight ? 'border-zinc-300' : 'border-zinc-700'}`} />
              <div className={`absolute -top-1 -right-1 w-2 h-2 border-t border-r pointer-events-none ${isLight ? 'border-zinc-300' : 'border-zinc-700'}`} />

              <div className={`flex items-center gap-2 mb-6 border-b pb-3 font-mono text-xs ${isLight ? 'border-zinc-200 text-zinc-600' : 'border-zinc-900 text-zinc-400'}`}>
                <span className="text-amber-500">■</span>
                <span className="font-semibold tracking-wider uppercase">03 · INTERFACE &amp; DISPLAY THEME</span>
              </div>

              <div className="space-y-4">
                <p className={`font-mono text-xs leading-relaxed max-w-2xl ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  Choose your visual preference. When enabled, <span className="font-bold underline">Light Mode</span> applies strictly to your Library collection and Account Settings. Landing, Authentication, and Verification views stay permanently in stealth dark mode.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Dark Mode Card */}
                  <div
                    id="theme-option-dark"
                    onClick={() => setTheme('dark')}
                    className={`p-4 border cursor-pointer transition-all relative select-none ${
                      theme === 'dark'
                        ? isLight
                          ? 'border-zinc-900 bg-zinc-100 text-zinc-950 shadow-md ring-1 ring-zinc-900/20'
                          : 'border-white bg-zinc-900 text-white shadow-lg ring-1 ring-white/20'
                        : isLight
                        ? 'border-zinc-200 bg-zinc-50 hover:border-zinc-400 text-zinc-600'
                        : 'border-zinc-900 bg-zinc-950/50 hover:border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm leading-none">☾</span>
                        <span className="font-mono text-xs font-bold tracking-wider">DARK MODE</span>
                      </div>
                      {theme === 'dark' && (
                        <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 tracking-widest ${
                          isLight ? 'bg-zinc-900 text-white' : 'bg-white text-black'
                        }`}>
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className={`font-mono text-[10px] leading-normal ${theme === 'dark' ? (isLight ? 'text-zinc-700' : 'text-zinc-300') : (isLight ? 'text-zinc-500' : 'text-zinc-500')}`}>
                      Stealth terminal palette. Deep black canvas with high-contrast monochrome and neon indicators.
                    </p>
                    <div className="mt-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-xs bg-[#080808] border border-zinc-700" />
                        <span className="w-3.5 h-3.5 rounded-xs bg-zinc-900 border border-zinc-700" />
                        <span className="w-3.5 h-3.5 rounded-xs bg-emerald-500" />
                      </div>
                    </div>
                  </div>

                  {/* Light Mode Card */}
                  <div
                    id="theme-option-light"
                    onClick={() => setTheme('light')}
                    className={`p-4 border cursor-pointer transition-all relative select-none ${
                      theme === 'light'
                        ? isLight
                          ? 'border-zinc-900 bg-white text-zinc-950 shadow-md ring-1 ring-zinc-900/30'
                          : 'border-white bg-zinc-900 text-white shadow-lg ring-1 ring-white/20'
                        : isLight
                        ? 'border-zinc-200 bg-zinc-50 hover:border-zinc-400 text-zinc-600'
                        : 'border-zinc-900 bg-zinc-950/50 hover:border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-500 text-sm leading-none">☀</span>
                        <span className="font-mono text-xs font-bold tracking-wider">LIGHT MODE</span>
                      </div>
                      {theme === 'light' && (
                        <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 tracking-widest ${
                          isLight ? 'bg-zinc-900 text-white' : 'bg-white text-black'
                        }`}>
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className={`font-mono text-[10px] leading-normal ${theme === 'light' ? (isLight ? 'text-zinc-700' : 'text-zinc-300') : (isLight ? 'text-zinc-500' : 'text-zinc-500')}`}>
                      Clean minimalist aesthetic. Paper-white canvas with dark zinc typography and sharp borders.
                    </p>
                    <div className="mt-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-xs bg-[#f5f5f7] border border-zinc-300" />
                        <span className="w-3.5 h-3.5 rounded-xs bg-white border border-zinc-300" />
                        <span className="w-3.5 h-3.5 rounded-xs bg-zinc-900" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── SECTION 4: SYSTEM METRICS & DETAILS ─────────────────── */}
            <div
              className={`border p-6 sm:p-8 relative transition-colors ${
                isLight ? 'border-zinc-200 bg-white shadow-xs' : 'border-zinc-900 bg-zinc-950/70'
              }`}
            >
              <div className={`absolute -top-1 -left-1 w-2 h-2 border-t border-l pointer-events-none ${isLight ? 'border-zinc-300' : 'border-zinc-700'}`} />
              <div className={`absolute -top-1 -right-1 w-2 h-2 border-t border-r pointer-events-none ${isLight ? 'border-zinc-300' : 'border-zinc-700'}`} />

              <div className={`flex items-center gap-2 mb-6 border-b pb-3 font-mono text-xs ${isLight ? 'border-zinc-200 text-zinc-600' : 'border-zinc-900 text-zinc-400'}`}>
                <span className="text-zinc-500">■</span>
                <span className="font-semibold tracking-wider uppercase">04 · SYSTEM &amp; ACCOUNT METRICS</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
                <div className={`border p-3 ${isLight ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-900 bg-zinc-950'}`}>
                  <span className={`text-[10px] uppercase block ${isLight ? 'text-zinc-500' : 'text-zinc-600'}`}>REGISTERED_EMAIL</span>
                  <span className={`font-medium truncate block mt-1 ${isLight ? 'text-zinc-900' : 'text-white'}`} title={userProfile?.email}>
                    {userProfile?.email || 'N/A'}
                  </span>
                </div>

                <div className={`border p-3 ${isLight ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-900 bg-zinc-950'}`}>
                  <span className={`text-[10px] uppercase block ${isLight ? 'text-zinc-500' : 'text-zinc-600'}`}>MEMBER_SINCE</span>
                  <span className={`font-medium block mt-1 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                    {memberSince}
                  </span>
                </div>

                <div className={`border p-3 ${isLight ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-900 bg-zinc-950'}`}>
                  <span className={`text-[10px] uppercase block ${isLight ? 'text-zinc-500' : 'text-zinc-600'}`}>TOTAL_ENTRIES</span>
                  <span className={`font-medium block mt-1 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                    {userProfile?._count?.mediaItems ?? '0'} records
                  </span>
                </div>

                <div className={`border p-3 ${isLight ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-900 bg-zinc-950'}`}>
                  <span className={`text-[10px] uppercase block ${isLight ? 'text-zinc-500' : 'text-zinc-600'}`}>CUSTOM_CHANNELS</span>
                  <span className={`font-medium block mt-1 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                    {userProfile?._count?.categories ?? '0'} libraries
                  </span>
                </div>
              </div>
            </div>

            {/* ─── SECTION 5: DANGER ZONE / ACCOUNT ERADICATION ───────── */}
            <div
              className={`border p-6 sm:p-8 relative transition-colors ${
                isLight ? 'border-red-200 bg-red-50/40' : 'border-red-900/60 bg-red-950/10'
              }`}
            >
              <div className={`absolute -top-1 -left-1 w-2 h-2 border-t border-l pointer-events-none ${isLight ? 'border-red-300' : 'border-red-600'}`} />
              <div className={`absolute -top-1 -right-1 w-2 h-2 border-t border-r pointer-events-none ${isLight ? 'border-red-300' : 'border-red-600'}`} />

              <div className={`flex items-center gap-2 mb-4 border-b pb-3 font-mono text-xs ${isLight ? 'border-red-200 text-red-600' : 'border-red-900/40 text-red-400'}`}>
                <span className="text-red-500 font-bold">▲</span>
                <span className="font-semibold tracking-wider uppercase">05 · DANGER ZONE · DELETE ACCOUNT &amp; ALL DATA</span>
              </div>

              <div className="space-y-4">
                <p className={`font-mono text-xs leading-relaxed max-w-2xl ${isLight ? 'text-zinc-700' : 'text-zinc-400'}`}>
                  Permanently delete your account and all records. This action is{' '}
                  <span className="text-red-500 font-semibold underline">immediate and irreversible</span>.
                  All tracked media titles, watching history, custom library categories, and user credentials will be permanently erased from the database.
                </p>

                {!showDeleteConfirm ? (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const token = generateDeleteToken()
                        setDeleteToken(token)
                        setShowDeleteConfirm(true)
                      }}
                      className={`font-mono text-xs border px-4 py-2.5 transition-colors cursor-pointer flex items-center gap-2 ${
                        isLight
                          ? 'border-red-300 bg-red-100 hover:bg-red-200 text-red-700 font-semibold'
                          : 'border-red-900/80 bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white'
                      }`}
                    >
                      <span>⚠</span>
                      <span>DELETE_ACCOUNT_AND_DATA</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleDeleteAccount} className={`pt-4 border-t space-y-4 max-w-md ${isLight ? 'border-red-200' : 'border-red-900/30'}`}>
                    <div className={`border p-3 font-mono text-[11px] space-y-1 ${isLight ? 'bg-white border-red-200 text-red-700' : 'bg-black/60 border-red-900/40 text-red-300'}`}>
                      <p className="font-bold">CONFIRMATION REQUIRED:</p>
                      <p className={`text-xs ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        Enter your current password and type the code below exactly to confirm permanent erasure.
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`font-bold tracking-[0.3em] border px-3 py-1.5 text-sm select-all font-mono ${
                          isLight ? 'bg-zinc-100 border-zinc-300 text-zinc-900' : 'text-white bg-zinc-900 border-zinc-700'
                        }`}>
                          {deleteToken}
                        </span>
                        <span className={`text-[10px] ${isLight ? 'text-zinc-500' : 'text-zinc-600'}`}>← type this exactly</span>
                      </div>
                    </div>

                    <div>
                      <label className={`block font-mono text-[10px] uppercase tracking-wider mb-1.5 ${isLight ? 'text-zinc-700' : 'text-zinc-400'}`}>
                        Account Password
                      </label>
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Enter your current password"
                        className={`w-full font-mono text-xs p-2.5 outline-none transition-colors border ${
                          isLight
                            ? 'bg-white border-red-300 focus:border-red-500 text-zinc-900 placeholder-zinc-400'
                            : 'bg-zinc-950 border-red-900/60 focus:border-red-500 text-white placeholder-zinc-700'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block font-mono text-[10px] uppercase tracking-wider mb-1.5 ${isLight ? 'text-zinc-700' : 'text-zinc-400'}`}>
                        Confirmation Code
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder={`Type ${deleteToken}`}
                        autoComplete="off"
                        spellCheck={false}
                        className={`w-full border focus:border-red-500 font-mono text-xs p-2.5 outline-none transition-colors tracking-widest ${
                          isLight ? 'bg-white text-zinc-900 placeholder-zinc-400' : 'bg-zinc-950 text-white placeholder-zinc-700'
                        } ${
                          deleteConfirmText.length > 0 && deleteConfirmText !== deleteToken.slice(0, deleteConfirmText.length)
                            ? 'border-red-700'
                            : deleteConfirmText === deleteToken
                            ? 'border-emerald-600'
                            : isLight ? 'border-red-300' : 'border-red-900/60'
                        }`}
                      />
                      {deleteConfirmText.length > 0 && (
                        <p className={`font-mono text-[9px] mt-1 ${
                          deleteConfirmText === deleteToken ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {deleteConfirmText === deleteToken ? '✓ CODE MATCHES' : '✗ CODE MISMATCH'}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={deleteSaving}
                        className="font-mono text-xs bg-red-700 hover:bg-red-600 text-white font-bold px-4 py-2.5 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-red-950"
                      >
                        <span>✕</span>
                        <span>{deleteSaving ? 'DELETING_ALL_DATA...' : 'PERMANENTLY_DELETE_ACCOUNT'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeleteConfirm(false)
                          setDeletePassword('')
                          setDeleteConfirmText('')
                          setDeleteToken('')
                        }}
                        className={`font-mono text-xs px-3 py-2 transition-colors cursor-pointer ${
                          isLight ? 'text-zinc-600 hover:text-zinc-950' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        [ CANCEL ]
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
