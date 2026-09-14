interface StepperProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems: number
  startIndex: number
  endIndex: number
  isLight?: boolean
}

export function Stepper({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  startIndex,
  endIndex,
  isLight = false,
}: StepperProps) {
  return (
    <div className={`mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 select-none ${
      isLight ? 'border-zinc-200' : 'border-zinc-900'
    }`}>
      <span className={`font-mono text-[10px] tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-600'}`}>
        SHOWING {Math.min(startIndex + 1, totalItems)}–{Math.min(endIndex, totalItems)} OF {totalItems} TITLES
      </span>

      <div className="flex items-center gap-1.5">
        <button
          id="btn-prev-page"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`font-mono text-[10px] px-3.5 py-1.5 border disabled:opacity-25 disabled:pointer-events-none transition-all tracking-wider cursor-pointer ${
            isLight
              ? 'border-zinc-300 bg-white text-zinc-700 hover:text-black hover:border-zinc-500 shadow-xs'
              : 'border-zinc-900 bg-zinc-950 text-zinc-400 hover:text-white hover:border-zinc-700'
          }`}
        >
          &lt; PREV
        </button>

        <div className={`flex items-center border px-3 py-1.5 font-mono text-[10px] tracking-widest ${
          isLight
            ? 'border-zinc-300 bg-white text-zinc-600 shadow-xs'
            : 'border-zinc-900 bg-zinc-950 text-zinc-300'
        }`}>
          <span className={`font-bold ${isLight ? 'text-zinc-950' : 'text-white'}`}>
            {String(currentPage).padStart(2, '0')}
          </span>
          <span className={`mx-1.5 ${isLight ? 'text-zinc-400' : 'text-zinc-600'}`}>/</span>
          <span className={isLight ? 'text-zinc-500' : 'text-zinc-500'}>
            {String(totalPages).padStart(2, '0')}
          </span>
        </div>

        <button
          id="btn-next-page"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`font-mono text-[10px] px-3.5 py-1.5 border disabled:opacity-25 disabled:pointer-events-none transition-all tracking-wider cursor-pointer ${
            isLight
              ? 'border-zinc-300 bg-white text-zinc-700 hover:text-black hover:border-zinc-500 shadow-xs'
              : 'border-zinc-900 bg-zinc-950 text-zinc-400 hover:text-white hover:border-zinc-700'
          }`}
        >
          NEXT &gt;
        </button>
      </div>
    </div>
  )
}
