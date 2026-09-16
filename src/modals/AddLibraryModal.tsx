import { useState, useEffect, useMemo } from 'react'
import { LibraryCategory } from '../types'
import { useTheme } from '../context/ThemeContext'
import { toast } from '../context/ToastContext'

interface AddLibraryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (cat: LibraryCategory) => void
  onDelete?: (cat: LibraryCategory) => Promise<void> | void
  libraryToEdit?: LibraryCategory | null
  mode?: 'all' | 'hero' | 'card'
  isOnlyLibrary?: boolean
  existingLibraries?: LibraryCategory[]
  isLight?: boolean
}

export default function AddLibraryModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  libraryToEdit,
  mode = 'all',
  isOnlyLibrary = false,
  existingLibraries = [],
  isLight: propIsLight,
}: AddLibraryModalProps) {
  const { theme } = useTheme()
  const isLight = propIsLight ?? (theme === 'light')

  const isEditing = Boolean(libraryToEdit)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [label, setLabel] = useState('')
  const [tag, setTag] = useState('')
  const [headline, setHeadline] = useState('')
  const [subhead, setSubhead] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'series' | 'movies'>('series')
  const [unitLabel, setUnitLabel] = useState('')
  const [hasManuallyEdited, setHasManuallyEdited] = useState(false)

  // Check if library label already exists (case-insensitive)
  const isDuplicateLabel = useMemo(() => {
    const clean = label.trim().toUpperCase()
    if (!clean) return false
    return existingLibraries.some(
      c => c.id !== libraryToEdit?.id && c.label.trim().toUpperCase() === clean
    )
  }, [label, existingLibraries, libraryToEdit])

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (!isOpen) return

    if (libraryToEdit) {
      setLabel(libraryToEdit.label)
      setTag(libraryToEdit.tag)
      setHeadline(libraryToEdit.headline)
      setSubhead(libraryToEdit.subhead)
      setDescription(libraryToEdit.description)
      setType(libraryToEdit.type)
      setUnitLabel(libraryToEdit.unitLabel ?? (libraryToEdit.type === 'movies' ? 'PARTS' : 'SEASONS'))
      setHasManuallyEdited(true)
    } else {
      setLabel('')
      setTag('')
      setHeadline('')
      setSubhead('')
      setDescription('')
      setType('series')
      setUnitLabel('SEASONS')
      setHasManuallyEdited(false)
    }
    setShowDeleteConfirm(false)
    setIsDeleting(false)
  }, [isOpen, libraryToEdit])

  // Lock background page scrolling while modal is open
  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen])

  // ESC key to close
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Auto-generate details as user types title (only in create mode when not manually edited)
  const handleLabelChange = (val: string) => {
    setLabel(val)
    if (!isEditing && !hasManuallyEdited) {
      const clean = val.trim()
      if (clean) {
        const generatedTag = clean.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 16)
        setTag(generatedTag || 'NEW_LIBRARY')
        setHeadline(`Your ${clean.toLowerCase()}`)
        setSubhead('diary.')
        setDescription(`Track, rate & log every ${clean.toLowerCase()} in your collection. Minimal. Honest. Yours.`)
      } else {
        setTag('')
        setHeadline('')
        setSubhead('')
        setDescription('')
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const finalLabel = (label.trim() || libraryToEdit?.label || '').toUpperCase()
    if (!finalLabel) {
      toast.error('ERR: LIBRARY_TITLE_REQUIRED')
      return
    }
    if (finalLabel.length < 2 || finalLabel.length > 30) {
      toast.error('ERR: LIBRARY_TITLE_MUST_BE_2_TO_30_CHARS')
      return
    }

    if (isDuplicateLabel) {
      toast.error(`ERR: A library named "${finalLabel}" already exists`)
      return
    }

    const finalTag = (tag.trim() || libraryToEdit?.tag || finalLabel).toUpperCase().replace(/[^A-Z0-9]/g, '_')
    if (finalTag.length > 20) {
      toast.error('ERR: TAG_EXCEEDS_20_CHARS')
      return
    }

    if (headline.trim().length > 40) {
      toast.error('ERR: HEADLINE_EXCEEDS_40_CHARS')
      return
    }

    if (subhead.trim().length > 40) {
      toast.error('ERR: SUBHEAD_EXCEEDS_40_CHARS')
      return
    }

    if (description.trim().length > 160) {
      toast.error('ERR: DESCRIPTION_EXCEEDS_160_CHARS')
      return
    }

    const id = libraryToEdit
      ? libraryToEdit.id
      : finalLabel.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4)

    const finalType = type || libraryToEdit?.type || 'series'

    const updatedCategory: LibraryCategory = {
      id,
      label: finalLabel,
      tag: finalTag,
      headline: headline.trim() || libraryToEdit?.headline || `Your ${finalLabel.toLowerCase()}`,
      subhead: subhead.trim() || libraryToEdit?.subhead || (finalType === 'movies' ? 'cinema diary.' : 'series diary.'),
      description: description.trim() || libraryToEdit?.description || `Track, rate & log every item in your collection. Minimal. Honest. Yours.`,
      type: finalType,
      unitLabel: unitLabel || (finalType === 'movies' ? 'PARTS' : 'SEASONS'),
    }

    onSave(updatedCategory)
    onClose()
  }

  // Field sections
  const titleAndFormatFields = (
    <div className="space-y-5">
      {/* Field: Library Title */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={`block font-mono text-[9px] tracking-wider ${
            isDuplicateLabel ? 'text-red-500 font-bold' : isLight ? 'text-zinc-600' : 'text-zinc-500'
          }`}>
            LIBRARY_TITLE / NAME *
          </label>
          <span className={`font-mono text-[9px] ${
            isDuplicateLabel ? 'text-red-500 font-bold' : label.length > 25 ? 'text-amber-500 font-bold' : isLight ? 'text-zinc-500' : 'text-zinc-600'
          }`}>
            {label.length}/30
          </span>
        </div>
        <input
          type="text"
          value={label}
          onChange={e => handleLabelChange(e.target.value)}
          required={mode !== 'hero'}
          maxLength={30}
          placeholder="e.g. Manga, K-Drama, Video Games (2-30 chars)"
          className={`w-full font-medium text-sm px-3.5 py-2.5 outline-none transition-colors border ${
            isDuplicateLabel
              ? isLight
                ? 'bg-red-50/70 border-red-500 focus:border-red-600 text-red-950 placeholder-red-300'
                : 'bg-red-950/20 border-red-500 focus:border-red-400 text-white placeholder-red-800'
              : isLight
              ? 'bg-zinc-50 border-zinc-300 focus:border-zinc-800 text-zinc-900 placeholder-zinc-400'
              : 'bg-[#080808] border-zinc-800 focus:border-white text-white placeholder-zinc-600'
          }`}
        />
        {isDuplicateLabel ? (
          <span className="font-mono text-[9px] mt-1 block text-red-500 font-medium">
            ⚠ A library with this title already exists.
          </span>
        ) : (
          <span className={`font-mono text-[9px] mt-1 block ${isLight ? 'text-zinc-500' : 'text-zinc-600'}`}>
            This appears on your Library Channel cards in the directory.
          </span>
        )}
      </div>

      {/* Field: Classification Format (Series vs Movies) */}
      <div>
        <label className={`block font-mono text-[9px] tracking-wider mb-1.5 ${isLight ? 'text-zinc-600' : 'text-zinc-500'}`}>
          LIBRARY_FORMAT / CLASSIFICATION *
        </label>
        <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              setType('series')
              setUnitLabel('SEASONS')
            }}
            className={`p-3 border text-left transition-all duration-150 cursor-pointer ${
              type === 'series'
                ? isLight
                  ? 'border-zinc-950 bg-zinc-950 text-white font-bold shadow-sm'
                  : 'border-white bg-white text-black font-bold shadow-md'
                : isLight
                ? 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-400 hover:text-zinc-950'
                : 'border-zinc-800 bg-[#080808] text-zinc-400 hover:border-zinc-600 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="font-mono text-xs font-bold tracking-wider">● SERIES</span>
              <span className={`font-mono text-[8px] px-1 py-0.5 border whitespace-nowrap shrink-0 ${
                type === 'series'
                  ? isLight ? 'border-zinc-400 text-zinc-300' : 'border-black text-black'
                  : isLight ? 'border-zinc-300 text-zinc-500' : 'border-zinc-800 text-zinc-500'
              }`}>
                TV / SHOWS
              </span>
            </div>
            <p className={`font-mono text-[9px] mt-1 leading-normal ${
              type === 'series'
                ? isLight ? 'text-zinc-300' : 'text-zinc-800'
                : isLight ? 'text-zinc-500' : 'text-zinc-600'
            }`}>
              Tracks seasons finished + companion movies in series
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setType('movies')
              setUnitLabel('PARTS')
            }}
            className={`p-3 border text-left transition-all duration-150 cursor-pointer ${
              type === 'movies'
                ? isLight
                  ? 'border-zinc-950 bg-zinc-950 text-white font-bold shadow-sm'
                  : 'border-white bg-white text-black font-bold shadow-md'
                : isLight
                ? 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-400 hover:text-zinc-950'
                : 'border-zinc-800 bg-[#080808] text-zinc-400 hover:border-zinc-600 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="font-mono text-xs font-bold tracking-wider">▲ MOVIES</span>
              <span className={`font-mono text-[8px] px-1 py-0.5 border whitespace-nowrap shrink-0 ${
                type === 'movies'
                  ? isLight ? 'border-zinc-400 text-zinc-300' : 'border-black text-black'
                  : isLight ? 'border-zinc-300 text-zinc-500' : 'border-zinc-800 text-zinc-500'
              }`}>
                CINEMA / FILMS
              </span>
            </div>
            <p className={`font-mono text-[9px] mt-1 leading-normal ${
              type === 'movies'
                ? isLight ? 'text-zinc-300' : 'text-zinc-800'
                : isLight ? 'text-zinc-500' : 'text-zinc-600'
            }`}>
              Tracks feature films & franchise parts
            </p>
          </button>
        </div>
      </div>
    </div>
  )

  const heroFields = (
    <div className="space-y-5">
      {/* Field: Tag */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={`block font-mono text-[9px] tracking-wider ${isLight ? 'text-zinc-600' : 'text-zinc-500'}`}>
            SYSTEM_TAG [APPEARS ON TOP OF TITLE]
          </label>
          <span className={`font-mono text-[9px] ${tag.length > 16 ? 'text-amber-500 font-bold' : isLight ? 'text-zinc-500' : 'text-zinc-600'}`}>
            {tag.length}/20
          </span>
        </div>
        <input
          type="text"
          value={tag}
          maxLength={20}
          onChange={e => {
            setTag(e.target.value)
            setHasManuallyEdited(true)
          }}
          placeholder="e.g. MANGA_READS"
          className={`w-full font-mono text-xs px-3 py-2 outline-none transition-colors uppercase tracking-wider border ${
            isLight
              ? 'bg-zinc-50 border-zinc-300 focus:border-zinc-800 text-zinc-900 placeholder-zinc-400'
              : 'bg-[#080808] border-zinc-800 focus:border-white text-zinc-300 placeholder-zinc-600'
          }`}
        />
      </div>

      {/* Row: Headline & Subhead */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={`block font-mono text-[9px] tracking-wider ${isLight ? 'text-zinc-600' : 'text-zinc-500'}`}>
              HERO_HEADLINE [TOP LINE]
            </label>
            <span className={`font-mono text-[9px] ${headline.length > 32 ? 'text-amber-500 font-bold' : isLight ? 'text-zinc-500' : 'text-zinc-600'}`}>
              {headline.length}/40
            </span>
          </div>
          <input
            type="text"
            value={headline}
            maxLength={40}
            onChange={e => {
              setHeadline(e.target.value)
              setHasManuallyEdited(true)
            }}
            placeholder="e.g. Your manga"
            className={`w-full font-medium text-xs px-3 py-2 outline-none transition-colors border ${
              isLight
                ? 'bg-zinc-50 border-zinc-300 focus:border-zinc-800 text-zinc-900 placeholder-zinc-400'
                : 'bg-[#080808] border-zinc-800 focus:border-white text-white placeholder-zinc-600'
            }`}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={`block font-mono text-[9px] tracking-wider ${isLight ? 'text-zinc-600' : 'text-zinc-500'}`}>
              HERO_SUBHEAD [MUTED SECOND LINE]
            </label>
            <span className={`font-mono text-[9px] ${subhead.length > 32 ? 'text-amber-500 font-bold' : isLight ? 'text-zinc-500' : 'text-zinc-600'}`}>
              {subhead.length}/40
            </span>
          </div>
          <input
            type="text"
            value={subhead}
            maxLength={40}
            onChange={e => {
              setSubhead(e.target.value)
              setHasManuallyEdited(true)
            }}
            placeholder="e.g. reading diary."
            className={`w-full font-medium text-xs px-3 py-2 outline-none transition-colors border ${
              isLight
                ? 'bg-zinc-50 border-zinc-300 focus:border-zinc-800 text-zinc-700 placeholder-zinc-400'
                : 'bg-[#080808] border-zinc-800 focus:border-white text-zinc-400 placeholder-zinc-600'
            }`}
          />
        </div>
      </div>

      {/* Field: Description */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={`block font-mono text-[9px] tracking-wider ${isLight ? 'text-zinc-600' : 'text-zinc-500'}`}>
            HERO_DESCRIPTION_TEXT
          </label>
          <span className={`font-mono text-[9px] ${description.length > 140 ? 'text-amber-500 font-bold' : isLight ? 'text-zinc-500' : 'text-zinc-600'}`}>
            {description.length}/160
          </span>
        </div>
        <textarea
          rows={2}
          value={description}
          maxLength={160}
          onChange={e => {
            setDescription(e.target.value)
            setHasManuallyEdited(true)
          }}
          placeholder="Track, rate & log every title in your collection. Minimal. Honest. Yours."
          className={`w-full font-mono text-xs px-3 py-2 outline-none transition-colors resize-none leading-relaxed border ${
            isLight
              ? 'bg-zinc-50 border-zinc-300 focus:border-zinc-800 text-zinc-900 placeholder-zinc-400'
              : 'bg-[#080808] border-zinc-800 focus:border-white text-zinc-300 placeholder-zinc-600'
          }`}
        />
      </div>

      {/* Live Hero Text Preview */}
      <div className={`p-4 border relative ${
        isLight ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-900 bg-zinc-950/70'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`font-mono text-[8px] tracking-widest uppercase ${
            isLight ? 'text-zinc-500' : 'text-zinc-600'
          }`}>
            LIVE_HERO_PREVIEW
          </span>
          <span className={`font-mono text-[8px] ${isLight ? 'text-zinc-500' : 'text-zinc-700'}`}>REALTIME</span>
        </div>

        <div className="space-y-1">
          <span className={`font-mono text-[10px] tracking-wider block ${
            isLight ? 'text-zinc-500' : 'text-zinc-600'
          }`}>
            {tag.trim().toUpperCase() || 'TAG_NAME'}
          </span>
          <h3 className={`text-xl sm:text-2xl font-bold tracking-tight leading-tight ${
            isLight ? 'text-zinc-950' : 'text-white'
          }`}>
            {headline.trim() || 'Your title'}<br />
            <span className={isLight ? 'text-zinc-500' : 'text-zinc-500'}>{subhead.trim() || 'collection diary.'}</span>
          </h3>
          <p className={`font-mono text-[10px] leading-relaxed pt-1 ${
            isLight ? 'text-zinc-600' : 'text-zinc-500'
          }`}>
            {description.trim() || 'Track, rate & log your titles. Minimal. Honest. Yours.'}
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`fixed inset-0 z-50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 overflow-y-auto fade-in ${
      isLight ? 'bg-black/40' : 'bg-black/85'
    }`}>
      {/* Backdrop click dismiss */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog Container: constrained height, internally scrollable */}
      <div className={`relative w-full ${mode === 'card' ? 'max-w-lg' : 'max-w-2xl'} max-h-[92dvh] sm:max-h-[90vh] flex flex-col border p-3.5 sm:p-7 z-10 my-auto transition-colors duration-200 overflow-hidden ${
        isLight
          ? 'bg-white border-zinc-300 shadow-2xl text-zinc-900'
          : 'bg-[#090909] border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.9)] text-white'
      }`}>
        {/* Computerized Corner Accents */}
        <div className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 pointer-events-none ${isLight ? 'border-zinc-950' : 'border-white'}`} />
        <div className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 pointer-events-none ${isLight ? 'border-zinc-950' : 'border-white'}`} />
        <div className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 pointer-events-none ${isLight ? 'border-zinc-950' : 'border-white'}`} />
        <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 pointer-events-none ${isLight ? 'border-zinc-950' : 'border-white'}`} />

        {/* Modal Header */}
        <div className={`shrink-0 flex items-center justify-between pb-3 sm:pb-4 border-b mb-3 sm:mb-4 ${
          isLight ? 'border-zinc-200' : 'border-zinc-900'
        }`}>
          <div className="min-w-0 pr-2">
            <h2 className={`font-mono text-base sm:text-lg font-bold tracking-wide mt-0.5 truncate ${
              isLight ? 'text-zinc-950' : 'text-white'
            }`}>
              {mode === 'hero' ? 'EDIT SYSTEM TAG & HERO' : mode === 'card' ? 'EDIT TITLE & FORMAT' : isEditing ? 'EDIT LIBRARY DETAILS' : 'ADD NEW LIBRARY'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`shrink-0 font-mono text-xs px-2.5 py-1 border transition-colors cursor-pointer ${
              isLight
                ? 'text-zinc-600 hover:text-zinc-950 border-zinc-300 hover:border-zinc-500 bg-zinc-50'
                : 'text-zinc-500 hover:text-white border-zinc-800 hover:border-zinc-600'
            }`}
          >
            [ ESC ]
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="overflow-y-auto flex-1 pr-1 sm:pr-2 scrollbar-thin">
          <form id="add-library-form" onSubmit={handleSubmit} className="space-y-5">
            {mode === 'card' ? (
              /* When editing from library card: ONLY library title and library format */
              titleAndFormatFields
            ) : mode === 'hero' ? (
              /* When editing from System Tag: Priority to System Tag, Headline, Subhead, Description & Live Preview */
              <>
                {heroFields}
                <details className={`pt-2 border-t font-mono text-[10px] ${isLight ? 'border-zinc-200 text-zinc-600' : 'border-zinc-800 text-zinc-400'}`}>
                  <summary className="cursor-pointer py-1 select-none font-bold hover:underline">
                    EDIT_LIBRARY_TITLE_&_FORMAT (OPTIONAL)
                  </summary>
                  <div className="pt-3">
                    {titleAndFormatFields}
                  </div>
                </details>
              </>
            ) : (
              /* Add new library: standard full sequence */
              <>
                {titleAndFormatFields}
                {heroFields}
              </>
            )}
          </form>
        </div>

        {/* Modal Footer */}
        <div className={`shrink-0 pt-4 border-t flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 mt-3 transition-colors ${
          isLight ? 'border-zinc-200 bg-white' : 'border-zinc-900 bg-[#090909]'
        }`}>
          {isEditing && onDelete ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className={`font-mono text-xs px-3.5 py-2.5 border transition-colors cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto shrink-0 ${
                isLight
                  ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300'
                  : 'border-red-900/60 bg-red-950/30 text-red-400 hover:bg-red-950/60 hover:border-red-800'
              }`}
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>DELETE_LIBRARY</span>
            </button>
          ) : (
            <div className="hidden sm:block" />
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 sm:flex-initial text-center font-mono text-xs border px-4 py-2.5 transition-colors tracking-wider cursor-pointer ${
                isLight
                  ? 'border-zinc-300 hover:border-zinc-500 text-zinc-700 hover:text-black bg-zinc-50'
                  : 'border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white'
              }`}
            >
              CANCEL
            </button>
            <button
              type="submit"
              form="add-library-form"
              disabled={isDuplicateLabel}
              className={`flex-1 sm:flex-initial text-center font-mono text-xs font-bold px-4 sm:px-5 py-2.5 transition-colors tracking-wider shadow-sm whitespace-nowrap ${
                isDuplicateLabel
                  ? 'opacity-50 cursor-not-allowed bg-zinc-700 text-zinc-400'
                  : isLight
                  ? 'bg-zinc-900 hover:bg-black text-white cursor-pointer'
                  : 'bg-white hover:bg-zinc-200 text-black cursor-pointer'
              }`}
            >
              {isEditing ? 'SAVE_CHANGES' : '+ CREATE_LIBRARY'}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && libraryToEdit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-md border p-6 shadow-2xl transition-colors ${
            isLight ? 'bg-white border-zinc-300 text-zinc-900' : 'bg-[#0a0a0a] border-zinc-800 text-white'
          }`}>
            <h3 className="text-base sm:text-lg font-bold tracking-tight mb-2">
              Delete Library "{libraryToEdit.label}"?
            </h3>
            <p className={`font-mono text-xs leading-relaxed mb-3 ${
              isLight ? 'text-zinc-600' : 'text-zinc-400'
            }`}>
              This will permanently delete this library and all titles currently inside it.
            </p>

            {isOnlyLibrary && (
              <div className={`p-3 border mb-4 font-mono text-[11px] leading-relaxed flex items-start gap-2 ${
                isLight
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-amber-950/30 border-amber-800/70 text-amber-300'
              }`}>
                <span className="font-bold shrink-0">⚠️ NOTICE:</span>
                <span>
                  This is your only library. Deleting it will automatically create a clean, empty default library (<strong>MY LIST</strong>) containing 0 titles so you always have a collection.
                </span>
              </div>
            )}

            <div className={`flex items-center justify-end gap-2.5 pt-3 border-t ${
              isLight ? 'border-zinc-200' : 'border-zinc-800'
            }`}>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className={`font-mono text-xs border px-4 py-2 transition-colors cursor-pointer ${
                  isLight
                    ? 'border-zinc-300 hover:border-zinc-500 text-zinc-700 hover:text-black bg-zinc-50'
                    : 'border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white'
                }`}
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  if (!onDelete || !libraryToEdit) return
                  setIsDeleting(true)
                  try {
                    await onDelete(libraryToEdit)
                    setShowDeleteConfirm(false)
                    onClose()
                  } finally {
                    setIsDeleting(false)
                  }
                }}
                className={`font-mono text-xs font-bold px-4 py-2 border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isLight
                    ? 'bg-red-600 hover:bg-red-700 text-white border-red-700 shadow-xs'
                    : 'bg-red-950/80 hover:bg-red-900 text-red-200 border-red-800'
                }`}
              >
                {isDeleting ? 'DELETING...' : 'CONFIRM_DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
