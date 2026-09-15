import { useState, useEffect, useRef } from 'react'
import { FilterStatus, SortOption } from '../../types'

interface ControlsProps {
  filter: FilterStatus
  setFilter: (v: FilterStatus) => void
  sort: SortOption
  setSort: (v: SortOption) => void
  search: string
  setSearch: (v: string) => void
  categoryLabel: string
  isLight?: boolean
}

export function Controls({
  filter, setFilter, sort, setSort, search, setSearch, categoryLabel, isLight = false,
}: ControlsProps) {
  const [localSearch, setLocalSearch] = useState(search)
  const [isDebouncing, setIsDebouncing] = useState(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep local search in sync with external changes (e.g. category switch or reset)
  useEffect(() => {
    setLocalSearch(search)
    setIsDebouncing(false)
  }, [search])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setLocalSearch(val)
    setIsDebouncing(true)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      setSearch(val)
      setIsDebouncing(false)
    }, 400) // 400ms debounce (within 300–500 ms)
  }

  const handleClear = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    setLocalSearch('')
    setSearch('')
    setIsDebouncing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      setSearch(localSearch)
      setIsDebouncing(false)
    } else if (e.key === 'Escape') {
      handleClear()
    }
  }

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const tabs: { v: FilterStatus; label: string }[] = [
    { v: 'all',      label: 'ALL' },
    { v: 'watching', label: 'WATCHING' },
    { v: 'watched',  label: 'WATCHED' },
    { v: 'stalled',  label: 'STALLED' },
    { v: 'dropped',  label: 'DROPPED' },
  ]

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Filter tabs */}
      <div className={`flex items-stretch border w-full sm:w-fit overflow-x-auto scrollbar-none transition-colors ${
        isLight ? 'border-zinc-300 bg-white shadow-xs' : 'border-zinc-900 bg-transparent'
      }`}>
        {tabs.map(({ v, label }) => (
          <button
            key={v}
            id={`tab-${v}`}
            onClick={() => setFilter(v)}
            className={`font-mono text-[10px] tracking-widest px-2.5 sm:px-3 py-2 transition-all border-r last:border-r-0 shrink-0 cursor-pointer ${
              isLight ? 'border-zinc-200' : 'border-zinc-900'
            } ${
              filter === v
                ? isLight ? 'bg-zinc-900 text-white font-bold' : 'bg-white text-black font-bold'
                : isLight ? 'text-zinc-600 hover:text-zinc-950 bg-white' : 'text-zinc-600 hover:text-zinc-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <div className="relative flex-1 sm:flex-initial">
          <span className={`absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs pointer-events-none ${
            isLight ? 'text-zinc-400' : 'text-zinc-700'
          }`}>
            {'>'}
          </span>
          <input
            id="search-input"
            type="text"
            placeholder={`search ${categoryLabel.toLowerCase()}...`}
            value={localSearch}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className={`w-full sm:w-44 focus:sm:w-56 font-mono text-xs border pl-6 pr-8 py-2 outline-none transition-all ${
              isLight
                ? 'bg-white border-zinc-300 focus:border-zinc-600 text-zinc-900 placeholder-zinc-400 shadow-xs'
                : 'bg-transparent border-zinc-900 focus:border-zinc-700 text-white placeholder-zinc-700'
            }`}
          />
          {localSearch && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear search"
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] px-1 py-0.5 cursor-pointer transition-colors ${
                isLight
                  ? 'text-zinc-400 hover:text-zinc-800'
                  : 'text-zinc-600 hover:text-zinc-300'
              }`}
            >
              {isDebouncing ? (
                <span className="animate-spin inline-block text-[10px] leading-none">◴</span>
              ) : (
                <span className="leading-none text-xs font-bold">×</span>
              )}
            </button>
          )}
        </div>
        <select
          id="sort-select"
          value={sort}
          onChange={e => setSort(e.target.value as SortOption)}
          className={`font-mono text-[10px] border px-2.5 py-2 outline-none cursor-pointer tracking-widest shrink-0 transition-colors ${
            isLight
              ? 'bg-white border-zinc-300 text-zinc-700 hover:border-zinc-500 shadow-xs'
              : 'bg-[#080808] border-zinc-900 hover:border-zinc-700 text-zinc-500'
          }`}
        >
          <option value="rating">BY_RATING</option>
          <option value="year">BY_YEAR</option>
          <option value="title">BY_NAME</option>
        </select>
      </div>
    </div>
  )
}
