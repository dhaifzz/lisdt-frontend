import { LibraryCategory, Anime } from '../../types'
import { Stats } from '../list/Stats'
import { ProfileCard } from './ProfileCard'

interface ProfileHeroProps {
  currentCategoryConfig: LibraryCategory | null
  categoryItems: Anime[]
  onEditLibrary: () => void
  username?: string
  avatarUrl?: string
  onAvatarUpdate?: (url: string) => void
  isLight?: boolean
}

export function ProfileHero({
  currentCategoryConfig,
  categoryItems,
  onEditLibrary,
  username,
  avatarUrl,
  onAvatarUpdate,
  isLight = false,
}: ProfileHeroProps) {
  const tag      = currentCategoryConfig?.tag      ?? 'MY_LIBRARY'
  const headline = currentCategoryConfig?.headline  ?? 'Your personal'
  const subhead  = currentCategoryConfig?.subhead   ?? 'media diary.'
  const desc     = currentCategoryConfig?.description ?? 'Add your first library collection to get started. Track, rate & log everything you watch.'
  const label    = currentCategoryConfig?.label     ?? 'COLLECTION'

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-8">
      <div className="flex flex-row items-center justify-between gap-4 sm:gap-8">
        {/* Left: Dynamic Headline */}
        <div className="flex flex-col items-start min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`font-mono text-[11px] sm:text-xs tracking-wider select-none uppercase font-semibold ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
              {tag}
            </span>
            <button
              id="btn-edit-current-library"
              onClick={onEditLibrary}
              className={`font-mono text-[9px] px-1.5 py-0.5 transition-colors cursor-pointer border ${
                isLight
                  ? 'border-zinc-300 text-zinc-600 hover:text-zinc-950 hover:border-zinc-500 bg-white shadow-xs'
                  : 'border-zinc-900 hover:border-zinc-700 text-zinc-600 hover:text-white'
              }`}
              title="Edit library details"
            >
              [ ✏ EDIT ]
            </button>
          </div>
          <h1 className={`text-2xl sm:text-4xl font-bold tracking-tight leading-tight ${isLight ? 'text-zinc-950' : 'text-white'}`}>
            {headline}<br />
            <span className={isLight ? 'text-zinc-500' : 'text-zinc-500'}>{subhead}</span>
          </h1>
          <p className={`font-mono text-[10px] sm:text-[11px] mt-2 sm:mt-3 leading-relaxed ${isLight ? 'text-zinc-600' : 'text-zinc-600'}`}>
            {desc}
          </p>
        </div>

        {/* Right: Profile card */}
        <ProfileCard
          username={username || '@curator'}
          avatarUrl={avatarUrl}
          onAvatarUpdate={onAvatarUpdate}
          isLight={isLight}
        />
      </div>

      {/* Dynamic Category Stats */}
      <div className={`mt-8 pt-6 border-t ${isLight ? 'border-zinc-200' : 'border-zinc-900'}`}>
        <div className="flex items-center justify-between mb-4">
          <p className={`font-mono text-[9px] tracking-widest ${isLight ? 'text-zinc-500' : 'text-zinc-700'}`}>
            STATISTICS · {label}
          </p>
          <span className={`font-mono text-[9px] ${isLight ? 'text-zinc-500' : 'text-zinc-700'}`}>
            TOTAL: {categoryItems.length}
          </span>
        </div>
        <Stats list={categoryItems} isLight={isLight} />
      </div>
    </section>
  )
}
