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
      className={`text-left p-2.5 sm:p-3 border relative overflow-hidden shrink-0 w-[190px] sm:w-auto snap-start select-none animate-pulse ${
        isLight ? 'border-zinc-200 bg-zinc-100/70' : 'border-zinc-900 bg-zinc-950/40'
      }`}
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className={`h-2.5 w-16 rounded ${isLight ? 'bg-zinc-200' : 'bg-zinc-900'}`} />
        <div className={`h-2.5 w-6 rounded ${isLight ? 'bg-zinc-200' : 'bg-zinc-900'}`} />
      </div>

      <div className="mt-2 space-y-1">
        <div className={`h-3.5 rounded w-3/4 ${isLight ? 'bg-zinc-200' : 'bg-zinc-855'}`} />
        <div className={`h-2.5 rounded w-1/2 ${isLight ? 'bg-zinc-200' : 'bg-zinc-900'}`} />
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
    <div className="mb-6">
      {/* Header directory bar: clean flex without overflow */}
      <div className="flex items-center justify-between mb-2.5 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <p className={`font-mono text-[9px] sm:text-[10px] tracking-widest uppercase truncate ${isLight ? 'text-zinc-600' : 'text-zinc-400'} font-semibold`}>
            <span className="hidden sm:inline">LIBRARY DIRECTORY [SELECT COLLECTION]</span>
            <span className="sm:hidden">LIBRARIES</span>
          </p>
          <span className={`font-mono text-[9px] px-1.5 py-0.2 border ${
            isLight ? 'border-zinc-300 text-zinc-500 bg-white' : 'border-zinc-800 text-zinc-500 bg-black/50'
          }`}>
            {isLoading ? '...' : String(categories.length).padStart(2, '0')}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`font-mono text-[8px] sm:hidden ${isLight ? 'text-zinc-400' : 'text-zinc-600'}`}>
            SWIPE &gt;&gt;
          </span>
          <button
            id="btn-add-library-hub"
            onClick={onOpenAddLibrary}
            className={`font-mono text-[10px] font-bold px-2 sm:px-2.5 py-1 transition-all flex items-center gap-1 shadow-xs cursor-pointer ${
              isLight
                ? 'bg-zinc-900 hover:bg-black text-white'
                : 'bg-white hover:bg-zinc-200 text-black'
            }`}
          >
            <span>+</span>
            <span>ADD_LIBRARY</span>
          </button>
        </div>
      </div>

      {/* Cards: compact horizontal scroll on phone, grid on tablet+ */}
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex sm:grid sm:grid-cols-3 gap-2.5 sm:gap-3 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 scrollbar-none snap-x snap-mandatory">
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
                className={`text-left p-2.5 sm:p-3 border transition-all duration-150 cursor-pointer relative group overflow-hidden shrink-0 w-[190px] sm:w-auto snap-start flex flex-col justify-between ${
                  isActive
                    ? isLight
                      ? 'bg-white border-zinc-900 shadow-sm border-l-4 border-l-zinc-900'
                      : 'bg-zinc-950 border-zinc-600 shadow-[0_0_15px_rgba(255,255,255,0.06)] border-l-4 border-l-white'
                    : isLight
                    ? 'bg-white/70 border-zinc-200 hover:border-zinc-400 hover:bg-white text-zinc-800'
                    : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-700 hover:bg-zinc-900/40'
                }`}
              >
                {/* Header row: Tag/Type + Active Indicator + Edit Trigger */}
                <div className="flex items-center justify-between gap-1.5 w-full">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`font-mono text-[7px] sm:text-[8px] uppercase tracking-wider px-1 py-0.2 border truncate ${
                      isActive
                        ? isLight ? 'border-zinc-300 text-zinc-700 bg-zinc-100' : 'border-zinc-800 text-zinc-300 bg-zinc-900'
                        : isLight ? 'border-zinc-200 text-zinc-400' : 'border-zinc-900 text-zinc-600'
                    }`}>
                      {cat.type === 'movies' ? 'MOVIES' : 'SERIES'}
                    </span>
                    <span className={`font-mono text-[8px] tracking-tight truncate ${
                      isActive
                        ? isLight ? 'text-zinc-900 font-bold' : 'text-zinc-200 font-bold'
                        : isLight ? 'text-zinc-500' : 'text-zinc-500'
                    }`}>
                      #{cat.tag}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[8px] font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        ACTIVE
                      </span>
                    ) : (
                      <span className={`font-mono text-[8px] transition-colors ${
                        isLight ? 'text-zinc-400 group-hover:text-zinc-800' : 'text-zinc-600 group-hover:text-zinc-300'
                      }`}>
                        &gt;&gt;
                      </span>
                    )}

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
                        className={`font-mono text-[8px] px-1 py-0.5 border transition-all cursor-pointer opacity-70 hover:opacity-100 ${
                          isLight
                            ? 'border-zinc-300 text-zinc-600 hover:text-black hover:border-zinc-500 bg-white'
                            : 'border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 bg-black/60'
                        }`}
                        title={`Edit "${cat.label}"`}
                      >
                        [✎]
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Title & Counts */}
                <div className="mt-1.5 min-w-0">
                  <h2 className={`font-mono text-xs sm:text-sm font-bold tracking-tight truncate transition-colors ${
                    isActive
                      ? isLight ? 'text-zinc-950' : 'text-white'
                      : isLight ? 'text-zinc-700 group-hover:text-zinc-950' : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}>
                    {cat.label}
                  </h2>
                  <p className={`font-mono text-[9px] sm:text-[10px] mt-0.5 truncate ${
                    isLight ? 'text-zinc-500' : 'text-zinc-500'
                  }`}>
                    {catItems.length} {catItems.length === 1 ? 'TITLE' : 'TITLES'} · {watchedCount} WATCHED
                    {watchingCount > 0 && ` · ${watchingCount} WATCHING`}
                  </p>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
