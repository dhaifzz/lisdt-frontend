import { useState, useMemo, useEffect } from 'react'

// -- Layout
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'

// -- Profile
import { ProfileHero } from './components/profile/ProfileHero'

// -- Library
import { LibraryHub } from './components/library/LibraryHub'
import { MediaCard, MediaCardSkeleton } from './components/library/MediaCard'

// -- List
import { Controls } from './components/list/Controls'
import { Stepper } from './components/list/Stepper'

// -- Modals
import AddTitleModal from './modals/AddTitleModal'
import AddLibraryModal from './modals/AddLibraryModal'

// -- Views
import EditAnimeView from './views/EditAnimeView'
import SignInView from './views/SignInView'
import SignUpView from './views/SignUpView'
import LandingPageView from './views/LandingPageView'
import SettingsView from './views/SettingsView'
import VerifyEmailPendingView from './views/VerifyEmailPendingView'
import VerifyEmailView from './views/VerifyEmailView'
import ResetPasswordView from './views/ResetPasswordView'
import { toast } from './context/ToastContext'
import { useTheme } from './context/ThemeContext'

// -- Data & Types
import { categoryApi, mediaApi, removeToken, getToken, ApiCategory, ApiMediaItem } from './lib/api'
import { Anime, FilterStatus, SortOption, MediaCategory, LibraryCategory } from './types'

// -----------------------------------------------------------------------------

const TITLES_PER_PAGE = 50

type AppRoute =
  | { type: 'landing' }
  | { type: 'library' }
  | { type: 'signin' }
  | { type: 'signup' }
  | { type: 'edit'; id: number }
  | { type: 'settings' }
  | { type: 'verify-email-pending' }
  | { type: 'verify-email' }
  | { type: 'reset-password' }

function parsePath(pathname: string): AppRoute {
  const cleanPath = pathname.replace(/\/+$/, '') || '/'
  if (cleanPath === '/signin' || cleanPath === '/login') {
    return { type: 'signin' }
  }
  if (cleanPath === '/signup' || cleanPath === '/register' || cleanPath === '/create-account') {
    return { type: 'signup' }
  }
  if (cleanPath === '/verify-email-pending') {
    return { type: 'verify-email-pending' }
  }
  if (cleanPath.startsWith('/verify-email')) {
    return { type: 'verify-email' }
  }
  if (cleanPath.startsWith('/reset-password')) {
    return { type: 'reset-password' }
  }
  if (cleanPath === '/settings' || cleanPath === '/profile' || cleanPath === '/config') {
    return { type: 'settings' }
  }
  const editMatch = cleanPath.match(/^\/edit\/(\d+)$/)
  if (editMatch) {
    return { type: 'edit', id: Number(editMatch[1]) }
  }
  if (cleanPath === '/library' || cleanPath === '/app' || cleanPath === '/diary') {
    return { type: 'library' }
  }
  return { type: 'landing' }
}

