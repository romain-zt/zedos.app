'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { HelpCircle, Send, GripVertical } from 'lucide-react'

interface DecisionOption {
  id: string
  label: string
  description?: string
}

interface DecisionUI {
  type: 'single_choice' | 'multi_choice' | 'ranked' | 'modal_form'
  title: string
  description?: string
  options: DecisionOption[]
  allow_custom?: boolean
  allow_not_sure?: boolean
}

interface DecisionCardProps {
  decision: DecisionUI
  onSubmit: (response: any) => void
  disabled?: boolean
}

export function DecisionCard({ decision, onSubmit, disabled = false }: DecisionCardProps) {
  const [singleChoice, setSingleChoice] = useState('')
  const [multiChoices, setMultiChoices] = useState<string[]>([])
  const [ranked, setRanked] = useState<string[]>(
    () => (decision?.options ?? []).map((o: DecisionOption) => o.id)
  )
  const [comment, setComment] = useState('')
  const [customInput, setCustomInput] = useState('')

  const options = decision?.options ?? []
  const type = decision?.type ?? 'single_choice'

  const handleSubmit = () => {
    let response: any = { type }

    switch (type) {
      case 'single_choice':
        if (!singleChoice && !customInput.trim()) return
        response.selected = singleChoice || `custom: ${customInput.trim()}`
        response.label = options.find((o: DecisionOption) => o.id === singleChoice)?.label ?? customInput.trim()
        break
      case 'multi_choice':
        if ((multiChoices?.length ?? 0) === 0 && !customInput.trim()) return
        response.selected = multiChoices
        response.labels = multiChoices.map((id: string) => options.find((o: DecisionOption) => o.id === id)?.label ?? id)
        if (customInput.trim()) response.custom = customInput.trim()
        break
      case 'ranked':
        response.ranking = ranked
        response.labels = ranked.map((id: string) => options.find((o: DecisionOption) => o.id === id)?.label ?? id)
        break
      case 'modal_form':
        response.selected = singleChoice || multiChoices
        break
    }

    if (comment.trim()) response.comment = comment.trim()
    onSubmit(response)
  }

  const handleNotSure = () => {
    onSubmit({ type: 'not_sure', message: "I'm not sure about this. Can you ask differently?" })
  }

  const toggleMulti = (id: string) => {
    setMultiChoices((prev: string[]) =>
      (prev ?? []).includes(id)
        ? (prev ?? []).filter((x: string) => x !== id)
        : [...(prev ?? []), id]
    )
  }

  const moveRanked = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= (ranked?.length ?? 0)) return
    const newRanked = [...(ranked ?? [])]
    const [moved] = newRanked.splice(fromIndex, 1)
    newRanked.splice(toIndex, 0, moved)
    setRanked(newRanked)
  }

  return (
    <Card className="border-primary/20 bg-primary/[0.02]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display">{decision?.title ?? 'Decision'}</CardTitle>
        {decision?.description && (
          <CardDescription>{decision.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Single Choice */}
        {type === 'single_choice' && (
          <RadioGroup value={singleChoice} onValueChange={setSingleChoice} disabled={disabled}>
            <div className="space-y-2">
              {options.map((opt: DecisionOption) => (
                <div
                  key={opt.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => !disabled && setSingleChoice(opt.id)}
                >
                  <RadioGroupItem value={opt.id} id={opt.id} className="mt-0.5" />
                  <div>
                    <Label htmlFor={opt.id} className="font-medium cursor-pointer">{opt.label}</Label>
                    {opt.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        )}

        {/* Multi Choice */}
        {type === 'multi_choice' && (
          <div className="space-y-2">
            {options.map((opt: DecisionOption) => (
              <div
                key={opt.id}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => !disabled && toggleMulti(opt.id)}
              >
                <Checkbox
                  checked={(multiChoices ?? []).includes(opt.id)}
                  onCheckedChange={() => toggleMulti(opt.id)}
                  disabled={disabled}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium">{opt.label}</span>
                  {opt.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ranked */}
        {type === 'ranked' && (
          <div className="space-y-1">
            {(ranked ?? []).map((id: string, index: number) => {
              const opt = options.find((o: DecisionOption) => o.id === id)
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 p-3 rounded-lg border bg-background"
                >
                  <span className="text-xs font-mono text-muted-foreground w-5">{index + 1}.</span>
                  <span className="text-sm font-medium flex-1">{opt?.label ?? id}</span>
                  <div className="flex flex-col">
                    <button
                      onClick={() => moveRanked(index, index - 1)}
                      disabled={index === 0 || disabled}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs p-0.5"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveRanked(index, index + 1)}
                      disabled={index === (ranked?.length ?? 0) - 1 || disabled}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs p-0.5"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Custom input */}
        {decision?.allow_custom && type !== 'ranked' && (
          <Textarea
            placeholder="Or type your own answer..."
            value={customInput}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomInput(e.target.value)}
            rows={2}
            className="resize-none"
            disabled={disabled}
          />
        )}

        {/* Comment */}
        <Textarea
          placeholder="Add a comment (optional)"
          value={comment}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
          rows={1}
          className="resize-none text-sm"
          disabled={disabled}
        />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={disabled}
          >
            <Send className="mr-2 h-3.5 w-3.5" />
            Submit
          </Button>
          {decision?.allow_not_sure && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNotSure}
              disabled={disabled}
            >
              <HelpCircle className="mr-2 h-3.5 w-3.5" />
              Not sure / Ask differently
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
