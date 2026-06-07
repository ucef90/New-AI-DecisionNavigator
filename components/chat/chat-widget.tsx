"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import {
  ChatCircleDots,
  X,
  PaperPlaneTilt,
  Sparkle,
  CircleNotch,
} from "@phosphor-icons/react/dist/ssr"

import { cn } from "@/lib/utils"

interface Msg {
  role: "user" | "assistant"
  content: string
}

const SUGGESTIONS = [
  "Comment l'outil décide-t-il GO / POC / NO GO ?",
  "Quelles obligations RGPD pour une décision automatisée ?",
  "Quels projets sont en GO ?",
  "Quelle techno pour lire des documents : OCR, LLM ou RAG ?",
]

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Bonjour 👋 Je suis l'assistant d'AI Pré-Cadrage. Posez-moi une question sur l'application, l'IA, la conformité (RGPD, IA Act…) ou vos projets enregistrés.",
}

export function ChatWidget() {
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([WELCOME])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages, loading])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const send = async (text: string) => {
    const question = text.trim()
    if (!question || loading) return
    const next = [...messages, { role: "user" as const, content: question }]
    setMessages(next)
    setInput("")
    setLoading(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // On n'envoie pas le message d'accueil au modèle.
          messages: next.filter((m) => m !== WELCOME),
        }),
      })
      const data = await res.json()
      const reply =
        typeof data.reply === "string" && data.reply.trim()
          ? data.reply
          : "Désolé, je n'ai pas pu générer de réponse. Réessayez dans un instant."
      setMessages((m) => [...m, { role: "assistant", content: reply }])
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Une erreur est survenue. Vérifiez votre connexion et réessayez.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <>
      {/* Bouton flottant */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant"}
        className={cn(
          "fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full",
          "bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="size-6" weight="bold" aria-hidden />
            </motion.span>
          ) : (
            <motion.span
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <ChatCircleDots className="size-6" weight="fill" aria-hidden />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Panneau */}
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 16, scale: reduce ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduce ? 0 : 16, scale: reduce ? 1 : 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "fixed bottom-24 right-5 z-50 flex flex-col overflow-hidden",
              "h-[min(560px,calc(100vh-8rem))] w-[min(400px,calc(100vw-2.5rem))]",
              "rounded-2xl border border-border bg-background shadow-2xl",
            )}
            role="dialog"
            aria-label="Assistant AI Pré-Cadrage"
          >
            {/* En-tête */}
            <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkle className="size-4" weight="fill" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight">Assistant IA</p>
                <p className="truncate text-xs text-muted-foreground">
                  Aide sur l&apos;app, l&apos;IA et vos projets
                </p>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    m.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                      m.role === "user"
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-muted text-foreground",
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {loading ? (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 text-muted-foreground">
                    <CircleNotch className="size-4 animate-spin" aria-hidden />
                    <span className="text-xs">L&apos;assistant réfléchit…</span>
                  </div>
                </div>
              ) : null}

              {/* Suggestions (seulement au tout début) */}
              {messages.length === 1 && !loading ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Saisie */}
            <div className="border-t border-border p-3">
              <div className="flex items-end gap-2 rounded-xl border border-input bg-background px-3 py-2 focus-within:ring-1 focus-within:ring-ring">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  rows={1}
                  placeholder="Votre question…"
                  className="max-h-28 flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => send(input)}
                  disabled={!input.trim() || loading}
                  aria-label="Envoyer"
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                    input.trim() && !loading
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <PaperPlaneTilt className="size-4" weight="fill" aria-hidden />
                </button>
              </div>
              <p className="mt-1.5 px-1 text-[10px] text-muted-foreground">
                Réponses indicatives — validez les points sensibles avec le DPO/DSI.
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
