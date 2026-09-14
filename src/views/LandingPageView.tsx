import lisdtLogo from '../assets/Lisdt.svg'
import Footer from '../components/layout/Footer'

interface LandingPageViewProps {
  onExploreLibrary: () => void
  onSignIn: () => void
  onSignUp: () => void
  onNavigateSettings?: () => void
  currentUser: string | null
  onSignOut: () => void
}

export default function LandingPageView({
  onExploreLibrary,
  onSignIn,
  onSignUp,
  onNavigateSettings,
  currentUser,
  onSignOut,
}: LandingPageViewProps) {
  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col justify-between selection:bg-white selection:text-black relative overflow-x-clip">
      {/* Background Ambient Cybernetic Lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-white/[0.015] rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-emerald-500/[0.01] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-zinc-500/[0.01] rounded-full blur-3xl" />
        <div className="absolute top-20 left-0 right-0 h-[1px] bg-zinc-900/40" />
        <div className="absolute top-2/3 left-0 right-0 h-[1px] bg-zinc-900/30" />
        <div className="absolute top-0 bottom-0 left-12 w-[1px] bg-zinc-900/20 hidden xl:block" />
        <div className="absolute top-0 bottom-0 right-12 w-[1px] bg-zinc-900/20 hidden xl:block" />
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-zinc-900 bg-[#080808]/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 select-none">
            <div className="flex items-center gap-2">
              <img src={lisdtLogo} alt="Lisdt Logo" className="w-5 h-5 object-contain" />
              <span className="font-mono font-bold text-white text-sm tracking-wide flicker">LISDT</span>
            </div>
            {currentUser && (
              <>
                <div className="h-4 w-[1px] bg-zinc-900 hidden xs:block" />
                <nav className="flex items-center gap-1 font-mono text-xs">
                  <span className="px-2 py-1 text-white font-semibold">HOME</span>
                  <button
                    id="nav-landing-library-link"
                    onClick={onExploreLibrary}
                    className="px-2 py-1 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  >
                    LIBRARY
                  </button>
                  <button
                    id="nav-landing-settings-link"
                    onClick={onNavigateSettings}
                    className="px-2 py-1 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  >
                    SETTINGS
                  </button>
                </nav>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  id="btn-landing-nav-library"
                  onClick={onExploreLibrary}
                  className="font-mono text-xs text-zinc-400 hover:text-white px-2.5 py-1 border border-zinc-900 hover:border-zinc-700 bg-zinc-950 transition-colors cursor-pointer"
                >
                  LIBRARY
                </button>
                <button
                  id="btn-landing-nav-settings"
                  onClick={onNavigateSettings}
                  className="font-mono text-xs text-zinc-400 hover:text-white px-2.5 py-1 border border-zinc-900 hover:border-zinc-700 bg-zinc-950 transition-colors cursor-pointer"
                >
                  SETTINGS
                </button>
                <button
                  onClick={onSignOut}
                  className="font-mono text-xs text-zinc-600 hover:text-zinc-300 px-2 py-1 transition-colors cursor-pointer"
                  title="Sign out"
                >
                  [ SIGN_OUT ]
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onSignIn}
                  className="font-mono text-xs text-zinc-400 hover:text-white border border-zinc-900 hover:border-zinc-700 bg-zinc-950 px-2.5 sm:px-3 py-1.5 transition-colors cursor-pointer"
                >
                  SIGN_IN
                </button>
                <button
                  onClick={onSignUp}
                  className="font-mono text-xs bg-white hover:bg-zinc-200 text-black font-bold px-3 py-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  SIGN_UP
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Landing Page Content */}
      <main className="relative z-10 flex-1">
        {/* Hero Section */}
        <section className="pt-16 sm:pt-24 pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-[1.15]">
            THE CURATED DIARY FOR EVERYTHING YOU WATCH.
          </h1>

          <p className="font-mono text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto mt-6 leading-relaxed">
            Series, cinema, drama, and everything in between. Log finished seasons, track scores, and curate your personal watchlist with computerized precision.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 font-mono text-xs sm:text-sm">
            <button
              onClick={onExploreLibrary}
              className="w-full sm:w-auto bg-white hover:bg-zinc-200 text-black font-bold px-6 py-3 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <span>ENTER_LIBRARY</span>
              <span className="text-sm">-&gt;</span>
            </button>
            {!currentUser && (
              <button
                onClick={onSignUp}
                className="w-full sm:w-auto border border-zinc-800 hover:border-zinc-600 bg-zinc-950 hover:bg-zinc-900 text-white font-medium px-6 py-3 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>CREATE_ACCOUNT</span>
              </button>
            )}
          </div>

          <p className="font-mono text-[10px] text-zinc-600 mt-4">
            Zero ads &middot; Zero feed algorithms &middot; 100% minimalist tracking
          </p>
        </section>

        {/* Live Terminal Preview Frame */}
        <section className="px-4 sm:px-6 max-w-5xl mx-auto pb-20">
          <div className="border border-zinc-800 bg-[#0c0c0c] shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-900 bg-zinc-950 font-mono text-[10px]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500/80" />
                  <span className="w-2 h-2 rounded-full bg-yellow-500/80" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-zinc-600 ml-2">LISDT LIVE INTERFACE</span>
              </div>
              <span className="text-zinc-600 font-mono">SYNCED</span>
            </div>

            <div className="p-6 sm:p-8 bg-[#090909]">
              <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                <div className="space-y-3 font-mono text-xs text-zinc-400 max-w-md">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <span className="text-emerald-400">&gt;</span>
                    <span className="font-bold text-white">ACTIVE VAULT:</span>
                    <span className="text-zinc-500">[CINEMA_&amp;_SERIES]</span>
                  </div>
                  <p className="text-zinc-500 text-[11px] leading-relaxed">
                    Catalog movies, series, animation, and custom watchlists with integer ratings (1–10), season counts, and status logs inside an authentic computerized environment.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-2 text-[10px]">
                    <div className="border border-zinc-900 bg-zinc-950 p-2.5">
                      <div className="text-zinc-600">TOTAL LOGGED</div>
                      <div className="text-white text-base font-bold mt-0.5">248 ENTRIES</div>
                    </div>
                    <div className="border border-zinc-900 bg-zinc-950 p-2.5">
                      <div className="text-zinc-600">AVG RATING</div>
                      <div className="text-white text-base font-bold mt-0.5">9 / 10</div>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto flex justify-center">
                  <div className="w-56 border border-zinc-800 bg-[#0c0c0c] p-3 shadow-xl relative group">
                    <div className="relative aspect-[2/3] bg-zinc-900 overflow-hidden mb-2.5">
                      <img
                        src="https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"
                        alt="Interstellar"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute top-1.5 right-1.5 font-mono bg-[#080808]/90 border border-zinc-700 px-1.5 py-0.5 text-[9px] text-white">
                        9
                      </div>
                      <div className="absolute bottom-1.5 left-1.5 font-mono bg-emerald-950/80 border border-emerald-700/80 px-1.5 py-0.5 text-[8px] text-emerald-300">
                        WATCHED
                      </div>
                    </div>
                    <div className="font-mono text-xs font-bold text-white truncate">
                      Interstellar
                    </div>
                    <div className="font-mono text-[10px] text-zinc-500 mt-0.5 flex items-center justify-between">
                      <span>2014</span>
                      <span>Film · Sci-Fi</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Pillars */}
        <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="font-mono text-[10px] text-zinc-500 tracking-widest uppercase">
              ARCHITECTURE
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
              Built for Serious Watch Curators
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-zinc-800 bg-[#0c0c0c] p-6 relative">
              <div className="font-mono text-[10px] text-zinc-500 mb-2">01 · DOMAIN_ROUTING</div>
              <h3 className="text-lg font-bold text-white tracking-tight">Dedicated Category Vaults</h3>
              <p className="font-mono text-xs text-zinc-400 mt-2 leading-relaxed">
                Separate TV series, movies, and custom channels into independent library vaults with unique metric configurations.
              </p>
            </div>
            <div className="border border-zinc-800 bg-[#0c0c0c] p-6 relative">
              <div className="font-mono text-[10px] text-zinc-500 mb-2">02 · GRANULAR_METRICS</div>
              <h3 className="text-lg font-bold text-white tracking-tight">Comprehensive Tracking</h3>
              <p className="font-mono text-xs text-zinc-400 mt-2 leading-relaxed">
                Record exact completed season counts, accompanying movies, multi-part sagas, and precise ratings from 1 to 10.
              </p>
            </div>
            <div className="border border-zinc-800 bg-[#0c0c0c] p-6 relative">
              <div className="font-mono text-[10px] text-zinc-500 mb-2">03 · COMPUTERIZED_UI</div>
              <h3 className="text-lg font-bold text-white tracking-tight">Zero-Bloat Terminal Speed</h3>
              <p className="font-mono text-xs text-zinc-400 mt-2 leading-relaxed">
                Instant search, fast keyboard interaction, custom computerized scrollbars, and an interface that responds in under 50ms.
              </p>
            </div>
            <div className="border border-zinc-800 bg-[#0c0c0c] p-6 relative">
              <div className="font-mono text-[10px] text-zinc-500 mb-2">04 · SECURE_PROFILES</div>
              <h3 className="text-lg font-bold text-white tracking-tight">Personalized Diary Access</h3>
              <p className="font-mono text-xs text-zinc-400 mt-2 leading-relaxed">
                Secure authentication gate with instant profile login, private diary storage, and continuous local sync.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA Terminal Gate */}
        <section className="pb-24 px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="border border-zinc-800 bg-zinc-950 p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white pointer-events-none" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white pointer-events-none" />

            <span className="font-mono text-[10px] text-zinc-500">READY TO LOG?</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-2">
              START YOUR WATCH DIARY TODAY.
            </h2>
            <p className="font-mono text-xs text-zinc-400 max-w-md mx-auto mt-3">
              Open the library immediately or register your account to personalize your curator profile.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 font-mono text-xs">
              <button
                onClick={onExploreLibrary}
                className="w-full sm:w-auto bg-white hover:bg-zinc-200 text-black font-bold px-6 py-2.5 transition-colors cursor-pointer"
              >
                ACCESS_LIBRARY -&gt;
              </button>
              {!currentUser && (
                <button
                  onClick={onSignUp}
                  className="w-full sm:w-auto border border-zinc-800 hover:border-zinc-600 bg-zinc-900 text-white font-medium px-6 py-2.5 transition-colors cursor-pointer"
                >
                  CREATE_ACCOUNT
                </button>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}