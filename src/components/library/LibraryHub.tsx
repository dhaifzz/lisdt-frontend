import { Anime, MediaCategory, LibraryCategory } from '../../types'

interface LibraryHubProps {
  activeCategory: MediaCategory
  onSelectCategory: (cat: MediaCategory) => void
  items: Anime[]
  categories: LibraryCategory[]
  onOpenAddLibrary: () => void
  onEditLibrary?: (cat: LibraryCategory) => void
  isLoading?: boolean
  isLight?: boolean
}

export function LibraryCardSkeleton({ index = 0, isLight = false }: { index?: number; isLight?: boolean }) {
  return (
    <div
      className={`text-left p-3.5 border relative overflow-hidden shrink-0 w-[78%] sm:w-auto snap-start select-none animate-pulse ${
        isLight ? 'border-zinc-200 bg-zinc-100/70' : 'border-zinc-900 bg-zinc-950/40'
      }`}
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`h-2.5 w-8 rounded ${isLight ? 'bg-zinc-200' : 'bg-zinc-900'}`} />
        <div className="flex items-center gap-1.5">
          <span className={`font-mono text-[7px] px-1 py-0.5 uppercase border text-transparent ${
            isLight ? 'border-zinc-200 bg-zinc-200' : 'border-zinc-900 bg-zinc-900/60'
          }`}>
            TYPE
          </span>
          <span className={`font-mono text-[8px] px-1.5 py-0.5 border text-transparent ${
            isLight ? 'border-zinc-200 bg-zinc-200' : 'border-zinc-900 bg-zinc-900/80'
          }`}>
            TAG
          </span>
        </div>
      </div>

      <div className="mt-2.5 space-y-1.5">
        <div className={`h-4 rounded w-2/3 ${isLight ? 'bg-zinc-200' : 'bg-zinc-855'}`} />
        <div className={`h-2.5 rounded w-4/5 ${isLight ? 'bg-zinc-200' : 'bg-zinc-900'}`} />
      </div>

      <div className={`mt-3 pt-2.5 border-t flex items-center justify-between font-mono text-[9px] ${
        isLight ? 'border-zinc-200' : 'border-zinc-900/80'
      }`}>
        <div className={`h-2.5 w-20 rounded ${isLight ? 'bg-zinc-200' : 'bg-zinc-900'}`} />
        <div className={`h-2.5 w-3 rounded ${isLight ? 'bg-zinc-200' : 'bg-zinc-900'}`} />
      </div>

      {/* Cybernetic shimmer sweep */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none" />
    </div>
  )
}

