export default function Footer({ isLight = false }: { isLight?: boolean }) {
  return (
    <footer className={`border-t py-6 transition-colors ${
      isLight ? 'border-zinc-200 bg-[#f5f5f7]' : 'border-zinc-900 bg-[#080808]'
    }`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className={`flex items-center gap-2 font-mono text-[11px] ${
          isLight ? 'text-zinc-600' : 'text-zinc-600'
        }`}>
          <span>CRAFTED BY</span>
          <a
            href="https://github.com/dhaifzz"
            target="_blank"
            rel="noopener noreferrer"
            className={`font-semibold tracking-wider transition-colors hover:underline ${
              isLight
                ? 'text-zinc-900 hover:text-black decoration-zinc-400'
                : 'text-zinc-300 hover:text-white decoration-zinc-700'
            }`}
          >
            Dhaifz
          </a>
          <span className={`select-none ${isLight ? 'text-zinc-400' : 'text-zinc-800'}`}>·</span>
          <span className={isLight ? 'text-zinc-500' : 'text-zinc-700'}>{new Date().getFullYear()}</span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          {/* GitHub */}
          <a
            id="footer-github-link"
            href="https://github.com/dhaifzz"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 px-2 py-1 transition-colors cursor-pointer border ${
              isLight
                ? 'text-zinc-600 hover:text-zinc-950 border-zinc-300 hover:border-zinc-500 bg-white shadow-xs'
                : 'text-zinc-500 hover:text-white border-zinc-900 hover:border-zinc-700 bg-zinc-950'
            }`}
            title="Dhaifz on GitHub"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span className="text-[10px]">GITHUB</span>
          </a>

          {/* Facebook */}
          <a
            id="footer-fb-link"
            href="https://www.facebook.com/xzfiahd/"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 px-2 py-1 transition-colors cursor-pointer border ${
              isLight
                ? 'text-zinc-600 hover:text-[#1877F2] border-zinc-300 hover:border-zinc-500 bg-white shadow-xs'
                : 'text-zinc-500 hover:text-[#1877F2] border-zinc-900 hover:border-zinc-700 bg-zinc-950'
            }`}
            title="Dhaifz on Facebook"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span className="text-[10px]">FACEBOOK</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