export default function App() {
  const [categories, setCategories] = useState<LibraryCategory[]>([])
  const [mediaList, setMediaList] = useState<Anime[]>([])
  const [activeCategory, setActiveCategory] = useState<MediaCategory>('anime')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isAddLibraryModalOpen, setIsAddLibraryModalOpen] = useState(false)
  const [libraryToEdit, setLibraryToEdit] = useState<LibraryCategory | null>(null)
  const [libraryModalMode, setLibraryModalMode] = useState<'all' | 'hero' | 'card'>('all')

  // -- Routing state synced with window.location
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => parsePath(window.location.pathname))

  // -- Theme state (strictly scoped to library and settings)
  const { theme } = useTheme()
  const isLightActive = theme === 'light' && (currentRoute.type === 'library' || currentRoute.type === 'settings' || currentRoute.type === 'edit')

  useEffect(() => {
    if (isLightActive) {
      document.body.classList.add('theme-light-active')
    } else {
      document.body.classList.remove('theme-light-active')
    }
    return () => {
      document.body.classList.remove('theme-light-active')
    }
  }, [isLightActive])

  const navigate = (path: string, options?: { replace?: boolean }) => {
    if (window.location.pathname !== path) {
      if (options?.replace) {
        window.history.replaceState({}, '', path)
      } else {
        window.history.pushState({}, '', path)
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    setCurrentRoute(parsePath(path))
  }

  useEffect(() => {
    const handlePopState = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      setCurrentRoute(parsePath(window.location.pathname))
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [currentRoute])

  const [filter, setFilter] = useState<FilterStatus>('all')
  const [sort, setSort]     = useState<SortOption>('rating')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // -- User Authentication State
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    try {
      return localStorage.getItem('lisdt_user') || null
    } catch {
      return null
    }
  })
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(() => {
    try {
      return localStorage.getItem('lisdt_avatar') || null
    } catch {
      return null
    }
  })
  const [dataLoaded, setDataLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    try {
      return Boolean(getToken() && localStorage.getItem('lisdt_user'))
    } catch {
      return false
    }
  })

  const handleSignIn = (username: string, avatar?: string | null) => {
    setIsLoading(true)
    setCurrentUser(username)
    try {
      localStorage.setItem('lisdt_user', username)
    } catch {
      // ignore
    }
    if (avatar !== undefined) {
      setCurrentAvatar(avatar)
      try {
        if (avatar) localStorage.setItem('lisdt_avatar', avatar)
        else localStorage.removeItem('lisdt_avatar')
      } catch { /* ignore */ }
    }
    void loadUserData()
    navigate('/library')
  }

  const handleSignOut = () => {
    setCurrentUser(null)
    setCurrentAvatar(null)
    removeToken()
    setCategories([])
    setMediaList([])
    setDataLoaded(false)
    setIsLoading(false)
    try {
      localStorage.removeItem('lisdt_user')
      localStorage.removeItem('lisdt_avatar')
    } catch {
      // ignore
    }
  }

  const handleAvatarUpdate = (url: string) => {
    setCurrentAvatar(url)
    try {
      localStorage.setItem('lisdt_avatar', url)
    } catch { /* ignore */ }
  }

  // Map API category to LibraryCategory
  const mapCategory = (c: ApiCategory): LibraryCategory => ({
    id: c.slug,
    label: c.label,
    tag: c.tag,
    headline: c.headline,
    subhead: c.subhead,
    description: c.description,
    type: c.type,
    unitLabel: c.unitLabel ?? undefined,
  })

  // Map API media item to Anime type
  const mapMedia = (m: ApiMediaItem): Anime => ({
    id: m.id,
    category: m.category,
    title: m.title,
    year: m.year,
    rating: m.rating,
    status: m.status,
    studio: m.studio ?? undefined,
    cover: m.cover,
    seasonsFinished: m.seasonsFinished,
    parts: m.parts ?? undefined,
    moviesCount: m.moviesCount ?? undefined,
    topRank: m.topRank ?? undefined,
  })

  // Fetch all data for authenticated user
  const loadUserData = async () => {
    if (!getToken()) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const [catRes, mediaRes] = await Promise.all([
        categoryApi.list(),
        mediaApi.list(),
      ])
      const mappedCats = catRes.categories.map(mapCategory)
      setCategories(mappedCats)
      setMediaList(mediaRes.items.map(mapMedia))
      if (mappedCats.length > 0) setActiveCategory(mappedCats[0].id)
      setDataLoaded(true)
    } catch (err) {
      console.error('Failed to load user data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Load data on mount if user was previously signed in
  useEffect(() => {
    if (getToken() && currentUser && !dataLoaded) {
      void loadUserData()
    }
  }, [currentUser])
  // Current category configuration
  const currentCategoryConfig = useMemo(() => {
    return categories.find(c => c.id === activeCategory) ?? categories[0] ?? null
  }, [categories, activeCategory])

  // Active media item for Edit View
  const activeAnime = useMemo(() => {
    if (currentRoute.type === 'edit') {
      return mediaList.find(a => a.id === currentRoute.id) ?? null
    }
    return null
  }, [currentRoute, mediaList])

  // Items filtered by category, search, watch status, and sorted
  const categoryItems = useMemo(() => {
    return mediaList.filter(a => a.category === activeCategory)
  }, [mediaList, activeCategory])

  const filtered = useMemo(() => {
    let list = [...categoryItems]
    if (filter !== 'all') list = list.filter(a => a.status === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a => a.title.toLowerCase().includes(q))
    }

    // When sorting by rating with no active filters (status or search),
    // prioritize Top 1 to Top 10 in exact sequence 1..10, followed by highest rated to lowest
    const isDefaultRatingView = sort === 'rating' && filter === 'all' && !search.trim()

    list.sort((a, b) => {
      if (isDefaultRatingView) {
        const rankA = a.topRank && a.topRank >= 1 && a.topRank <= 10 ? a.topRank : null
        const rankB = b.topRank && b.topRank >= 1 && b.topRank <= 10 ? b.topRank : null

        // 1. Top 1-10 strictly prioritized in numerical sequence (1, 2, 3... 10)
        if (rankA !== null && rankB !== null) {
          return rankA - rankB
        }
        if (rankA !== null) return -1
        if (rankB !== null) return 1

        // 2. All other titles ordered by highest rated to lowest, then year, then name
        const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0)
        if (ratingDiff !== 0) return ratingDiff
        const yearDiff = b.year - a.year
        if (yearDiff !== 0) return yearDiff
        return a.title.localeCompare(b.title)
      }

      // Explicit sort by rating (when filtered by status or search):
      if (sort === 'rating') {
        const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0)
        if (ratingDiff !== 0) return ratingDiff
        return a.title.localeCompare(b.title)
      }

      // Explicit sort by year:
      if (sort === 'year') {
        const yearDiff = b.year - a.year
        if (yearDiff !== 0) return yearDiff
        return a.title.localeCompare(b.title)
      }

      // Explicit sort by name / title:
      if (sort === 'title') {
        return a.title.localeCompare(b.title)
      }

      return a.title.localeCompare(b.title)
    })
    return list
  }, [categoryItems, filter, sort, search])

  // Handlers
  const handleSelectCategory = (cat: MediaCategory) => {
    setActiveCategory(cat)
    setCurrentPage(1)
    setSearch('')
    setFilter('all')
    setSort('rating')
  }

  const handleFilter = (f: FilterStatus) => {
    setFilter(f)
    setCurrentPage(1)
  }

  const handleSearch = (s: string) => {
    setSearch(s)
    setCurrentPage(1)
  }

  const handleSort = (s: SortOption) => {
    setSort(s)
    setCurrentPage(1)
  }

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / TITLES_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * TITLES_PER_PAGE
  const endIndex = startIndex + TITLES_PER_PAGE
  const paginatedList = filtered.slice(startIndex, endIndex)

  const handlePageChange = (p: number) => {
    setCurrentPage(p)
    window.scrollTo({ top: 400, behavior: 'smooth' })
  }

  const handleSaveAnime = async (updated: Anime) => {
    try {
      const res = await mediaApi.update(updated.id, {
        category: updated.category,
        title: updated.title,
        year: updated.year,
        rating: updated.rating,
        status: updated.status,
        studio: updated.studio,
        cover: updated.cover,
        seasonsFinished: updated.seasonsFinished,
        parts: updated.parts,
        moviesCount: updated.moviesCount,
        topRank: updated.topRank ?? null,
      })
      const mapped = mapMedia(res.item)
      const previousHolder = mapped.topRank
        ? mediaList.find(a => a.id !== mapped.id && a.topRank === mapped.topRank)
        : null

      setMediaList(prev => prev.map(a => {
        if (a.id === mapped.id) return mapped
        if (mapped.topRank && a.topRank === mapped.topRank) {
          return { ...a, topRank: null }
        }
        return a
      }))

      if (previousHolder) {
        toast.info(`Rank #${mapped.topRank} transferred from "${previousHolder.title}" to "${mapped.title}"`)
      } else {
        toast.success('CHANGES_SAVED_SUCCESSFULLY')
      }
    } catch (err) {
      console.error('Failed to save media item:', err)
      toast.error('FAILED_TO_SAVE_MEDIA_ITEM')
    }
  }

  const handleAddTitle = async (newItem: Anime) => {
    try {
      const res = await mediaApi.create({
        category: newItem.category,
        title: newItem.title,
        year: newItem.year,
        rating: newItem.rating,
        status: newItem.status,
        studio: newItem.studio,
        cover: newItem.cover,
        seasonsFinished: newItem.seasonsFinished,
        parts: newItem.parts,
        moviesCount: newItem.moviesCount,
        topRank: newItem.topRank ?? null,
      })
      const mapped = mapMedia(res.item)
      const previousHolder = mapped.topRank
        ? mediaList.find(a => a.topRank === mapped.topRank)
        : null

      setMediaList(prev => {
        const cleared = prev.map(a => {
          if (mapped.topRank && a.topRank === mapped.topRank) {
            return { ...a, topRank: null }
          }
          return a
        })
        return [mapped, ...cleared]
      })
      setActiveCategory(mapped.category)
      setFilter('all')
      setSearch('')
      setCurrentPage(1)
      if (previousHolder) {
        toast.info(`Rank #${mapped.topRank} transferred from "${previousHolder.title}" to "${mapped.title}"`)
      }
      toast.success(`ADDED: "${mapped.title}"`)
    } catch (err) {
      console.error('Failed to add media item:', err)
      toast.error('FAILED_TO_ADD_MEDIA_ITEM')
    }
  }

  const handleDeleteAnime = async (id: number) => {
    try {
      await mediaApi.delete(id)
      setMediaList(prev => prev.filter(a => a.id !== id))
      toast.success('TITLE_DELETED_SUCCESSFULLY')
      navigate('/library')
    } catch (err) {
      console.error('Failed to delete media item:', err)
      toast.error('FAILED_TO_DELETE_TITLE')
    }
  }

  const handleSaveLibrary = async (saved: LibraryCategory) => {
    try {
      // Find the matching API category by slug
      const existing = categories.find(c => c.id === saved.id)
      if (existing) {
        // Need the real DB id - refetch to sync
        const catRes = await categoryApi.list()
        const dbCat = catRes.categories.find(c => c.slug === saved.id)
        if (dbCat) {
          await categoryApi.update(dbCat.id, {
            label: saved.label,
            tag: saved.tag,
            headline: saved.headline,
            subhead: saved.subhead,
            description: saved.description,
            type: saved.type,
            unitLabel: saved.unitLabel,
          })
        }
        setCategories(prev => prev.map(c => c.id === saved.id ? saved : c))
      } else {
        const res = await categoryApi.create({
          slug: saved.id,
          label: saved.label,
          tag: saved.tag,
          headline: saved.headline,
          subhead: saved.subhead,
          description: saved.description,
          type: saved.type,
          unitLabel: saved.unitLabel,
        })
        const mapped = mapCategory(res.category)
        setCategories(prev => [...prev, mapped])
      }
      setActiveCategory(saved.id)
      setCurrentPage(1)
      setFilter('all')
      setSearch('')
      toast.success(`LIBRARY_VAULT_SAVED: ${saved.label}`)
    } catch (err) {
      console.error('Failed to save library:', err)
      toast.error('FAILED_TO_SAVE_LIBRARY')
    }
  }

  const handleDeleteLibrary = async (categoryToDelete: LibraryCategory) => {
    try {
      const catRes = await categoryApi.list()
      const dbCat = catRes.categories.find(c => c.slug === categoryToDelete.id || c.id === categoryToDelete.id)
      if (!dbCat) {
        toast.error('LIBRARY_NOT_FOUND')
        return
      }

      const res = await categoryApi.delete(dbCat.id)

      // Remove all media items categorized under this library
      setMediaList(prev => prev.filter(a => a.category !== categoryToDelete.id && a.category !== dbCat.slug))

      // If all libraries were deleted, backend automatically initializes a default empty library
      if (res.defaultCategory) {
        const defaultCat = mapCategory(res.defaultCategory)
        setCategories([defaultCat])
        setActiveCategory(defaultCat.id)
        toast.info('Default empty library "MY LIST" initialized')
      } else {
        const remaining = categories.filter(c => c.id !== categoryToDelete.id)
        setCategories(remaining)
        if (activeCategory === categoryToDelete.id && remaining.length > 0) {
          setActiveCategory(remaining[0].id)
        }
      }

      setCurrentPage(1)
      setFilter('all')
      setSearch('')
      toast.success(`LIBRARY "${categoryToDelete.label}" DELETED`)
    } catch (err) {
      console.error('Failed to delete library:', err)
      toast.error('FAILED_TO_DELETE_LIBRARY')
    }
  }

  // -- Landing Page View (at /)
  // If the user is already signed in, redirect away from landing to library
  if (currentRoute.type === 'landing') {
    if (currentUser) {
      navigate('/library', { replace: true })
      return null
    }
    return (
      <LandingPageView
        onExploreLibrary={() => navigate('/library')}
        onSignIn={() => navigate('/signin')}
        onSignUp={() => navigate('/signup')}
        onNavigateSettings={() => navigate('/settings')}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />
    )
  }

  // -- Authentication Views (Sign In & Sign Up with full URL routing)
  // Auth guard ? redirect to /signin for protected routes
  if (!currentUser && (currentRoute.type === 'library' || currentRoute.type === 'edit' || currentRoute.type === 'settings')) {
    navigate('/signin', { replace: true })
    return null
  }

  if (currentRoute.type === 'signin') {
    return (
      <SignInView
        onBack={() => navigate('/')}
        onSignIn={handleSignIn}
        onNavigateSignUp={() => navigate('/signup')}
      />
    )
  }

  if (currentRoute.type === 'signup') {
    return (
      <SignUpView
        onBack={() => navigate('/')}
        onNavigateSignIn={() => navigate('/signin')}
        onNavigateVerifyPending={(email) => navigate(`/verify-email-pending?email=${encodeURIComponent(email)}`)}
      />
    )
  }

  if (currentRoute.type === 'verify-email-pending') {
    return (
      <VerifyEmailPendingView />
    )
  }

  if (currentRoute.type === 'verify-email') {
    return (
      <VerifyEmailView />
    )
  }

  if (currentRoute.type === 'reset-password') {
    return (
      <ResetPasswordView
        onNavigateSignIn={() => navigate('/signin')}
        onNavigateHome={() => navigate('/')}
      />
    )
  }

  // -- User Settings View (full-page swap with /settings URL routing)
  if (currentRoute.type === 'settings') {
    return (
      <SettingsView
        currentUser={currentUser}
        currentAvatar={currentAvatar}
        onBack={() => navigate('/library')}
        onNavigateHome={() => navigate('/')}
        onNavigateLibrary={() => navigate('/library')}
        onNavigateSettings={() => navigate('/settings')}
        onUpdateUser={(newUsername, newAvatar) => {
          setCurrentUser(newUsername)
          try {
            localStorage.setItem('lisdt_user', newUsername)
          } catch {}
          if (newAvatar !== undefined) {
            setCurrentAvatar(newAvatar)
            try {
              if (newAvatar) localStorage.setItem('lisdt_avatar', newAvatar)
              else localStorage.removeItem('lisdt_avatar')
            } catch {}
          }
        }}
        onSignOut={handleSignOut}
      />
    )
  }

  // -- Edit / Detail View (full-page swap with /edit/:id URL routing)
  if (activeAnime) {
    return (
      <EditAnimeView
        anime={activeAnime}
        mediaList={mediaList}
        onSave={handleSaveAnime}
        onDelete={handleDeleteAnime}
        onBack={() => navigate('/library')}
        categories={categories}
        isLight={isLightActive}
      />
    )
  }

  const isLight = isLightActive

  return (
    <div className={`min-h-screen w-full transition-colors duration-200 ${isLight ? 'bg-[#f5f5f7] text-zinc-900' : 'bg-[#080808] text-white'}`}>
      <Header
        onNavigateHome={() => navigate('/')}
        onNavigateLibrary={() => navigate('/library')}
        onNavigateSignIn={() => navigate('/signin')}
        onNavigateSignUp={() => navigate('/signup')}
        onNavigateSettings={() => navigate('/settings')}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        activeRoute="library"
        isLight={isLight}
      />

      {/* -- Hero & Profile Section -- */}
      <ProfileHero
        currentCategoryConfig={currentCategoryConfig}
        categoryItems={categoryItems}
        username={currentUser || '@curator'}
        avatarUrl={currentAvatar ?? undefined}
        onAvatarUpdate={handleAvatarUpdate}
        onEditLibrary={() => {
          setLibraryToEdit(currentCategoryConfig)
          setLibraryModalMode('hero')
          setIsAddLibraryModalOpen(true)
        }}
        isLight={isLight}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className={`border-t ${isLight ? 'border-zinc-200' : 'border-zinc-900'}`} />
      </div>

      {/* -- Library Hub & List Section -- */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24">
        {/* Library Channel Directory */}
        <LibraryHub
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
          items={mediaList}
          categories={categories}
          isLoading={isLoading}
          onOpenAddLibrary={() => {
            setLibraryToEdit(null)
            setLibraryModalMode('all')
            setIsAddLibraryModalOpen(true)
          }}
          onEditLibrary={(cat) => {
            setLibraryToEdit(cat)
            setLibraryModalMode('card')
            setIsAddLibraryModalOpen(true)
          }}
          isLight={isLight}
        />

        {/* Active List */}
        <div className={`border-t pt-6 ${isLight ? 'border-zinc-200' : 'border-zinc-900'}`}>
          <div className="flex items-center justify-between mb-4 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <p className={`font-mono text-[9px] sm:text-[10px] tracking-widest truncate ${isLight ? 'text-zinc-500' : 'text-zinc-700'}`}>
                ACTIVE LIST: {(currentCategoryConfig?.label ?? 'MY LIST')}
              </p>
              <span className={`font-mono text-[9px] hidden sm:inline ${isLight ? 'text-zinc-500' : 'text-zinc-600'}`}>
              · {filtered.length} TITLES
              </span>
            </div>

            <button
              id="btn-open-add-modal"
              onClick={() => setIsAddModalOpen(true)}
              className={`font-mono text-xs font-bold px-3 py-1.5 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0 ${
                isLight
                  ? 'bg-zinc-900 hover:bg-black text-white'
                  : 'bg-white hover:bg-zinc-200 text-black'
              }`}
            >
              <span className="font-bold text-xs leading-none">+</span>
              <span>ADD_TITLE</span>
            </button>
          </div>

          <Controls
            filter={filter}
            setFilter={handleFilter}
            sort={sort}
            setSort={handleSort}
            search={search}
            setSearch={handleSearch}
            categoryLabel={(currentCategoryConfig?.label ?? 'MY LIST')}
            isLight={isLight}
          />

          <div className="mt-6">
            {isLoading ? (
              <>
                <div className={`flex items-center justify-between font-mono text-[10px] mb-4 animate-pulse ${
                  isLight ? 'text-zinc-500' : 'text-zinc-700'
                }`}>
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    <span>FETCHING_ARCHIVE_DATA...</span>
                  </span>
                  <span>SYNCHRONIZING</span>
                </div>

                {/* Media Grid Skeleton - 3 cols on mobile, 4-6 on larger screens */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <MediaCardSkeleton key={i} index={i} isLight={isLight} />
                  ))}
                </div>
              </>
            ) : filtered.length === 0 ? (
              <div className={`py-24 text-center border ${isLight ? 'border-zinc-200 bg-white/70' : 'border-zinc-900'}`}>
                <p className={`font-mono text-xs ${isLight ? 'text-zinc-600' : 'text-zinc-700'}`}>NO_RESULTS_FOUND</p>
                <p className={`font-mono text-[10px] mt-1 ${isLight ? 'text-zinc-400' : 'text-zinc-800'}`}>try a different search query or status filter</p>
              </div>
            ) : (
              <>
                <div className={`flex items-center justify-between font-mono text-[10px] mb-4 ${isLight ? 'text-zinc-500' : 'text-zinc-700'}`}>
                  <span>
                    PAGE {safePage} / {totalPages} · {filtered.length} TITLES
                  </span>
                  <span>50 / PAGE · CLICK TO EDIT</span>
                </div>

                {/* Media Grid - 3 cols on mobile, 4-6 on larger screens */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4">
                  {paginatedList.map((anime, i) => (
                    <MediaCard
                      key={anime.id}
                      anime={anime}
                      index={startIndex + i}
                      categories={categories}
                      isLight={isLight}
                      onSelect={(selected) => {
                        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
                        navigate(`/edit/${selected.id}`)
                      }}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Stepper
                    currentPage={safePage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    totalItems={filtered.length}
                    startIndex={startIndex}
                    endIndex={endIndex}
                    isLight={isLight}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer isLight={isLight} />

      {/* -- Modals -- */}
      <AddTitleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddTitle}
        defaultCategory={activeCategory}
        categories={categories}
        mediaList={mediaList}
        isLight={isLight}
      />

      <AddLibraryModal
        isOpen={isAddLibraryModalOpen}
        mode={libraryModalMode}
        onClose={() => {
          setIsAddLibraryModalOpen(false)
          setLibraryToEdit(null)
          setLibraryModalMode('all')
        }}
        onSave={handleSaveLibrary}
        onDelete={handleDeleteLibrary}
        libraryToEdit={libraryToEdit}
        isOnlyLibrary={categories.length <= 1}
        isLight={isLight}
      />
    </div>
  )
}











