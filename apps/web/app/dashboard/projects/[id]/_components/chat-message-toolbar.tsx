'use client'

import { Button } from '@/components/ui/button'
import { Copy, Pencil, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

export interface ChatMessageToolbarProps {
  role: 'user' | 'assistant'
  isEditing?: boolean
  disabled?: boolean
  onCopy: () => void
  onEdit?: () => void
  onRegenerate?: () => void
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  const value = text.trim()
  if (!value) return false
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}

export function ChatMessageToolbar({
  role,
  disabled,
  onCopy,
  onEdit,
  onRegenerate,
}: ChatMessageToolbarProps) {
  const handleCopy = async () => {
    onCopy()
  }

  return (
    <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity self-end">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        disabled={disabled}
        aria-label="Copier"
        onClick={() => void handleCopy()}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
      {role === 'user' && onEdit ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={disabled}
          aria-label="Modifier et renvoyer"
          onClick={onEdit}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      ) : null}
      {onRegenerate ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={disabled}
          aria-label={role === 'user' ? 'Renvoyer le message' : 'Régénérer la réponse'}
          onClick={onRegenerate}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      ) : null}
    </div>
  )
}

export function toastCopied(): void {
  toast.success('Copié dans le presse-papiers')
}

export function toastCopyFailed(): void {
  toast.error('Impossible de copier')
}
