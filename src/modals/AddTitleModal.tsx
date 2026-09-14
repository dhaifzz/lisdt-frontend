import { useState, useEffect, useMemo } from 'react'
import { Anime, MediaCategory, CATEGORIES, STATUS_MAP } from '../types'
import { useTheme } from '../context/ThemeContext'
import { toast } from '../context/ToastContext'

interface AddTitleModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (item: Anime) => void
  defaultCategory: MediaCategory
  categories?: typeof CATEGORIES
  mediaList?: Anime[]
  isLight?: boolean
}

export default function AddTitleModal({
  isOpen,
  onClose,
  onAdd,
  defaultCategory,
  categories = CATEGORIES,
  mediaList = [],
  isLight: propIsLight,
}: AddTitleModalProps) {
  const { theme } = useTheme()
  const isLight = propIsLight ?? (theme === 'light')

  const [category, setCategory] = useState<MediaCategory>(defaultCategory)
  const [title, setTitle] = useState('')
  const [cover, setCover] = useState('')
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [seasonsFinished, setSeasonsFinished] = useState(1)
  const [parts, setParts] = useState(1)
  const [moviesCount, setMoviesCount] = useState(0)
  const [status, setStatus] = useState<Anime['status']>('watching')
  const [rating, setRating] = useState('')
  const [topRank, setTopRank] = useState<number | null>(null)
  const [coverErr, setCoverErr] = useState(false)
  const [coverMode, setCoverMode] = useState<'url' | 'upload'>('url')

  // Map of rank number -> other title currently occupying that rank
  const occupiedRanks = useMemo(() => {
    const map = new Map<number, Anime>()
    for (const item of mediaList) {
      if (item.topRank && item.topRank >= 1 && item.topRank <= 10) {
        map.set(item.topRank, item)
      }
    }
    return map
  }, [mediaList])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setCover(result)
      setCoverErr(false)
    }
    reader.readAsDataURL(file)
  }

  // Sync default category when modal opens
  useEffect(() => {
    if (isOpen) {
      setCategory(defaultCategory)
      setCoverErr(false)
      setTopRank(null)
    }
  }, [isOpen, defaultCategory])

  // Lock background page scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const currentCategoryConfig = categories.find(c => c.id === category) ?? categories[0] ?? CATEGORIES[0]
  const isMovie = currentCategoryConfig.type === 'movies' || category === 'movies'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) {
      toast.error('ERR: TITLE_REQUIRED')
      return
    }
    if (cleanTitle.length > 80) {
      toast.error('ERR: TITLE_EXCEEDS_80_CHARACTERS')
      return
    }

    const parsedRating = rating.trim() === '' ? null : Math.min(10, Math.max(1, Math.round(Number(rating)) || 1))
    const cleanedCover = cover.trim().includes('photo-1578632767115-351597cf2477') ? '' : cover.trim()
    const newItem: Anime = {
      id: Date.now(),
      category,
      title: cleanTitle,
      cover: cleanedCover,
      year: Number(year) || new Date().getFullYear(),
      seasonsFinished: isMovie ? 0 : Math.max(0, Number(seasonsFinished) || 0),
      parts: isMovie ? Math.max(1, Number(parts) || 1) : undefined,
      moviesCount: !isMovie ? Math.max(0, Number(moviesCount) || 0) : undefined,
      status,
      rating: parsedRating !== null ? Math.round(parsedRating) : null,
      topRank: topRank ?? null,
    }

    onAdd(newItem)
    // Reset form
    setTitle('')
    setCover('')
    setRating('')
    setTopRank(null)
    setSeasonsFinished(1)
    setParts(1)
    setMoviesCount(0)
    setCoverMode('url')
    onClose()
  }

  const statusOptions: { value: Anime['status']; label: string; activeClass: string }[] = [
    {
      value: 'watching',
      label: 'WATCHING',
      activeClass: isLight
        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold shadow-xs'
        : 'border-emerald-400 bg-emerald-500/15 text-emerald-300 font-bold',
    },
    {
      value: 'watched',
      label: 'WATCHED',
      activeClass: isLight
        ? 'border-zinc-950 bg-zinc-950 text-white font-bold shadow-xs'
        : 'border-white bg-white text-black font-bold',
    },
    {
      value: 'stalled',
      label: 'STALLED',
      activeClass: isLight
        ? 'border-amber-500 bg-amber-50 text-amber-700 font-bold shadow-xs'
        : 'border-yellow-400 bg-yellow-500/15 text-yellow-300 font-bold',
    },
    {
      value: 'dropped',
      label: 'DROPPED',
      activeClass: isLight
        ? 'border-red-500 bg-red-50 text-red-700 font-bold shadow-xs'
        : 'border-red-500 bg-red-500/15 text-red-300 font-bold',
    },
  ]

  return (
    <div className={`fixed inset-0 z-50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 overflow-y-auto fade-in ${
      isLight ? 'bg-black/40' : 'bg-black/85'
    }`}>
      {/* Backdrop click dismiss */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog Container */}
      <div className={`relative w-full max-w-2xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col border p-3.5 sm:p-7 z-10 my-auto transition-colors duration-200 overflow-hidden ${
        isLight
          ? 'bg-white border-zinc-300 shadow-2xl text-zinc-900'
          : 'bg-[#090909] border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.9)] text-white'
      }`}>
        {/* Computerized Corner Accents */}
        <div className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 pointer-events-none ${isLight ? 'border-zinc-950' : 'border-white'}`} />
        <div className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 pointer-events-none ${isLight ? 'border-zinc-950' : 'border-white'}`} />
        <div className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 pointer-events-none ${isLight ? 'border-zinc-950' : 'border-white'}`} />
        <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 pointer-events-none ${isLight ? 'border-zinc-950' : 'border-white'}`} />

        {/* Modal Header: Fixed at top of modal */}
        <div className={`flex items-center justify-between pb-3 sm:pb-4 border-b mb-3 sm:mb-4 shrink-0 ${
          isLight ? 'border-zinc-200' : 'border-zinc-900'
        }`}>
          <div>
            <h2 className={`font-mono text-base sm:text-lg font-bold tracking-wide mt-0.5 ${
              isLight ? 'text-zinc-950' : 'text-white'
            }`}>
              LOG NEW TITLE
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`font-mono text-xs px-2 py-1 border transition-colors cursor-pointer ${
              isLight
                ? 'text-zinc-600 hover:text-zinc-950 border-zinc-300 hover:border-zinc-500 bg-zinc-50'
                : 'text-zinc-500 hover:text-white border-zinc-800 hover:border-zinc-600'
            }`}
          >
            [ ESC ]
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto flex-1 p-1 sm:p-2 scrollbar-thin">
          {/* Category Selector Tabs */}
          <div className="mb-5">
            <label className={`block font-mono text-[9px] tracking-wider mb-2 ${
              isLight ? 'text-zinc-600' : 'text-zinc-500'
            }`}>
              SELECT_MEDIA_COLLECTION
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => {
                const isSelected = category === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`font-mono text-[10px] sm:text-xs py-2 px-2.5 border transition-all duration-150 tracking-wider text-center cursor-pointer ${
                      isSelected
                        ? isLight
                          ? 'border-zinc-950 bg-zinc-950 text-white font-bold shadow-sm'
                          : 'border-white bg-white text-black font-bold shadow-md'
                        : isLight
                        ? 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-400 hover:text-zinc-950'
                        : 'border-zinc-800 bg-[#080808] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                    }`}
                  >
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Form & Live Poster Preview Grid */}
          <form id="add-title-form" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-[152px_1fr] gap-5 items-start">
            {/* Left Mini Live Poster Preview */}
            <div className="hidden sm:flex flex-col items-center gap-2 sticky top-0 p-1">
              <div className={`relative w-36 aspect-[2/3] overflow-hidden border ${
                isLight
                  ? 'bg-zinc-100 border-zinc-300 shadow-[0_4px_16px_rgba(0,0,0,0.12)]'
                  : 'bg-zinc-900 border-zinc-800 shadow-[0_4px_24px_rgba(0,0,0,0.6)]'
              }`}>
                {cover.trim() && !coverErr ? (
                  <img
                    src={cover}
                    alt={title || 'Preview'}
                    onError={() => setCoverErr(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center p-2.5 select-none relative overflow-hidden ${
                    isLight
                      ? 'bg-gradient-to-b from-zinc-100 via-zinc-50 to-zinc-200 text-zinc-900'
                      : 'bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-white'
                  }`}>
                    <div className="text-center flex flex-col items-center justify-center px-2">
                      <span className={`font-bold font-sans text-xs leading-tight uppercase tracking-tight line-clamp-4 ${
                        isLight ? 'text-zinc-900' : 'text-zinc-100'
                      }`}>
                        {title.trim() || 'UNTITLED'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Top Favorite Rank Badge */}
                {topRank && topRank >= 1 && topRank <= 10 && (
                  <div className="absolute top-1 left-1 z-10 select-none">
                    <div
                      className={`flex items-center gap-1 px-1.5 py-0.5 font-mono text-[8px] font-bold tracking-wider border shadow-md ${
                        topRank === 1
                          ? 'bg-amber-500 text-black border-amber-300 font-black'
                          : topRank === 2
                          ? 'bg-zinc-200 text-zinc-950 border-white font-extrabold'
                          : topRank === 3
                          ? 'bg-amber-800 text-amber-100 border-amber-600 font-extrabold'
                          : isLight
                          ? 'bg-zinc-900 text-zinc-100 border-zinc-700'
                          : 'bg-black/90 text-zinc-200 border-zinc-700'
                      }`}
                    >
                      <span className="opacity-75">TOP</span>
                      <span>{topRank}</span>
                    </div>
                  </div>
                )}

                {/* Live rating badge */}
                {rating !== '' && (
                  <div className={`absolute top-1 right-1 font-mono border px-1 py-0.5 ${
                    isLight ? 'bg-white/95 border-zinc-300 shadow-xs' : 'bg-[#080808]/90 border-zinc-700'
                  }`}>
                    <span className={`text-[10px] font-bold tabular-nums ${isLight ? 'text-zinc-950' : 'text-white'}`}>
                      {rating && !isNaN(Number(rating)) ? Math.min(10, Math.max(1, Math.round(Number(rating)))) : '—'}
                    </span>
                  </div>
                )}

                {/* Status footer */}
                <div className={`absolute bottom-0 inset-x-0 px-1.5 py-1 flex items-center justify-between border-t ${
                  isLight ? 'bg-white/95 border-zinc-200' : 'bg-black/80 border-zinc-800'
                }`}>
                  <span className={`font-mono text-[8px] font-bold ${isLight ? STATUS_MAP[status].textLight : STATUS_MAP[status].text}`}>
                    {STATUS_MAP[status].label}
                  </span>
                  {isMovie ? (
                    <span className={`font-mono text-[8px] ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      {parts > 1 ? `${parts} PARTS` : 'FILM'}
                    </span>
                  ) : (
                    <span className={`font-mono text-[8px] ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      {seasonsFinished > 0 && `${seasonsFinished}S`}
                      {moviesCount > 0 && ` +${moviesCount}M`}
                    </span>
                  )}
                </div>
              </div>
              <span className={`font-mono text-[8px] ${isLight ? 'text-zinc-500' : 'text-zinc-600'}`}>LIVE_CARD</span>
            </div>

            {/* Right Inputs */}
            <div className="space-y-4">
              {/* Title */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`block font-mono text-[9px] tracking-wider ${isLight ? 'text-zinc-600' : 'text-zinc-500'}`}>
                    {isMovie ? 'MOVIE_TITLE' : 'SERIES_TITLE'} *
                  </label>
                  <span className={`font-mono text-[9px] ${
                    title.length > 70 ? 'text-amber-500 font-bold' : isLight ? 'text-zinc-400' : 'text-zinc-600'
                  }`}>
                    {title.length}/80
                  </span>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={80}
                  required
                  placeholder={isMovie ? "e.g. Blade Runner 2049 (max 80 chars)" : "e.g. Steins;Gate (max 80 chars)"}
                  className={`w-full font-medium text-xs sm:text-sm px-3 py-2 outline-none transition-colors border ${
                    isLight
                      ? 'bg-zinc-50 border-zinc-300 focus:border-zinc-800 text-zinc-900 placeholder-zinc-400'
                      : 'bg-[#080808] border-zinc-800 focus:border-white text-white placeholder-zinc-700'
                  }`}
                />
              </div>

              {/* Score Rating — Pick a Number [1 - 10] */}
              <div>
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5 mb-1.5">
                  <label className={`font-mono text-[9px] tracking-wider whitespace-nowrap shrink-0 ${isLight ? 'text-zinc-600 font-medium' : 'text-zinc-500'}`}>
                    SCORE_RATING [1 - 10]
                  </label>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {rating !== '' ? (
                      <span className={`font-mono text-xs font-bold px-2 py-0.5 border whitespace-nowrap inline-flex items-center shrink-0 ${
                        isLight
                          ? Number(rating) >= 9
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                            : Number(rating) >= 7
                            ? 'border-cyan-600 bg-cyan-50 text-cyan-700'
                            : Number(rating) >= 5
                            ? 'border-amber-600 bg-amber-50 text-amber-700'
                            : 'border-red-600 bg-red-50 text-red-700'
                          : Number(rating) >= 9
                          ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400'
                          : Number(rating) >= 7
                          ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-400'
                          : Number(rating) >= 5
                          ? 'border-yellow-500/60 bg-yellow-500/10 text-yellow-400'
                          : 'border-red-500/60 bg-red-500/10 text-red-400'
                      }`}>
                        {rating} / 10
                      </span>
                    ) : (
                      <span className={`font-mono text-[10px] whitespace-nowrap shrink-0 ${isLight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        UNRATED
                      </span>
                    )}
                    {rating !== '' && (
                      <button
                        type="button"
                        onClick={() => setRating('')}
                        className={`font-mono text-[9px] px-1.5 py-0.5 border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          isLight
                            ? 'border-zinc-300 text-zinc-500 hover:text-zinc-900 bg-zinc-50'
                            : 'border-zinc-800 text-zinc-500 hover:text-white bg-zinc-950'
                        }`}
                        title="Clear score"
                      >
                        CLEAR
                      </button>
                    )}
                  </div>
                </div>

                {/* Number Picker Grid */}
                <div className="grid grid-cols-10 gap-0.5 sm:gap-1.5 w-full">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
                    const isSelected = rating === num.toString()
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setRating(isSelected ? '' : num.toString())}
                        className={`w-full aspect-square min-w-0 p-0 font-mono text-[11px] sm:text-xs font-bold border flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? isLight
                              ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm'
                              : 'bg-white text-black border-white shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                            : isLight
                            ? 'bg-white border-zinc-300 text-zinc-600 hover:border-zinc-500 hover:text-zinc-950'
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        {num}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Poster Image — URL or Upload */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`block font-mono text-[9px] tracking-wider ${isLight ? 'text-zinc-600' : 'text-zinc-500'}`}>
                    POSTER_IMAGE
                  </label>
                  {cover.trim() !== '' && (
                    <button
                      type="button"
                      onClick={() => {
                        setCover('')
                        setCoverErr(false)
                      }}
                      className={`font-mono text-[9px] px-1.5 py-0.5 border transition-colors cursor-pointer ${
                        isLight
                          ? 'border-zinc-300 text-zinc-500 hover:text-zinc-900 bg-zinc-50'
                          : 'border-zinc-800 text-zinc-500 hover:text-white bg-zinc-950'
                      }`}
                      title="Remove poster image"
                    >
                      REMOVE_POSTER
                    </button>
                  )}
                </div>

                {/* Mode toggle */}
                <div className="flex mb-1.5">
                  {(['url', 'upload'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setCoverMode(mode)}
                      className={`font-mono text-[9px] tracking-wider px-2.5 py-1 border transition-colors cursor-pointer ${
                        coverMode === mode
                          ? isLight
                            ? 'border-zinc-950 bg-zinc-950 text-white font-bold'
                            : 'border-white bg-white text-black font-bold'
                          : isLight
                          ? 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-400 hover:text-zinc-950'
                          : 'border-zinc-800 bg-[#080808] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                      }`}
                    >
                      {mode === 'url' ? 'LINK_URL' : 'UPLOAD_FILE'}
                    </button>
                  ))}
                </div>

                {coverMode === 'url' ? (
                  <input
                    type="url"
                    value={cover.startsWith('data:') ? '' : cover}
                    onChange={e => {
                      setCover(e.target.value)
                      setCoverErr(false)
                    }}
                    placeholder="https://... (leave empty for default)"
                    className={`w-full font-mono text-xs px-3 py-2 outline-none transition-colors border ${
                      isLight
                        ? 'bg-zinc-50 border-zinc-300 focus:border-zinc-800 text-zinc-900 placeholder-zinc-400'
                        : 'bg-[#080808] border-zinc-800 focus:border-white text-zinc-300 placeholder-zinc-700'
                    }`}
                  />
                ) : (
                  <label className={`flex flex-col items-center justify-center w-full border border-dashed py-4 px-3 cursor-pointer transition-colors group ${
                    isLight
                      ? 'border-zinc-300 hover:border-zinc-500 bg-zinc-50'
                      : 'border-zinc-700 hover:border-zinc-500 bg-[#080808]'
                  }`}>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <div className="flex flex-col items-center gap-1 pointer-events-none">
                      <svg className={`w-4 h-4 transition-colors ${isLight ? 'text-zinc-400 group-hover:text-zinc-700' : 'text-zinc-600 group-hover:text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <span className={`font-mono text-[9px] tracking-wider transition-colors ${isLight ? 'text-zinc-500 group-hover:text-zinc-800' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                        {cover.startsWith('data:') ? 'IMAGE_LOADED — click to replace' : 'CLICK_TO_UPLOAD .png / .jpg'}
                      </span>
                    </div>
                  </label>
                )}
              </div>

              {/* Year & Seasons/Parts */}
              {isMovie ? (
                /* Movie: Release Year & Parts */
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block font-mono text-[9px] tracking-wider mb-1 ${isLight ? 'text-zinc-600' : 'text-zinc-500'}`}>
                      RELEASE_YEAR *
                    </label>
                    <input
                      type="number"
                      min="1940"
                      max="2035"
                      value={year}
                      onChange={e => setYear(parseInt(e.target.value) || year)}
                      required
                      className={`w-full font-mono text-xs px-3 py-2 outline-none transition-colors border ${
                        isLight
                          ? 'bg-zinc-50 border-zinc-300 focus:border-zinc-800 text-zinc-900'
                          : 'bg-[#080808] border-zinc-800 focus:border-white text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block font-mono text-[9px] tracking-wider mb-1 ${isLight ? 'text-zinc-600' : 'text-zinc-500'}`}>
                      PARTS
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={parts}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '')
                        setParts(val === '' ? 1 : Math.max(1, Math.min(99, parseInt(val, 10))))
                      }}
                      placeholder="1"
                      className={`w-full font-mono text-xs px-3 py-2 outline-none transition-colors border ${
                        isLight
                          ? 'bg-zinc-50 border-zinc-300 focus:border-zinc-800 text-zinc-900'
                          : 'bg-[#080808] border-zinc-800 focus:border-white text-white'
                      }`}
                    />
                  </div>
                </div>
              ) : (
                /* Series: Release Year, Seasons Finished & Companion Movies */
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block font-mono text-[9px] tracking-wider mb-1 ${isLight ? 'text-zinc-600' : 'text-zinc-500'}`}>
                        RELEASE_YEAR *
                      </label>
                      <input
                        type="number"
                        min="1940"
                        max="2035"
                        value={year}
                        onChange={e => setYear(parseInt(e.target.value) || year)}
                        required
                        className={`w-full font-mono text-xs px-3 py-2 outline-none transition-colors border ${
                          isLight
                            ? 'bg-zinc-50 border-zinc-300 focus:border-zinc-800 text-zinc-900'
                            : 'bg-[#080808] border-zinc-800 focus:border-white text-white'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block font-mono text-[9px] tracking-wider mb-1 ${isLight ? 'text-zinc-600' : 'text-zinc-500'}`}>
                        SEASONS_FINISHED
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={seasonsFinished}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '')
                          setSeasonsFinished(val === '' ? 0 : Math.min(100, parseInt(val, 10)))
                        }}
                        className={`w-full font-mono text-xs px-3 py-2 outline-none transition-colors border ${
                          isLight
                            ? 'bg-zinc-50 border-zinc-300 focus:border-zinc-800 text-zinc-900'
                            : 'bg-[#080808] border-zinc-800 focus:border-white text-white'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Add if there is a movie in this series */}
                  <div className={`p-2.5 border ${
                    isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950/60 border-zinc-800/80'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={`block font-mono text-[9px] tracking-wider ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        MOVIES_IN_SERIES
                      </label>
                      <span className="font-mono text-[9px] text-amber-500 font-medium">
                        {moviesCount > 0 ? `${moviesCount} MOVIE${moviesCount > 1 ? 'S' : ''}` : 'NO MOVIES'}
                      </span>
                    </div>
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setMoviesCount(prev => Math.max(0, prev - 1))}
                          className={`w-7 h-7 border font-mono text-xs flex items-center justify-center transition-colors cursor-pointer select-none ${
                            isLight
                              ? 'border-zinc-300 bg-white text-zinc-700 hover:text-black hover:border-zinc-500 shadow-xs'
                              : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-600'
                          }`}
                        >
                          -
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={moviesCount}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '')
                            setMoviesCount(val === '' ? 0 : Math.min(50, parseInt(val, 10)))
                          }}
                          className={`w-12 text-center border-y font-mono text-xs h-7 outline-none ${
                            isLight
                              ? 'bg-white border-zinc-300 text-zinc-900'
                              : 'bg-[#080808] border-zinc-800 text-white'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setMoviesCount(prev => prev + 1)}
                          className={`w-7 h-7 border font-mono text-xs flex items-center justify-center transition-colors cursor-pointer select-none ${
                            isLight
                              ? 'border-zinc-300 bg-white text-zinc-700 hover:text-black hover:border-zinc-500 shadow-xs'
                              : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-600'
                          }`}
                        >
                          +
                        </button>
                      </div>
                      <span className={`font-mono text-[9px] min-w-0 ${isLight ? 'text-zinc-500' : 'text-zinc-600'}`}>
                        {moviesCount === 0 ? 'Click + to attach movies' : 'Movies attached to series'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Selection */}
              <div>
                <label className={`block font-mono text-[9px] tracking-wider mb-1 ${isLight ? 'text-zinc-600' : 'text-zinc-500'}`}>
                  WATCH_STATUS
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {statusOptions.map(opt => {
                    const isSelected = status === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStatus(opt.value)}
                        className={`font-mono text-[10px] py-1.5 px-2 border transition-all duration-150 tracking-wider text-center cursor-pointer ${
                          isSelected
                            ? opt.activeClass
                            : isLight
                            ? 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-400 hover:text-zinc-950'
                            : 'border-zinc-800 bg-[#080808] text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Top Favorites Selection (Optional, 1 - 10) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`block font-mono text-[9px] tracking-wider ${isLight ? 'text-zinc-600' : 'text-zinc-500'}`}>
                    TOP_FAVORITE_RANK [RESTRICTED 1 TITLE PER RANK]
                  </label>
                  {topRank && (
                    <span className="font-mono text-[10px] font-bold text-amber-500">
                      {occupiedRanks.has(topRank)
                        ? `TRANSFERRING RANK #${topRank}`
                        : `RANK #${topRank} ASSIGNED`}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTopRank(null)}
                    className={`font-mono text-[10px] px-2.5 py-1.5 border transition-all cursor-pointer ${
                      topRank === null
                        ? isLight
                          ? 'bg-zinc-900 text-white border-zinc-900 font-bold'
                          : 'bg-white text-black border-white font-bold'
                        : isLight
                        ? 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900'
                        : 'border-zinc-800 bg-[#080808] text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                    }`}
                  >
                    NONE
                  </button>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rank => {
                    const isSelected = topRank === rank
                    const occupant = occupiedRanks.get(rank)
                    const isOccupiedByOther = Boolean(occupant)

                    return (
                      <button
                        key={rank}
                        type="button"
                        onClick={() => setTopRank(isSelected ? null : rank)}
                        title={
                          occupant
                            ? `Rank #${rank} is held by "${occupant.title}". Click to transfer to this title.`
                            : `Assign Rank #${rank}`
                        }
                        className={`relative font-mono text-[10px] min-w-[30px] py-1.5 px-1.5 border transition-all text-center cursor-pointer ${
                          isSelected
                            ? rank === 1
                              ? 'bg-amber-500 text-black border-amber-400 font-black shadow-xs'
                              : rank <= 3
                              ? 'bg-amber-600 text-white border-amber-500 font-bold'
                              : isLight
                              ? 'bg-zinc-900 text-white border-zinc-900 font-bold'
                              : 'bg-white text-black border-white font-bold'
                            : isOccupiedByOther
                            ? isLight
                              ? 'border-amber-300 bg-amber-50/60 text-zinc-800 hover:border-amber-500 hover:bg-amber-100/60 font-medium'
                              : 'border-amber-800/80 bg-amber-950/25 text-amber-200 hover:border-amber-500 hover:bg-amber-950/50 font-medium'
                            : isLight
                            ? 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-400 hover:text-zinc-950'
                            : 'border-zinc-800 bg-[#080808] text-zinc-400 hover:border-zinc-700 hover:text-white'
                        }`}
                      >
                        {rank}
                        {/* Indicator dot if occupied and not selected */}
                        {isOccupiedByOther && !isSelected && (
                          <span
                            className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-1.5 ring-white dark:ring-black"
                            title={`Held by "${occupant?.title}"`}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Transfer notice when user picks an occupied rank */}
                {topRank && occupiedRanks.get(topRank) && (
                  <div className={`mt-2 p-2 border font-mono text-[10px] flex items-start gap-1.5 ${
                    isLight
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-amber-950/30 border-amber-800/70 text-amber-300'
                  }`}>
                    <span className="font-bold shrink-0">⚠️ TRANSFER:</span>
                    <div>
                      Rank <span className="font-bold">#{topRank}</span> is held by <span className="font-bold">"{occupiedRanks.get(topRank)!.title}"</span>.
                      <span className="opacity-80 block text-[9px] mt-0.5">
                        Saving will reassign Rank #{topRank} to this title and unrank "{occupiedRanks.get(topRank)!.title}".
                      </span>
                    </div>
                  </div>
                )}

                {/* Taken ranks list */}
                {occupiedRanks.size > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1 items-center">
                    <span className={`font-mono text-[8px] uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>
                      Taken:
                    </span>
                    {Array.from(occupiedRanks.entries())
                      .sort(([a], [b]) => a - b)
                      .map(([r, item]) => (
                        <span
                          key={r}
                          className={`font-mono text-[9px] px-1.5 py-0.5 border ${
                            topRank === r
                              ? isLight
                                ? 'border-amber-400 bg-amber-100 text-amber-900 font-semibold'
                                : 'border-amber-600 bg-amber-950/50 text-amber-300 font-semibold'
                              : isLight
                              ? 'border-zinc-200 bg-zinc-100 text-zinc-600'
                              : 'border-zinc-800 bg-zinc-900/60 text-zinc-400'
                          }`}
                          title={`Rank #${r} is currently held by "${item.title}"`}
                        >
                          #{r} {item.title}
                        </span>
                      ))}
                  </div>
                )}

                <p className={`font-mono text-[9px] mt-1.5 ${isLight ? 'text-zinc-500' : 'text-zinc-600'}`}>
                  Top 10 favorites list restricts each rank (1-10) to strictly one title. Selecting a taken rank will transfer it to this title.
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer: Pinned at bottom of modal */}
        <div className={`shrink-0 pt-3 sm:pt-4 border-t flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 mt-2.5 sm:mt-3 transition-colors ${
          isLight ? 'border-zinc-200 bg-white' : 'border-zinc-900 bg-[#090909]'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`font-mono text-xs border px-4 py-2 sm:py-2.5 transition-colors tracking-wider cursor-pointer text-center ${
              isLight
                ? 'border-zinc-300 hover:border-zinc-500 text-zinc-700 hover:text-black bg-zinc-50'
                : 'border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white'
            }`}
          >
            CANCEL
          </button>
          <button
            type="submit"
            form="add-title-form"
            className={`font-mono text-xs font-bold px-4 sm:px-5 py-2.5 transition-colors tracking-wider cursor-pointer shadow-sm text-center ${
              isLight
                ? 'bg-zinc-900 hover:bg-black text-white'
                : 'bg-white hover:bg-zinc-200 text-black'
            }`}
          >
            + ADD_TO_LIBRARY
          </button>
        </div>
      </div>
    </div>
  )
}
