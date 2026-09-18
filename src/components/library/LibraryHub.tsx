import { useMemo } from 'react'
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
      className={`text-left p-2.5 sm:p-3.5 border relative overflow-hidden shrink-0 w-[150px] min-[400px]:w-[160px] sm:w-auto aspect-square sm:aspect-auto snap-start select-none animate-pulse flex flex-col justify-between ${
        isLight ? 'border-zinc-200 bg-zinc-100/70' : 'border-zinc-900 bg-zinc-950/40'
      }`}
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div className="flex items-center justify-between gap-1.5 w-full">
        <div className={`h-2.5 w-16 rounded ${isLight ? 'bg-zinc-200' : 'bg-zinc-900'}`} />
        <div className={`h-2.5 w-8 rounded ${isLight ? 'bg-zinc-200' : 'bg-zinc-900'}`} />
      </div>

      <div className="my-auto py-1 space-y-2 w-full">
        <div className={`h-3.5 rounded w-3/4 ${isLight ? 'bg-zinc-200' : 'bg-zinc-855'}`} />
        <div className="flex items-center justify-between gap-2">
          <div className={`h-2.5 rounded w-12 ${isLight ? 'bg-zinc-200' : 'bg-zinc-900'}`} />
          <div className={`h-6 w-16 rounded ${isLight ? 'bg-zinc-200' : 'bg-zinc-900'}`} />
        </div>
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
  // Order library cards based on the amount of titles: from most to least
  const { sortedCategories, itemCounts } = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of items) {
      if (item.category) {
        counts.set(item.category, (counts.get(item.category) || 0) + 1)
      }
    }

    const sorted = [...categories].sort((a, b) => {
      const countA = counts.get(a.id) || 0
      const countB = counts.get(b.id) || 0
      if (countB !== countA) {
        return countB - countA // Descending: most titles first, then least
      }
      return a.label.localeCompare(b.label)
    })

    return { sortedCategories: sorted, itemCounts: counts }
  }, [categories, items])

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

      {/* Library Cards Bar: horizontally scrollable on phone with snap, responsive grid on desktop */}
      <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5 overflow-x-auto sm:overflow-x-visible pb-2 pt-0.5 scrollbar-none snap-x snap-mandatory touch-pan-x">
        {isLoading ? (
          <>
            <LibraryCardSkeleton index={0} isLight={isLight} />
            <LibraryCardSkeleton index={1} isLight={isLight} />
            <LibraryCardSkeleton index={2} isLight={isLight} />
          </>
        ) : sortedCategories.length === 0 ? (
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
          sortedCategories.map((cat) => {
            const isActive = activeCategory === cat.id
            const count = itemCounts.get(cat.id) || 0

            return (
              <button
                key={cat.id}
                id={`hub-card-${cat.id}`}
                onClick={() => onSelectCategory(cat.id)}
                className={`text-left p-2.5 sm:p-3.5 border transition-all duration-150 cursor-pointer relative group overflow-hidden shrink-0 w-[150px] min-[400px]:w-[160px] sm:w-auto aspect-square sm:aspect-auto snap-start flex flex-col justify-between ${
                  isActive
                    ? isLight
                      ? 'bg-white border-zinc-900 shadow-sm border-l-4 border-l-zinc-900'
                      : 'bg-zinc-950 border-zinc-500 shadow-[0_0_15px_rgba(255,255,255,0.06)] border-l-4 border-l-white'
                    : isLight
                    ? 'bg-white/70 border-zinc-200 hover:border-zinc-400 hover:bg-white text-zinc-800'
                    : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-700 hover:bg-zinc-900/40'
                }`}
              >
                {/* Header row: Tag/Type + Active Indicator */}
                <div className="flex items-center justify-between gap-1 w-full">
                  <div className="flex items-center gap-1 min-w-0 flex-wrap">
                    <span className={`font-mono text-[7.5px] sm:text-[8px] uppercase tracking-wider px-1 py-0.2 border shrink-0 ${
                      isActive
                        ? isLight ? 'border-zinc-300 text-zinc-700 bg-zinc-100' : 'border-zinc-800 text-zinc-300 bg-zinc-900'
                        : isLight ? 'border-zinc-200 text-zinc-400' : 'border-zinc-900 text-zinc-600'
                    }`}>
                      {cat.type === 'movies' ? 'MOVIES' : 'SERIES'}
                    </span>
                    <span className={`font-mono text-[8px] tracking-tight shrink-0 ${
                      isActive
                        ? isLight ? 'text-zinc-900 font-bold' : 'text-zinc-200 font-bold'
                        : isLight ? 'text-zinc-500' : 'text-zinc-500'
                    }`}>
                      #{cat.tag}
                    </span>
                  </div>

                  <div className="flex items-center shrink-0">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[8px] sm:text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        ACTIVE
                      </span>
                    ) : (
                      <span className={`font-mono text-[8px] sm:text-[9px] transition-colors ${
                        isLight ? 'text-zinc-400 group-hover:text-zinc-800' : 'text-zinc-600 group-hover:text-zinc-300'
                      }`}>
                        &gt;&gt;
                      </span>
                    )}
                  </div>
                </div>

                {/* Center / Content: Title (full text, no truncate) and Count with enlarged EDIT button */}
                <div className="my-auto py-1 min-w-0 w-full">
                  <h2 className={`font-mono text-xs sm:text-sm font-bold tracking-tight break-words leading-tight transition-colors ${
                    isActive
                      ? isLight ? 'text-zinc-950' : 'text-white'
                      : isLight ? 'text-zinc-700 group-hover:text-zinc-950' : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}>
                    {cat.label}
                  </h2>
                  <div className="flex items-center justify-between gap-1.5 mt-2 w-full">
                    <p className={`font-mono text-[9px] sm:text-[10px] whitespace-nowrap ${
                      isLight ? 'text-zinc-500' : 'text-zinc-500'
                    }`}>
                      {count} {count === 1 ? 'TITLE' : 'TITLES'}
                    </p>

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
                        className={`font-mono text-xs sm:text-xs font-bold px-3 py-1.5 sm:px-2.5 sm:py-1 border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs ${
                          isLight
                            ? 'border-zinc-300 text-zinc-800 hover:text-black hover:border-zinc-700 bg-white hover:bg-zinc-100'
                            : 'border-zinc-700 text-zinc-200 hover:text-white hover:border-zinc-400 bg-black/80 hover:bg-zinc-900'
                        }`}
                        title={`Edit "${cat.label}"`}
                      >
                        <span className="text-xs sm:text-[10px]">✏</span>
                        <span>EDIT</span>
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
