export type MediaCategory = string
export type LibraryType = 'series' | 'movies'

export interface LibraryCategory {
  id: string
  label: string
  tag: string
  headline: string
  subhead: string
  description: string
  type: LibraryType
  unitLabel?: string
}

export interface Anime {
  id: number
  category: MediaCategory
  title: string
  year: number
  rating: number | null
  status: 'watching' | 'watched' | 'stalled' | 'dropped'
  studio?: string
  cover: string
  seasonsFinished: number
  parts?: number        // for movies (number of parts, e.g. 1, 2)
  moviesCount?: number  // for series (count of companion movies in the series)
  topRank?: number | null // personal top favorites rank 1-10
}

// Alias for semantic clarity across media types
export type MediaItem = Anime

export type FilterStatus = 'all' | 'watching' | 'watched' | 'stalled' | 'dropped'
export type SortOption = 'rating' | 'year' | 'title'

export const STATUS_MAP: Record<Anime['status'], { label: string; dot: string; text: string; textLight: string }> = {
  watching: { label: 'WATCHING', dot: 'bg-emerald-400', text: 'text-emerald-400/80', textLight: 'text-emerald-700 font-medium' },
  watched:  { label: 'WATCHED',  dot: 'bg-zinc-400',     text: 'text-zinc-400',        textLight: 'text-zinc-500 font-medium' },
  stalled:  { label: 'STALLED',  dot: 'bg-yellow-400',   text: 'text-yellow-400/80',   textLight: 'text-amber-700 font-medium' },
  dropped:  { label: 'DROPPED',  dot: 'bg-red-500',      text: 'text-red-400/70',      textLight: 'text-rose-700 font-medium' },
}

export const INITIAL_CATEGORIES: LibraryCategory[] = [
  {
    id: 'anime',
    label: 'ANIME SERIES',
    tag: 'ANIME_TV',
    headline: 'Your anime',
    subhead: 'series diary.',
    description: 'Track, rate & log every anime series you watch. Minimal. Honest. Yours.',
    type: 'series',
    unitLabel: 'SEASONS',
  },
  {
    id: 'movies',
    label: 'MOVIES',
    tag: 'FILMS_CINEMA',
    headline: 'Your movie',
    subhead: 'cinema diary.',
    description: 'Track, rate & log feature films, anime movies & cinema masterpieces.',
    type: 'movies',
    unitLabel: 'PARTS',
  },
  {
    id: 'live_action',
    label: 'LIVE ACTION',
    tag: 'LIVE_SERIES',
    headline: 'Your live action',
    subhead: 'series diary.',
    description: 'Track, rate & log live action dramas, sci-fi & global television series.',
    type: 'series',
    unitLabel: 'SEASONS',
  },
]

export const CATEGORIES = INITIAL_CATEGORIES