export function LibraryHub({
  activeCategory,
  onSelectCategory,
  items,
  categories,
  onOpenAddLibrary,
  onEditLibrary,
  isLoading = false,
  isLight = false,
}: LibraryHubProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <p className={`font-mono text-[9px] tracking-widest uppercase ${isLight ? 'text-zinc-500' : 'text-zinc-600'}`}>
            LIBRARY DIRECTORY [SELECT COLLECTION]
          </p>
          <button
            id="btn-add-library-hub"
            onClick={onOpenAddLibrary}
            className={`font-mono text-[10px] font-bold px-2.5 py-0.5 sm:py-1 transition-all flex items-center gap-1 shadow-sm cursor-pointer ${
              isLight
                ? 'bg-zinc-900 hover:bg-black text-white'
                : 'bg-white hover:bg-zinc-200 text-black'
            }`}
          >
            <span>+</span>
            <span>ADD_LIBRARY</span>
          </button>
        </div>
        <span className={`font-mono text-[9px] ${isLight ? 'text-zinc-500' : 'text-zinc-700'}`}>
          <span className="sm:hidden">SWIPE &gt;&gt;</span>
          <span className="hidden sm:inline">
            {isLoading ? 'SYNCING ARCHIVES...' : `CHANNELS: ${String(categories.length).padStart(2, '0')} ACTIVE`}
          </span>
        </span>
      </div>

      {/* Cards: horizontal scroll on phone, grid on tablet+ */}
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex sm:grid sm:grid-cols-3 gap-3 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 scrollbar-none snap-x snap-mandatory">
        {isLoading ? (
          <>
            <LibraryCardSkeleton index={0} isLight={isLight} />
            <LibraryCardSkeleton index={1} isLight={isLight} />
            <LibraryCardSkeleton index={2} isLight={isLight} />
          </>
        ) : categories.length === 0 ? (
          <div className={`col-span-3 border border-dashed p-6 text-center ${
            isLight ? 'border-zinc-300 bg-white/60' : 'border-zinc-900 bg-zinc-950/30'
          }`}>
            <p className={`font-mono text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-600'}`}>NO ACTIVE LIBRARIES</p>
            <p className={`font-mono text-[10px] mt-1 ${isLight ? 'text-zinc-400' : 'text-zinc-700'}`}>
              Create your first collection vault to start organizing your watch diary.
            </p>
            <button
              onClick={onOpenAddLibrary}
              className={`mt-3 font-mono text-xs font-bold px-3 py-1 cursor-pointer ${
                isLight ? 'bg-zinc-900 text-white hover:bg-black' : 'bg-white text-black hover:bg-zinc-200'
              }`}
            >
              + CREATE_LIBRARY
            </button>
          </div>
        ) : (
          categories.map((cat) => {
            const isActive = activeCategory === cat.id
            const catItems = items.filter(a => a.category === cat.id)
            const watchingCount = catItems.filter(a => a.status === 'watching').length
            const watchedCount  = catItems.filter(a => a.status === 'watched').length

            return (
              <button
                key={cat.id}
                id={`hub-card-${cat.id}`}
                onClick={() => onSelectCategory(cat.id)}
                className={`text-left p-3.5 border transition-all duration-150 cursor-pointer relative group overflow-hidden shrink-0 w-[78%] sm:w-auto snap-start ${
                  isActive
                    ? isLight
                      ? 'bg-white border-zinc-950 shadow-md'
                      : 'bg-zinc-950 border-white shadow-[0_0_20px_rgba(255,255,255,0.06)]'
                    : isLight
                    ? 'bg-white/80 border-zinc-200 hover:border-zinc-400 hover:bg-white text-zinc-800'
                    : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-700 hover:bg-zinc-900/30'
                }`}
              >
                {/* Corner accent bracket for active card */}
                {isActive && (
                  <>
                    <div className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 ${isLight ? 'border-zinc-950' : 'border-white'}`} />
                    <div className={`absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 ${isLight ? 'border-zinc-950' : 'border-white'}`} />
                  </>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center">
                    {onEditLibrary && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditLibrary(cat)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation()
                            onEditLibrary(cat)
                          }
                        }}
                        className={`font-mono text-[8px] sm:text-[9px] px-1.5 py-0.5 border transition-all cursor-pointer opacity-75 hover:opacity-100 ${
                          isLight
                            ? 'border-zinc-300 text-zinc-600 hover:text-black hover:border-zinc-500 bg-white/80 shadow-2xs'
                            : 'border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 bg-black/60'
                        }`}
                        title={`Edit or delete "${cat.label}"`}
                      >
                        [ ✏ EDIT ]
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-mono text-[7px] tracking-widest px-1 py-0.5 uppercase border ${
                        isActive
                          ? isLight ? 'border-zinc-300 text-zinc-700' : 'border-zinc-400 text-zinc-300'
                          : isLight ? 'border-zinc-200 text-zinc-500' : 'border-zinc-800/80 text-zinc-500'
                      }`}
                    >
                      {cat.type === 'movies' ? 'MOVIES' : 'SERIES'}
                    </span>
                    <span
                      className={`font-mono text-[8px] tracking-wider px-1.5 py-0.5 border ${
                        isActive
                          ? isLight ? 'border-zinc-950 bg-zinc-950 text-white font-bold' : 'border-white bg-white text-black font-bold'
                          : isLight ? 'border-zinc-200 text-zinc-600 group-hover:text-zinc-900 group-hover:border-zinc-400' : 'border-zinc-800 text-zinc-600 group-hover:text-zinc-400 group-hover:border-zinc-700'
                      }`}
                    >
                      {cat.tag}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5">
                  <h2 className={`font-mono text-xs sm:text-sm font-bold tracking-wide transition-colors ${
                    isActive
                      ? isLight ? 'text-zinc-950' : 'text-white'
                      : isLight ? 'text-zinc-700 group-hover:text-zinc-950' : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}>
                    {cat.label}
                  </h2>
                  <p className={`font-mono text-[10px] mt-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-600'}`}>
                    {catItems.length} TITLES · {watchedCount} WATCHED
                    {watchingCount > 0 && ` · ${watchingCount} IN PROGRESS`}
                  </p>
                </div>

                <div className={`mt-3 pt-2.5 border-t flex items-center justify-between font-mono text-[9px] ${
                  isLight ? 'border-zinc-100' : 'border-zinc-900/80'
                }`}>
                  <span className={isActive ? (isLight ? 'text-emerald-600 font-medium' : 'text-emerald-400') : (isLight ? 'text-zinc-500' : 'text-zinc-600')}>
                    {isActive ? '● VIEWING_LIST' : '○ JUMP_TO_LIST'}
                  </span>
                  <span className={`transition-colors ${isLight ? 'text-zinc-400 group-hover:text-zinc-900' : 'text-zinc-500 group-hover:text-white'}`}>
                    &gt;&gt;
                  </span>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
