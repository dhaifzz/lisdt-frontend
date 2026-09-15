import { useRef, useState } from 'react'
import { authApi, uploadApi } from '../../lib/api'

interface ProfileCardProps {
  avatarUrl?: string
  username?: string
  onAvatarUpdate?: (newUrl: string) => void
  isLight?: boolean
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/avif']
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 32 32' fill='%233f3f46'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E"

export function ProfileCard({
  avatarUrl = DEFAULT_AVATAR,
  username = '@curator',
  onAvatarUpdate,
  isLight = false,
}: ProfileCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displayUrl = previewUrl ?? (avatarUrl || DEFAULT_AVATAR)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!e.target.files) return
    // Reset value so selecting same file again fires the event
    e.target.value = ''

    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only PNG, JPEG, WEBP, or GIF images are allowed.')
      return
    }

    if (file.size > MAX_BYTES) {
      setError('Image must be 5 MB or smaller.')
      return
    }

    setError(null)
    setUploading(true)

    // Show instant local preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    try {
      const res = await uploadApi.uploadAvatar(file)
      const updatedAvatar = res.user.avatar || res.url
      setPreviewUrl(updatedAvatar)
      onAvatarUpdate?.(updatedAvatar)
    } catch (err: any) {
      console.error('Cloud avatar upload failed in ProfileCard, trying fallback:', err)
      const reader = new FileReader()
      reader.onload = async () => {
        const dataUrl = reader.result as string
        try {
          const res = await authApi.uploadAvatar(dataUrl)
          onAvatarUpdate?.(res.user.avatar ?? dataUrl)
        } catch (fallbackErr: any) {
          setError(fallbackErr?.message ?? 'Upload failed. Please try again.')
          setPreviewUrl(null)
        } finally {
          setUploading(false)
        }
      }
      reader.onerror = () => {
        setError('Failed to read file.')
        setUploading(false)
      }
      reader.readAsDataURL(file)
      return
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center shrink-0 select-none">
      {/* Clean rectangular profile card frame */}
      <div
        className={`group relative border p-2 transition-all duration-300 cursor-pointer ${
          isLight
            ? 'border-zinc-200 hover:border-zinc-400 bg-white shadow-md'
            : 'border-zinc-800 hover:border-zinc-600 bg-zinc-950 shadow-xl'
        }`}
        onClick={() => !uploading && fileInputRef.current?.click()}
        title="Click to upload avatar"
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          id="avatar-file-input"
          type="file"
          accept=".png,.jpg,.jpeg,.gif,image/png,image/jpeg,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Photo */}
        <div
          className={`w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 overflow-hidden relative border ${
            isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-900 border-zinc-800/80'
          }`}
        >
          <img
            src={displayUrl}
            alt={`${username} avatar`}
            className={`w-full h-full object-cover transition-opacity duration-200 ${uploading ? 'opacity-40' : 'opacity-100'}`}
          />

          {/* Hover overlay */}
          {!uploading && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1 pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V19a1.5 1.5 0 001.5 1.5h15A1.5 1.5 0 0021 19v-2.5M16 8l-4-4-4 4M12 4v12" />
              </svg>
              <span className="font-mono text-[9px] text-zinc-200 tracking-wider">UPLOAD</span>
              <span className="font-mono text-[8px] text-zinc-400">PNG · JPG · GIF · 3MB</span>
            </div>
          )}

          {/* Uploading spinner */}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          )}
        </div>

        {/* Username */}
        <div
          className={`font-mono text-xs sm:text-sm font-semibold tracking-wide mt-2 px-0.5 text-center ${
            isLight ? 'text-zinc-950' : 'text-white'
          }`}
        >
          {username}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="font-mono text-[9px] text-red-400 mt-1.5 max-w-[10rem] text-center leading-snug">
          {error}
        </p>
      )}
    </div>
  )
}
