import { useState, useEffect, useRef } from 'react'
import { Anime, LibraryCategory } from '../../types'
import { STATUS_MAP } from '../../types'
import { isValidCoverUrl } from '../../lib/api'

export function MediaCard({
  anime,
  index,
  onSelect,
  categories,
  isLight = false,
}: {
  anime: Anime
  index: number
  onSelect: (anime: Anime) => void
  categories?: LibraryCategory[]
  isLight?: boolean
}) {
  const [err, setErr] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const posterContainerRef = useRef<HTMLDivElement>(null)

  const status = STATUS_MAP[anime.status]
  const catConfig = categories?.find(c => c.id === anime.category)
  const isMovie = catConfig ? catConfig.type === 'movies' : (anime.category === 'movies' || Boolean(anime.parts))
  const hasCover = Boolean(isValidCoverUrl(anime.cover) && !err)

  // Lazy-load: Only mount and fetch image when approaching viewport (250px buffer)
  useEffect(() => {
    if (!hasCover) return

    if (!('IntersectionObserver' in window)) {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '250px 0px',
        threshold: 0.01,
      }
    )

    if (posterContainerRef.current) {
      observer.observe(posterContainerRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [hasCover, anime.cover])

  return (
    <div
      onClick={() => onSelect(anime)}
      className="group flex flex-col fade-in cursor-pointer select-none"
      style={{
        animationDelay: `${(index % 50) * 12}ms`,
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 235px',
      }}
    >
      {/* Poster */}
      <div
        ref={posterContainerRef}
        className={`relative aspect-[2/3] overflow-hidden border transition-colors duration-300 ${
          isLight
            ? 'bg-zinc-100 border-zinc-200 group-hover:border-zinc-400 shadow-xs'
            : 'bg-zinc-900 border-zinc-900 group-hover:border-zinc-500'
        }`}
      >
        {hasCover ? (
          <>
            {/* Shimmer placeholder while off-screen or downloading */}
            {!isLoaded && (
              <div
                className={`absolute inset-0 flex items-center justify-center pointer-events-none ${
                  isLight ? 'bg-zinc-100' : 'bg-zinc-950'
                }`}
              >
                <div
                  className={`w-9 h-9 border flex items-center justify-center opacity-30 animate-pulse ${
                    isLight ? 'border-zinc-300 bg-zinc-200' : 'border-zinc-800 bg-zinc-900'
                  }`}
                >
                  <div className={`w-2.5 h-2.5 ${isLight ? 'bg-zinc-400' : 'bg-zinc-700'}`} />
                </div>
              </div>
            )}

            {/* Poster image: only fetches network resource when within viewport proximity */}
            {isInView && (
              <img
                src={anime.cover}
                alt={anime.title}
                loading="lazy"
                decoding="async"
                onLoad={() => setIsLoaded(true)}
                onError={() => setErr(true)}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  isLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}
          </>
        ) : (
          <div className={`w-full h-full flex items-center justify-center p-3.5 sm:p-4 select-none relative overflow-hidden transition-colors ${
            isLight
              ? 'bg-gradient-to-b from-zinc-100 via-zinc-50 to-zinc-200 text-zinc-900'
              : 'bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-white'
          }`}>
            {/* Prominent Center Title Typography Poster */}
            <div className="text-center flex flex-col items-center justify-center px-2">
              <span className={`font-bold font-sans text-xs sm:text-sm md:text-base leading-tight uppercase tracking-tight break-words ${
                isLight ? 'text-zinc-900' : 'text-zinc-100'
              }`}>
                {anime.title || 'UNTITLED'}
              </span>
            </div>
          </div>
        )}

        {/* Top Favorite Rank Badge (1-10) */}
        {anime.topRank && anime.topRank >= 1 && anime.topRank <= 10 && (
          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10 pointer-events-none select-none">
            <div
              className={`flex items-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 py-0.5 font-mono text-[8px] sm:text-[10px] font-bold tracking-wider border shadow-md transition-transform duration-200 group-hover:scale-105 ${
                anime.topRank === 1
                  ? 'bg-amber-500 text-black border-amber-300 shadow-amber-500/20 font-black'
                  : anime.topRank === 2
                  ? 'bg-zinc-200 text-zinc-950 border-white shadow-zinc-500/20 font-extrabold'
                  : anime.topRank === 3
                  ? 'bg-amber-800/95 text-amber-100 border-amber-600/80 shadow-amber-700/20 font-extrabold'
                  : isLight
                  ? 'bg-zinc-900/95 text-zinc-100 border-zinc-700 shadow-black/10'
                  : 'bg-black/95 text-zinc-200 border-zinc-700/90 shadow-black/40'
              }`}
            >
              <span className={`text-[7px] sm:text-[8px] font-mono leading-none ${anime.topRank <= 3 ? 'opacity-80' : 'text-zinc-400'}`}>TOP</span>
              <span className="leading-none">{anime.topRank}</span>
            </div>
          </div>
        )}

        {/* Hover overlay with [ EDIT edit icon ] at bottom center */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-2.5 px-2 pointer-events-none">
          <div className={`flex items-center gap-1 font-mono text-[10px] backdrop-blur-xs border px-2 py-0.5 transition-transform duration-200 transform translate-y-1 group-hover:translate-y-0 select-none ${
            isLight
              ? 'bg-white/95 border-zinc-300 text-zinc-900 shadow-md'
              : 'bg-[#080808]/95 border-zinc-700/80 text-zinc-200 shadow-[0_2px_12px_rgba(0,0,0,0.9)]'
          }`}>
            <span className={isLight ? 'text-zinc-400 font-bold leading-none' : 'text-zinc-500 font-bold leading-none'}>[</span>
            <span className={`text-[10px] font-mono font-medium tracking-wider leading-none ${
              isLight ? 'text-zinc-900 font-bold' : 'text-zinc-200'
            }`}>
              EDIT
            </span>
            <svg
              className={`w-2.5 h-2.5 fill-none stroke-current ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}
              viewBox="0 0 24 24"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
            <span className={isLight ? 'text-zinc-400 font-bold leading-none' : 'text-zinc-500 font-bold leading-none'}>]</span>
          </div>
        </div>
      </div>

      {/* Info below poster */}
      <div className="pt-1.5 min-[400px]:pt-2 space-y-0.5">
        <p className={`text-[11px] min-[400px]:text-xs sm:text-[13px] font-medium leading-snug break-words transition-colors ${
          isLight
            ? 'text-zinc-900 group-hover:text-black font-semibold'
            : 'text-white group-hover:text-zinc-200'
        }`}>
          {anime.title}
        </p>
        <div className={`flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-mono text-[9.5px] sm:text-[10px] leading-tight ${
          isLight ? 'text-zinc-500' : 'text-zinc-400'
        }`}>
          <span>{anime.year}</span>
          <span className={`select-none ${isLight ? 'text-zinc-300' : 'text-zinc-800'}`}>·</span>
          <span className={isLight ? status.textLight : status.text}>{status.label}</span>
          {isMovie ? (
            <>
              <span className={`select-none ${isLight ? 'text-zinc-300' : 'text-zinc-800'}`}>·</span>
              <span className={`whitespace-nowrap shrink-0 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                {(anime.parts ?? 1) > 1 ? `${anime.parts} Parts` : 'Film'}
              </span>
            </>
          ) : (
            <>
              {anime.seasonsFinished > 0 && (
                <>
                  <span className={`select-none ${isLight ? 'text-zinc-300' : 'text-zinc-800'}`}>·</span>
                  <span className={`whitespace-nowrap shrink-0 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    S{anime.seasonsFinished}
                  </span>
                </>
              )}
              {(anime.moviesCount ?? 0) > 0 && (
                <>
                  <span className={`select-none ${isLight ? 'text-zinc-300' : 'text-zinc-800'}`}>·</span>
                  <span className="text-amber-500 font-bold whitespace-nowrap shrink-0">
                    +{anime.moviesCount} {anime.moviesCount === 1 ? 'Movie' : 'Movies'}
                  </span>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function MediaCardSkeleton({ index = 0, isLight = false }: { index?: number; isLight?: boolean }) {
  return (
    <div
      className="flex flex-col select-none animate-pulse"
      style={{ animationDelay: `${(index % 24) * 40}ms` }}
    >
      {/* Poster Skeleton */}
      <div className={`relative aspect-[2/3] overflow-hidden border flex flex-col items-center justify-center ${
        isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-950 border-zinc-900'
      }`}>
        <div className={`w-10 h-10 border flex items-center justify-center ${
          isLight ? 'border-zinc-300 bg-zinc-200/50' : 'border-zinc-900/90 bg-zinc-900/30'
        }`}>
          <div className={`w-3 h-3 ${isLight ? 'bg-zinc-300' : 'bg-zinc-800/50'}`} />
        </div>
        {/* Subtle cybernetic shimmer sweep */}
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.03] to-transparent pointer-events-none" />
      </div>

      {/* Info below poster skeleton */}
      <div className="pt-2 space-y-1.5">
        <div className={`h-3 rounded w-4/5 ${isLight ? 'bg-zinc-200' : 'bg-zinc-900'}`} />
        <div className={`h-2.5 rounded w-1/2 ${isLight ? 'bg-zinc-200/70' : 'bg-zinc-900/70'}`} />
      </div>
    </div>
  )
}
