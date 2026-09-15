import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Anime, STATUS_MAP, CATEGORIES, MediaCategory, LibraryCategory } from '../types'
import { toast } from '../context/ToastContext'
import { useTheme } from '../context/ThemeContext'
import { uploadApi, isValidCoverUrl } from '../lib/api'

interface EditAnimeViewProps {
  anime: Anime
  mediaList?: Anime[]
  onSave: (updated: Anime) => void
  onDelete?: (id: number) => void | Promise<void>
  onBack: () => void
  categories?: LibraryCategory[]
  isLight?: boolean
}

export default function EditAnimeView({
  anime,
  mediaList = [],
  onSave,
  onDelete,
  onBack,
  categories = CATEGORIES,
  isLight: propIsLight,
}: EditAnimeViewProps) {
  const { theme } = useTheme()
  const isLight = propIsLight ?? (theme === 'light')

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Ensure page starts at the very top when opened
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  // Handle ESC key to exit or close delete confirm
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false)
        } else {
          onBack()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onBack, showDeleteConfirm])

  // Lock background page scroll while delete modal is open
  useEffect(() => {
    if (showDeleteConfirm) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [showDeleteConfirm])

  const [category, setCategory] = useState<MediaCategory>(anime.category || 'anime')
  const [title, setTitle] = useState(anime.title)
  const [cover, setCover] = useState(anime.cover?.includes('photo-1578632767115-351597cf2477') ? '' : (anime.cover || ''))
  const [coverMode, setCoverMode] = useState<'upload' | 'url'>('upload')
  const [seasonsFinished, setSeasonsFinished] = useState(anime.seasonsFinished ?? (anime.category === 'movies' ? 0 : 1))
  const [parts, setParts] = useState(anime.parts ?? 1)
  const [moviesCount, setMoviesCount] = useState(anime.moviesCount ?? 0)
  const [year, setYear] = useState(anime.year)
  const [status, setStatus] = useState<Anime['status']>(anime.status)
  const [rating, setRating] = useState(anime.rating !== null ? Math.round(anime.rating).toString() : '')
  const [topRank, setTopRank] = useState<number | null>(anime.topRank ?? null)
  const [coverErr, setCoverErr] = useState(false)
  const [isUploadingCover, setIsUploadingCover] = useState(false)

  // Map of rank number -> other title currently occupying that rank
  const occupiedRanks = useMemo(() => {
    const map = new Map<number, Anime>()
    for (const item of mediaList) {
      if (item.id !== anime.id && item.topRank && item.topRank >= 1 && item.topRank <= 10) {
        map.set(item.topRank, item)
      }
    }
    return map
  }, [mediaList, anime.id])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.match(/^image\/(png|jpeg|jpg|webp|gif|avif)$/)) {
      toast.error('ERR: ONLY_IMAGES_ALLOWED')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ERR: IMAGE_EXCEEDS_5MB')
      return
    }

    setIsUploadingCover(true)
    try {
      const res = await uploadApi.uploadCover(file, cover)
      setCover(res.url)
      setCoverErr(false)
      setCoverMode('upload')
      toast.success('COVER_UPLOADED')
    } catch (err: any) {
      console.error('Storage upload failed:', err)
      const reader = new FileReader()
      reader.onload = (ev) => {
        const result = ev.target?.result as string
        setCover(result)
        setCoverErr(false)
        setCoverMode('upload')
      }
      reader.readAsDataURL(file)
      toast.error(err?.message || 'Storage upload failed, using local preview')
    } finally {
      setIsUploadingCover(false)
    }
  }

  const currentCat = categories.find(c => c.id === category)
  const isMovie = currentCat ? currentCat.type === 'movies' : category === 'movies'

  const handleFormSubmit = (e: React.FormEvent) => {
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
    const updated: Anime = {
      ...anime,
      category,
      title: cleanTitle,
      cover: cleanedCover,
      seasonsFinished: isMovie ? 0 : Math.max(0, Number(seasonsFinished) || 0),
      parts: isMovie ? Math.max(1, Number(parts) || 1) : undefined,
      moviesCount: !isMovie ? Math.max(0, Number(moviesCount) || 0) : undefined,
      year: Number(year) || anime.year,
      status,
      rating: parsedRating !== null ? Math.round(parsedRating) : null,
      topRank: topRank ?? null,
    }
    onSave(updated)
    toast.success(`SAVED: "${updated.title}"`)
    setTimeout(() => {
      onBack()
    }, 400)
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

  const currentCategoryConfig = categories.find(c => c.id === category) ?? categories[0] ?? CATEGORIES[0]

  return (
    <div className={`min-h-screen pb-24 fade-in transition-colors duration-200 ${
      isLight ? 'bg-[#f5f5f7] text-zinc-900' : 'bg-[#080808] text-white'
    }`}>
      {/* Top sticky navigation bar */}
      <div className={`sticky top-0 z-50 border-b backdrop-blur-md transform-gpu transition-colors duration-200 ${
        isLight ? 'border-zinc-200 bg-[#f5f5f7]/95' : 'border-zinc-900 bg-[#080808]/95'
      }`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={onBack}
            className={`flex items-center gap-2 font-mono text-xs transition-colors cursor-pointer ${
              isLight ? 'text-zinc-600 hover:text-zinc-950' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>&lt;</span>
            <span>BACK_TO_LIBRARY</span>
          </button>
          <button
            onClick={onBack}
            className={`font-mono text-xs px-2 py-1 transition-colors cursor-pointer ${
              isLight ? 'text-zinc-500 hover:text-zinc-950' : 'text-zinc-600 hover:text-white'
            }`}
          >
            [ ESC ]
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10">
        {/* Title Header */}
        <div className={`mb-8 border-b pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 ${
          isLight ? 'border-zinc-200' : 'border-zinc-900'
        }`}>
          <div>
            <p className={`font-mono text-[10px] tracking-widest uppercase ${
              isLight ? 'text-zinc-500' : 'text-zinc-600'
            }`}>
              EDIT {currentCategoryConfig.label} ENTRY
            </p>
            <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight mt-1 ${
              isLight ? 'text-zinc-950' : 'text-white'
            }`}>
              {title || 'Untitled Entry'}
            </h1>
            <p className={`font-mono text-xs mt-1 ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>
              {year} · <span className={isLight ? STATUS_MAP[status].textLight : STATUS_MAP[status].text}>{STATUS_MAP[status].label}</span>
              {isMovie && ` · ${parts} ${parts === 1 ? 'Part' : 'Parts'}`}
              {!isMovie && seasonsFinished > 0 && ` · ${seasonsFinished} ${seasonsFinished === 1 ? 'Season' : 'Seasons'}`}
              {!isMovie && moviesCount > 0 && ` · +${moviesCount} ${moviesCount === 1 ? 'Movie' : 'Movies'}`}
            </p>
          </div>
        </div>

        {/* Main Grid: Left Poster, Right Form */}
        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8 items-start">
          {/* Left: Poster Preview */}
          <div className="flex flex-col items-center sm:items-start gap-3">
            <div className={`relative w-52 sm:w-64 aspect-[2/3] overflow-hidden border shadow-2xl transition-colors ${
              isLight ? 'bg-zinc-100 border-zinc-300' : 'bg-zinc-900 border-zinc-800'
            }`}>
              {!coverErr && isValidCoverUrl(cover) ? (
                <img
                  src={cover}
                  alt={title}
                  onError={() => setCoverErr(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center p-4 select-none relative overflow-hidden transition-colors ${
                  isLight
                    ? 'bg-gradient-to-b from-zinc-100 via-zinc-50 to-zinc-200 text-zinc-900'
                    : 'bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-white'
                }`}>
                  <div className="text-center flex flex-col items-center justify-center px-3">
                    <span className={`font-bold font-sans text-sm sm:text-base leading-tight uppercase tracking-tight line-clamp-4 ${
                      isLight ? 'text-zinc-900' : 'text-zinc-100'
                    }`}>
                      {title.trim() || 'UNTITLED'}
                    </span>
                  </div>
                </div>
              )}

              {/* Top Favorite Rank Badge */}
              {topRank && topRank >= 1 && topRank <= 10 && (
                <div className="absolute top-2 left-2 z-10 select-none">
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider border shadow-md ${
                      topRank === 1
                        ? 'bg-amber-500 text-black border-amber-300 font-black'
                        : topRank === 2
                        ? 'bg-zinc-200 text-zinc-950 border-white font-extrabold'
                        : topRank === 3
                        ? 'bg-amber-800 text-amber-100 border-amber-600 font-extrabold'
                        : isLight
                        ? 'bg-zinc-900/90 text-zinc-100 border-zinc-700 shadow-black/10'
                        : 'bg-black/90 text-zinc-200 border-zinc-700'
                    }`}
                  >
                    <span className="text-[8px] opacity-75">TOP</span>
                    <span>{topRank}</span>
                  </div>
                </div>
              )}

              {/* Live rating badge preview */}
              {rating !== '' && (
                <div className={`absolute top-2 right-2 font-mono backdrop-blur-xs border px-2 py-0.5 ${
                  isLight ? 'bg-white/95 border-zinc-300 shadow-xs' : 'bg-[#080808]/90 border-zinc-700'
                }`}>
                  <span className={`text-xs font-bold tabular-nums ${isLight ? 'text-zinc-950' : 'text-white'}`}>
                    {rating && !isNaN(Number(rating)) ? Math.min(10, Math.max(1, Math.round(Number(rating)))) : '—'}
                  </span>
                </div>
              )}
            </div>

            <p className={`font-mono text-[10px] text-center sm:text-left ${isLight ? 'text-zinc-500' : 'text-zinc-600'}`}>
              * Live preview of card in library
            </p>
          </div>

          {/* Right: Form fields */}
          <div className={`space-y-6 border p-5 sm:p-7 transition-colors ${
            isLight ? 'border-zinc-200 bg-white shadow-xs' : 'border-zinc-900 bg-zinc-950/40'
          }`}>
            {/* Field: Library Category */}
            <div>
              <label className={`block font-mono text-[10px] tracking-wider mb-2 ${
                isLight ? 'text-zinc-600 font-medium' : 'text-zinc-500'
              }`}>
                LIBRARY_CATEGORY [MOVE TO]
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => {
                  const isSelected = category === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`font-mono text-[10px] sm:text-xs py-2 px-2 border transition-all duration-150 tracking-wider text-center cursor-pointer ${
                        isSelected
                          ? isLight
                            ? 'border-zinc-950 bg-zinc-950 text-white font-bold shadow-xs'
                            : 'border-white bg-white text-black font-bold shadow-md'
                          : isLight
                          ? 'border-zinc-300 bg-zinc-100 text-zinc-600 hover:border-zinc-400 hover:text-zinc-950'
                          : 'border-zinc-800 bg-[#080808] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                      }`}
                    >
                      {cat.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Field: Series/Movie Name */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`block font-mono text-[10px] tracking-wider ${
                  isLight ? 'text-zinc-600 font-medium' : 'text-zinc-500'
                }`}>
                  TITLE *
                </label>
                <span className={`font-mono text-[10px] ${
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
                className={`w-full font-medium text-sm px-3.5 py-2.5 outline-none transition-colors border ${
                  isLight
                    ? 'bg-zinc-50 border-zinc-300 focus:border-zinc-950 text-zinc-950 placeholder:text-zinc-400'
                    : 'bg-[#080808] border-zinc-800 focus:border-white text-white'
                }`}
                placeholder="Enter title (max 80 chars)..."
              />
            </div>

            {/* Field: Score Rating — Pick a Number [1 - 10] */}
            <div>
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5 mb-2">
                <label className={`font-mono text-[10px] tracking-wider whitespace-nowrap shrink-0 ${
                  isLight ? 'text-zinc-600 font-medium' : 'text-zinc-500'
                }`}>
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
                    <span className={`font-mono text-[10px] whitespace-nowrap shrink-0 ${isLight ? 'text-zinc-500' : 'text-zinc-600'}`}>UNRATED</span>
                  )}
                  {rating !== '' && (
                    <button
                      type="button"
                      onClick={() => setRating('')}
                      className={`font-mono text-[9px] px-1.5 py-0.5 border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        isLight
                          ? 'border-zinc-300 text-zinc-600 hover:text-zinc-950 bg-zinc-100'
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
              <div className="grid grid-cols-10 gap-1 sm:gap-1.5 w-full">
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
                            ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                            : 'bg-white text-black border-white shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                          : isLight
                          ? 'bg-zinc-100 border-zinc-300 text-zinc-600 hover:border-zinc-400 hover:text-zinc-950'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      {num}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Field: Poster Image — URL or Upload */}
            <div>
              <label className={`block font-mono text-[10px] tracking-wider mb-2 ${
                isLight ? 'text-zinc-600 font-medium' : 'text-zinc-500'
              }`}>
                POSTER_IMAGE
              </label>

              {/* Mode toggle + Clear Poster action */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {(['upload', 'url'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setCoverMode(mode)}
                    className={`font-mono text-[10px] sm:text-xs tracking-wider px-3 py-1.5 border transition-colors cursor-pointer ${
                      coverMode === mode
                        ? isLight
                          ? 'border-zinc-950 bg-zinc-950 text-white font-bold'
                          : 'border-white bg-white text-black font-bold'
                        : isLight
                        ? 'border-zinc-300 bg-zinc-100 text-zinc-600 hover:border-zinc-400 hover:text-zinc-950'
                        : 'border-zinc-800 bg-[#080808] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                    }`}
                  >
                    {mode === 'upload' ? 'UPLOAD_FILE' : 'LINK_URL'}
                  </button>
                ))}

                {cover.trim() !== '' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (cover) {
                        uploadApi.deleteCover(cover).catch(() => {})
                      }
                      setCover('')
                      setCoverErr(false)
                    }}
                    className={`font-mono text-[10px] sm:text-xs tracking-wider px-3 py-1.5 border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isLight
                        ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300'
                        : 'border-red-900/60 bg-red-950/30 text-red-400 hover:bg-red-950/60 hover:border-red-800'
                    }`}
                    title="Remove poster image"
                  >
                    <span>✕</span>
                    <span>Clear Poster</span>
                  </button>
                )}
              </div>

              {coverMode === 'url' ? (
                <div className="relative flex items-center">
                  <input
                    type="url"
                    value={cover.includes('supabase.co') || cover.includes('/uploads/') || cover.startsWith('data:') ? '' : cover}
                    onChange={e => {
                      setCover(e.target.value)
                      setCoverErr(false)
                    }}
                    className={`w-full font-mono text-xs px-3.5 py-2.5 pr-8 outline-none transition-colors border ${
                      isLight
                        ? 'bg-zinc-50 border-zinc-300 focus:border-zinc-950 text-zinc-900 placeholder:text-zinc-400'
                        : 'bg-[#080808] border-zinc-800 focus:border-white text-zinc-300'
                    }`}
                    placeholder="https://... (paste image link)"
                  />
                  {cover && !cover.includes('supabase.co') && !cover.includes('/uploads/') && !cover.startsWith('data:') && (
                    <button
                      type="button"
                      onClick={() => {
                        setCover('')
                        setCoverErr(false)
                      }}
                      className="absolute right-2.5 text-zinc-400 hover:text-red-500 font-mono text-sm cursor-pointer p-1 transition-colors"
                      title="Clear URL"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center w-full border border-dashed py-5 px-4 cursor-pointer transition-colors group ${
                  isLight ? 'border-zinc-300 hover:border-zinc-500 bg-zinc-50' : 'border-zinc-700 hover:border-zinc-500 bg-[#080808]'
                }`}>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                    disabled={isUploadingCover}
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                    {isUploadingCover ? (
                      <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${isLight ? 'border-zinc-800' : 'border-white'}`} />
                    ) : (
                      <svg className={`w-5 h-5 transition-colors ${
                        isLight ? 'text-zinc-500 group-hover:text-zinc-800' : 'text-zinc-600 group-hover:text-zinc-400'
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    )}
                    <span className={`font-mono text-[10px] tracking-wider transition-colors ${
                      isLight ? 'text-zinc-600 group-hover:text-zinc-900' : 'text-zinc-600 group-hover:text-zinc-400'
                    }`}>
                      {isUploadingCover
                        ? 'UPLOADING_TO_STORAGE...'
                        : cover.trim() !== ''
                        ? 'IMAGE_ATTACHED — click to replace'
                        : 'CLICK_TO_UPLOAD .png / .jpg / .webp'}
                    </span>
                  </div>
                </label>
              )}
            </div>

            {/* Row: Seasons/Parts & Release Year */}
            {isMovie ? (
              /* Movie: Parts & Release Year */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block font-mono text-[10px] tracking-wider mb-2 ${
                    isLight ? 'text-zinc-600 font-medium' : 'text-zinc-500'
                  }`}>
                    PARTS (FRANCHISE / CHAPTERS)
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setParts(prev => Math.max(1, prev - 1))}
                      className={`w-10 h-10 border font-mono text-base flex items-center justify-center transition-colors cursor-pointer select-none ${
                        isLight
                          ? 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:text-zinc-950 hover:border-zinc-400'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-600'
                      }`}
                      title="Decrease parts"
                    >
                      -
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={parts}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '')
                        setParts(val === '' ? 1 : Math.max(1, Math.min(99, parseInt(val, 10))))
                      }}
                      className={`flex-1 text-center font-mono text-sm h-10 outline-none border-y ${
                        isLight ? 'bg-white border-zinc-300 text-zinc-950' : 'bg-[#080808] border-zinc-800 text-white'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setParts(prev => Math.min(99, prev + 1))}
                      className={`w-10 h-10 border font-mono text-base flex items-center justify-center transition-colors cursor-pointer select-none ${
                        isLight
                          ? 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:text-zinc-950 hover:border-zinc-400'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-600'
                      }`}
                      title="Increase parts"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block font-mono text-[10px] tracking-wider mb-2 ${
                    isLight ? 'text-zinc-600 font-medium' : 'text-zinc-500'
                  }`}>
                    RELEASE_YEAR
                  </label>
                  <input
                    type="number"
                    min="1940"
                    max="2035"
                    value={year}
                    onChange={e => setYear(parseInt(e.target.value) || year)}
                    className={`w-full font-mono text-sm px-3.5 py-2.5 outline-none transition-colors h-10 border ${
                      isLight
                        ? 'bg-zinc-50 border-zinc-300 focus:border-zinc-950 text-zinc-950'
                        : 'bg-[#080808] border-zinc-800 focus:border-white text-white'
                    }`}
                  />
                </div>
              </div>
            ) : (
              /* Series: Seasons, Release Year & Companion Movies in Series */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block font-mono text-[10px] tracking-wider mb-2 ${
                      isLight ? 'text-zinc-600 font-medium' : 'text-zinc-500'
                    }`}>
                      SEASONS_FINISHED
                    </label>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setSeasonsFinished(prev => Math.max(0, prev - 1))}
                        className={`w-10 h-10 border font-mono text-base flex items-center justify-center transition-colors cursor-pointer select-none ${
                          isLight
                            ? 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:text-zinc-950 hover:border-zinc-400'
                            : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-600'
                        }`}
                        title="Decrease seasons"
                      >
                        -
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={seasonsFinished}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '')
                          setSeasonsFinished(val === '' ? 0 : Math.min(100, parseInt(val, 10)))
                        }}
                        className={`flex-1 text-center font-mono text-sm h-10 outline-none border-y ${
                          isLight ? 'bg-white border-zinc-300 text-zinc-950' : 'bg-[#080808] border-zinc-800 text-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setSeasonsFinished(prev => Math.min(100, prev + 1))}
                        className={`w-10 h-10 border font-mono text-base flex items-center justify-center transition-colors cursor-pointer select-none ${
                          isLight
                            ? 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:text-zinc-950 hover:border-zinc-400'
                            : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-600'
                        }`}
                        title="Increase seasons"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`block font-mono text-[10px] tracking-wider mb-2 ${
                      isLight ? 'text-zinc-600 font-medium' : 'text-zinc-500'
                    }`}>
                      RELEASE_YEAR
                    </label>
                    <input
                      type="number"
                      min="1940"
                      max="2035"
                      value={year}
                      onChange={e => setYear(parseInt(e.target.value) || year)}
                      className={`w-full font-mono text-sm px-3.5 py-2.5 outline-none transition-colors h-10 border ${
                        isLight
                          ? 'bg-zinc-50 border-zinc-300 focus:border-zinc-950 text-zinc-950'
                          : 'bg-[#080808] border-zinc-800 focus:border-white text-white'
                      }`}
                    />
                  </div>
                </div>

                {/* Companion Movies in this Series */}
                <div className={`p-3.5 border transition-colors ${
                  isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950/70 border-zinc-800'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`block font-mono text-[10px] tracking-wider ${
                      isLight ? 'text-zinc-600' : 'text-zinc-400'
                    }`}>
                      MOVIES_IN_SERIES (COMPANION / FEATURE FILMS)
                    </label>
                    <span className={`font-mono text-[10px] font-bold ${
                      isLight ? 'text-amber-700' : 'text-amber-400'
                    }`}>
                      {moviesCount > 0 ? `${moviesCount} MOVIE${moviesCount > 1 ? 'S' : ''}` : 'NO MOVIES'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setMoviesCount(prev => Math.max(0, prev - 1))}
                        className={`w-9 h-9 border font-mono text-sm flex items-center justify-center transition-colors cursor-pointer select-none ${
                          isLight
                            ? 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:text-zinc-950 hover:border-zinc-400'
                            : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-600'
                        }`}
                        title="Decrease companion movies"
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
                        className={`w-16 text-center font-mono text-sm h-9 outline-none border-y ${
                          isLight ? 'bg-white border-zinc-300 text-zinc-950' : 'bg-[#080808] border-zinc-800 text-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setMoviesCount(prev => Math.min(50, prev + 1))}
                        className={`w-9 h-9 border font-mono text-sm flex items-center justify-center transition-colors cursor-pointer select-none ${
                          isLight
                            ? 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:text-zinc-950 hover:border-zinc-400'
                            : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-600'
                        }`}
                        title="Add companion movie"
                      >
                        +
                      </button>
                    </div>
                    <span className={`font-mono text-[10px] ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>
                      {moviesCount === 0
                        ? 'Click + if this series has companion films or canon movies'
                        : `Includes ${moviesCount} companion film${moviesCount > 1 ? 's' : ''}`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Field: Watch Status (4 Choices) */}
            <div>
              <label className={`block font-mono text-[10px] tracking-wider mb-2 ${
                isLight ? 'text-zinc-600 font-medium' : 'text-zinc-500'
              }`}>
                STATUS [SELECT ONE]
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {statusOptions.map(opt => {
                  const isSelected = status === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStatus(opt.value)}
                      className={`font-mono text-xs py-2.5 px-3 border transition-all duration-150 tracking-wider text-center cursor-pointer ${
                        isSelected
                          ? opt.activeClass + ' shadow-md'
                          : isLight
                          ? 'border-zinc-300 bg-zinc-100 text-zinc-600 hover:border-zinc-400 hover:text-zinc-950'
                          : 'border-zinc-800 bg-[#080808] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Field: Top Favorites Position (1 - 10) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`block font-mono text-[10px] tracking-wider ${
                  isLight ? 'text-zinc-600 font-medium' : 'text-zinc-500'
                }`}>
                  TOP_FAVORITE_RANK [RESTRICTED 1 TITLE PER RANK]
                </label>
                {topRank && (
                  <span className={`font-mono text-xs font-bold ${
                    isLight ? 'text-amber-700' : 'text-amber-500'
                  }`}>
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
                  className={`font-mono text-xs px-3 py-2 border transition-all cursor-pointer ${
                    topRank === null
                      ? isLight
                        ? 'bg-zinc-950 text-white border-zinc-950 font-bold'
                        : 'bg-white text-black border-white font-bold'
                      : isLight
                      ? 'border-zinc-300 bg-zinc-100 text-zinc-600 hover:border-zinc-400 hover:text-zinc-950'
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
                      className={`relative font-mono text-xs min-w-[36px] py-2 px-2 border transition-all text-center cursor-pointer ${
                        isSelected
                          ? rank === 1
                            ? 'bg-amber-500 text-black border-amber-400 font-black shadow-xs'
                            : rank <= 3
                            ? 'bg-amber-600 text-white border-amber-500 font-bold'
                            : isLight
                            ? 'bg-zinc-950 text-white border-zinc-950 font-bold'
                            : 'bg-white text-black border-white font-bold'
                          : isOccupiedByOther
                          ? isLight
                            ? 'border-amber-300 bg-amber-50/60 text-zinc-800 hover:border-amber-500 hover:bg-amber-100/60 font-medium'
                            : 'border-amber-800/80 bg-amber-950/25 text-amber-200 hover:border-amber-500 hover:bg-amber-950/50 font-medium'
                          : isLight
                          ? 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:border-zinc-400 hover:text-zinc-950'
                          : 'border-zinc-800 bg-[#080808] text-zinc-400 hover:border-zinc-700 hover:text-white'
                      }`}
                    >
                      {rank}
                      {/* Indicator dot if occupied by another title and not selected */}
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
                <div className={`mt-2.5 p-2.5 border font-mono text-xs flex items-start gap-2 ${
                  isLight
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-amber-950/30 border-amber-800/70 text-amber-300'
                }`}>
                  <span className="font-bold shrink-0">⚠️ TRANSFER NOTICE:</span>
                  <div>
                    Rank <span className="font-bold">#{topRank}</span> is currently held by <span className="font-bold">"{occupiedRanks.get(topRank)!.title}"</span>.
                    <span className="opacity-80 block text-[11px] mt-0.5">
                      Saving will reassign Rank #{topRank} to this title and unrank "{occupiedRanks.get(topRank)!.title}" (restricting each rank to one title).
                    </span>
                  </div>
                </div>
              )}

              {/* Taken ranks list */}
              {occupiedRanks.size > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                  <span className={`font-mono text-[9px] uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>
                    Taken:
                  </span>
                  {Array.from(occupiedRanks.entries())
                    .sort(([a], [b]) => a - b)
                    .map(([r, item]) => (
                      <span
                        key={r}
                        className={`font-mono text-[10px] px-1.5 py-0.5 border ${
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

              <p className={`font-mono text-[10px] mt-2 ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>
                Top 10 favorites list restricts each rank (1-10) to strictly one title. Selecting a taken rank will transfer it to this title.
              </p>
            </div>

            {/* Action Buttons */}
            <div className={`pt-4 border-t flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
              isLight ? 'border-zinc-200' : 'border-zinc-900'
            }`}>
              {onDelete ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className={`font-mono text-xs border px-4 py-2.5 transition-colors tracking-wider cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto shrink-0 ${
                    isLight
                      ? 'text-red-600 hover:text-red-700 border-red-300 hover:border-red-500 bg-red-50 hover:bg-red-100/80'
                      : 'text-red-400 hover:text-red-300 border-red-900/60 hover:border-red-600 bg-red-950/20 hover:bg-red-950/40'
                  }`}
                >
                  <span>[!]</span>
                  <span>DELETE_TITLE</span>
                </button>
              ) : (
                <div className="hidden sm:block" />
              )}

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onBack}
                  className={`flex-1 sm:flex-initial text-center font-mono text-xs border px-5 py-2.5 transition-colors tracking-wider cursor-pointer ${
                    isLight
                      ? 'border-zinc-300 hover:border-zinc-500 text-zinc-700 hover:text-zinc-950 bg-zinc-50'
                      : 'border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white'
                  }`}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className={`flex-1 sm:flex-initial text-center font-mono text-xs font-bold px-6 py-2.5 transition-colors tracking-wider cursor-pointer whitespace-nowrap ${
                    isLight
                      ? 'bg-zinc-950 hover:bg-zinc-800 text-white shadow-xs'
                      : 'bg-white hover:bg-zinc-200 text-black'
                  }`}
                >
                  SAVE_CHANGES
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal (Rendered directly into body via Portal to guarantee viewport centering) */}
      {showDeleteConfirm && createPortal(
        <div className={`fixed inset-0 z-[999] backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto ${
          isLight ? 'bg-black/40' : 'bg-black/80'
        }`}>
          {/* Backdrop dismiss */}
          <div className="fixed inset-0" onClick={() => !isDeleting && setShowDeleteConfirm(false)} />

          <div className={`p-5 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl relative space-y-4 my-auto z-10 border transition-colors ${
            isLight
              ? 'bg-white border-red-300 text-zinc-900 shadow-xl'
              : 'bg-[#090909] border-red-900/60 text-white shadow-2xl'
          }`}>
            {/* Computerized Corner Accents */}
            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-red-500 pointer-events-none" />
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-red-500 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-red-500 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-red-500 pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 font-mono text-xs tracking-wider ${
                isLight ? 'text-red-600' : 'text-red-400'
              }`}>
                <span className="text-red-500 font-bold">[!]</span>
                <span>DELETION_CONFIRMATION</span>
              </div>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className={`font-mono text-xs transition-colors cursor-pointer px-1 ${
                  isLight ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-500 hover:text-white'
                }`}
              >
                [ ESC ]
              </button>
            </div>

            <div>
              <h3 className={`font-bold text-base mb-1.5 break-words ${
                isLight ? 'text-zinc-950' : 'text-white'
              }`}>
                Delete "{anime.title}"?
              </h3>
              <p className={`text-xs font-mono leading-relaxed ${
                isLight ? 'text-zinc-600' : 'text-zinc-400'
              }`}>
                This will permanently remove this title, its progress, and rating from your library. This action cannot be undone.
              </p>
            </div>

            <div className={`flex items-center justify-end gap-3 pt-3 border-t ${
              isLight ? 'border-zinc-200' : 'border-zinc-900'
            }`}>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className={`font-mono text-xs border px-4 py-2 transition-colors cursor-pointer ${
                  isLight
                    ? 'border-zinc-300 hover:border-zinc-500 text-zinc-700 hover:text-zinc-950 bg-zinc-50'
                    : 'border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white'
                }`}
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  if (!onDelete) return
                  setIsDeleting(true)
                  await onDelete(anime.id)
                }}
                className="font-mono text-xs bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>DELETING...</span>
                  </>
                ) : (
                  <span>CONFIRM_DELETE</span>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
