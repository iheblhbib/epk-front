import { Loader2 } from 'lucide-react'
import { useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

const PALETTE = ['#cc1417', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
const MAX_BYTES = 5 * 1024 * 1024

function paletteColor(label: string): string {
  const code = label.charCodeAt(0) || 0
  return PALETTE[code % PALETTE.length]
}

interface ImageUploadFieldProps {
  imageUrl: string | null
  fallbackLabel: string
  shape?: 'circle' | 'square'
  readOnly?: boolean
  onUpload: (file: File) => void
  onRemove: () => void
  isUploading?: boolean
  isRemoving?: boolean
  uploadLabel: string
  changeLabel: string
  removeLabel: string
  invalidFileError: string
}

export function ImageUploadField({
  imageUrl,
  fallbackLabel,
  shape = 'circle',
  readOnly = false,
  onUpload,
  onRemove,
  isUploading = false,
  isRemoving = false,
  uploadLabel,
  changeLabel,
  removeLabel,
  invalidFileError,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const busy = isUploading || isRemoving

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/') || file.size > MAX_BYTES) {
      toast.error(invalidFileError)
      return
    }

    onUpload(file)
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className={`relative flex size-16 shrink-0 items-center justify-center overflow-hidden border border-border ${shape === 'circle' ? 'rounded-full' : 'rounded-lg'}`}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={fallbackLabel} className="size-full object-cover" />
        ) : (
          <span
            className="flex size-full items-center justify-center text-lg font-semibold text-white"
            style={{ backgroundColor: paletteColor(fallbackLabel) }}
            aria-hidden="true"
          >
            {fallbackLabel.charAt(0).toUpperCase()}
          </span>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Loader2 className="size-5 animate-spin text-foreground" />
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
            {imageUrl ? changeLabel : uploadLabel}
          </Button>
          {imageUrl && (
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={onRemove}>
              {removeLabel}
            </Button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            data-testid="image-upload-input"
            className="hidden"
            onChange={handleChange}
          />
        </div>
      )}
    </div>
  )
}
