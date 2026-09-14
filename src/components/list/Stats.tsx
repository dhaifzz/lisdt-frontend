import { Anime } from '../../types'

export function Stats({ list, isLight = false }: { list: Anime[]; isLight?: boolean }) {
  const watching = list.filter(a => a.status === 'watching').length
  const watched  = list.filter(a => a.status === 'watched').length
  const stalled  = list.filter(a => a.status === 'stalled').length
  const dropped  = list.filter(a => a.status === 'dropped').length
  const rated    = list.filter(a => a.rating !== null)
  const avg     = rated.length
    ? Math.round(rated.reduce((s, a) => s + (a.rating ?? 0), 0) / rated.length).toString()
    : '—'

  return (
    <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-x-6 sm:gap-x-8 gap-y-3">
      {[
        { k: 'WATCHING',  v: watching },
        { k: 'WATCHED',   v: watched },
        { k: 'STALLED',   v: stalled },
        { k: 'DROPPED',   v: dropped },
        { k: 'AVG_SCORE', v: avg },
      ].map(({ k, v }) => (
        <div key={k} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
          <span className={`font-mono text-[9px] sm:text-[10px] tracking-widest ${isLight ? 'text-zinc-500' : 'text-zinc-600'}`}>
            {k}
          </span>
          <span className={`font-mono font-bold text-lg sm:text-xl leading-none ${isLight ? 'text-zinc-950' : 'text-white'}`}>
            {v}
          </span>
        </div>
      ))}
    </div>
  )
}
