import lisdtDarkLogo from '../../assets/Lisdt.svg'
import lisdtLightLogo from '../../assets/Lisdt2.svg'
import { useTheme } from '../../context/ThemeContext'

interface HeaderProps {
  onNavigateHome?: () => void
  onNavigateLibrary?: () => void
  onNavigateSignIn?: () => void
  onNavigateSignUp?: () => void
  onNavigateSettings?: () => void
  onOpenSignIn?: () => void
  currentUser?: string | null
  onSignOut?: () => void
  activeRoute?: 'landing' | 'library' | 'signin' | 'signup' | 'edit' | 'settings'
  isLight?: boolean
}

export default function Header({
  onNavigateHome,
  onNavigateLibrary,
  onNavigateSignIn,
  onNavigateSignUp,
  onNavigateSettings,
  onOpenSignIn,
  currentUser,
  onSignOut,
  activeRoute = 'library',
  isLight: propIsLight,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme()
  
  // Light mode strictly applies only to library and settings pages
  const isLight = propIsLight ?? (theme === 'light' && (activeRoute === 'library' || activeRoute === 'settings'))
  const logoSrc = isLight ? lisdtLightLogo : lisdtDarkLogo

  const handleSignIn = (e: React.MouseEvent) => {
    e.preventDefault()
    if (onNavigateSignIn) onNavigateSignIn()
    else if (onOpenSignIn) onOpenSignIn()
  }

  const handleSignUp = (e: React.MouseEvent) => {
    e.preventDefault()
    if (onNavigateSignUp) onNavigateSignUp()
    else if (onOpenSignIn) onOpenSignIn()
  }

  const handleHome = (e: React.MouseEvent) => {
    e.preventDefault()
    onNavigateHome?.()
  }

  const handleLibrary = (e: React.MouseEvent) => {
    e.preventDefault()
    onNavigateLibrary?.()
  }

  const handleSettings = (e: React.MouseEvent) => {
    e.preventDefault()
    onNavigateSettings?.()
  }

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-200 backdrop-blur-md transform-gpu ${
        isLight
          ? 'border-zinc-200 bg-white/95 text-zinc-900 shadow-xs'
          : 'border-zinc-900 bg-[#080808]/95 text-white'
      }`}
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-6 h-12 sm:h-14 flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Logo & Nav Links */}
        <div className="flex items-center gap-2 sm:gap-4 shrink min-w-0">
          <a
            href="/"
            onClick={handleHome}
            className="flex items-center gap-1.5 sm:gap-2 select-none cursor-pointer group no-underline shrink-0"
            title="Lisdt Home"
          >
            <img src={logoSrc} alt="Lisdt Logo" className="w-5 h-5 object-contain transition-transform duration-200 group-hover:scale-105" />
            <span
              className={`font-mono font-bold text-sm tracking-wide flicker ${
                isLight ? 'text-zinc-950' : 'text-white'
              }`}
            >
              LISDT
            </span>
          </a>

          <div className={`h-4 w-[1px] hidden xs:block ${isLight ? 'bg-zinc-200' : 'bg-zinc-900'}`} />

          {/* Quick Route Links */}
          <nav className="flex items-center gap-0.5 sm:gap-1 font-mono text-[11px] sm:text-xs">
            {!currentUser && (
              <a
                href="/"
                onClick={handleHome}
                className={`px-1.5 sm:px-2 py-1 transition-colors cursor-pointer ${
                  activeRoute === 'landing'
                    ? isLight ? 'text-zinc-950 font-semibold' : 'text-white font-semibold'
                    : isLight ? 'text-zinc-500 hover:text-zinc-800' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                HOME
              </a>
            )}
            {currentUser && (
              <>
                <a
                  id="nav-library-link"
                  href="/library"
                  onClick={handleLibrary}
                  className={`px-1.5 sm:px-2 py-1 transition-colors cursor-pointer ${
                    activeRoute === 'library' || activeRoute === 'edit'
                      ? isLight ? 'text-zinc-950 font-semibold' : 'text-white font-semibold'
                      : isLight ? 'text-zinc-500 hover:text-zinc-800' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  LIBRARY
                </a>
                <a
                  id="nav-settings-link"
                  href="/settings"
                  onClick={handleSettings}
                  className={`px-1.5 sm:px-2 py-1 transition-colors cursor-pointer ${
                    activeRoute === 'settings'
                      ? isLight ? 'text-zinc-950 font-semibold' : 'text-white font-semibold'
                      : isLight ? 'text-zinc-500 hover:text-zinc-800' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  SETTINGS
                </a>
              </>
            )}
          </nav>
        </div>

        {/* Right: Theme Toggle & Auth / User Status */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick Theme Toggle (Shown on Library & Settings pages) */}
          {(activeRoute === 'library' || activeRoute === 'settings') && (
            <button
              id="header-theme-toggle"
              type="button"
              onClick={toggleTheme}
              className={`font-mono text-[11px] p-1.5 sm:px-2.5 sm:py-1 transition-all flex items-center gap-1.5 cursor-pointer border select-none ${
                isLight
                  ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300 shadow-xs'
                  : 'bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white border-zinc-800'
              }`}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? (
                <>
                  <span className="text-amber-500 text-xs leading-none">☀</span>
                  <span className="font-semibold hidden sm:inline">LIGHT</span>
                </>
              ) : (
                <>
                  <span className="text-zinc-400 text-xs leading-none">☾</span>
                  <span className="hidden sm:inline">DARK</span>
                </>
              )}
            </button>
          )}

          {currentUser ? (
            <div className="flex items-center">
              <button
                id="nav-sign-out"
                onClick={onSignOut}
                className={`font-mono text-[11px] sm:text-xs px-1.5 sm:px-2 py-1 sm:py-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  isLight
                    ? 'text-zinc-500 hover:text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Sign out"
              >
                <span className="hidden sm:inline">[ SIGN_OUT ]</span>
                <span className="sm:hidden">[ EXIT ]</span>
              </button>
            </div>
          ) : (
            <>
              <a
                id="nav-sign-in"
                href="/signin"
                onClick={handleSignIn}
                className="font-mono text-[11px] sm:text-xs text-zinc-400 hover:text-white border border-zinc-900 hover:border-zinc-700 bg-zinc-950 px-2 sm:px-3 py-1 sm:py-1.5 transition-colors cursor-pointer text-center no-underline inline-block whitespace-nowrap"
              >
                SIGN_IN
              </a>
              <a
                id="nav-create"
                href="/signup"
                onClick={handleSignUp}
                className="font-mono text-[11px] sm:text-xs border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white px-2 sm:px-3 py-1 sm:py-1.5 transition-colors hidden sm:inline-block cursor-pointer text-center no-underline whitespace-nowrap"
              >
                CREATE_ACCOUNT
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
