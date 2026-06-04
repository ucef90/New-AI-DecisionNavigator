"use client"

import type { Question } from "@/lib/questions"
import { cn } from "@/lib/utils"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// Options exclusives : sélectionner l'une vide les autres (et inversement).
const EXCLUSIVE = ["none", "unknown"]

interface Props {
  question: Question
  value: string | string[] | undefined
  onChange: (value: string | string[]) => void
}

export function QuestionInput({ question, value, onChange }: Props) {
  if (question.type === "text") {
    return (
      <Textarea
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder={question.placeholder}
        className="resize-none text-base"
        autoFocus
      />
    )
  }

  if (question.type === "single") {
    const current = (value as string) ?? ""
    return (
      <RadioGroup value={current} onValueChange={onChange} className="gap-2.5">
        {question.options!.map((o) => {
          const selected = current === o.value
          const id = `${question.key}-${o.value}`
          return (
            <Label
              key={o.value}
              htmlFor={id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 text-sm transition-colors hover:bg-muted/50",
                selected && "border-primary bg-accent",
              )}
            >
              <RadioGroupItem value={o.value} id={id} />
              {o.label}
            </Label>
          )
        })}
      </RadioGroup>
    )
  }

  // multi
  const arr = Array.isArray(value) ? value : []
  const toggle = (v: string) => {
    let next: string[]
    if (arr.includes(v)) {
      next = arr.filter((x) => x !== v)
    } else if (EXCLUSIVE.includes(v)) {
      next = [v] // option exclusive : remplace tout
    } else {
      next = [...arr.filter((x) => !EXCLUSIVE.includes(x)), v]
    }
    onChange(next)
  }

  return (
    <div className="grid gap-2.5">
      {question.options!.map((o) => {
        const checked = arr.includes(o.value)
        const id = `${question.key}-${o.value}`
        return (
          <Label
            key={o.value}
            htmlFor={id}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 text-sm transition-colors hover:bg-muted/50",
              checked && "border-primary bg-accent",
            )}
          >
            <Checkbox
              id={id}
              checked={checked}
              onCheckedChange={() => toggle(o.value)}
            />
            {o.label}
          </Label>
        )
      })}
    </div>
  )
}
