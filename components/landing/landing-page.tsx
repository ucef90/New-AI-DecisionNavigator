"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, useInView, useReducedMotion } from "motion/react"
import { ArrowRight, ShieldCheck, Cpu } from "@phosphor-icons/react/dist/ssr"

import { Activity } from "@/components/animate-ui/icons/activity"
import { CloudSunRain } from "@/components/animate-ui/icons/cloud-sun-rain"
import { SlidingNumber } from "@/components/animate-ui/primitives/texts/sliding-number"
import { GradientBackground } from "@/components/animate-ui/components/backgrounds/gradient"
import {
  RotatingText,
  RotatingTextContainer,
} from "@/components/animate-ui/primitives/texts/rotating"
import { RippleButton } from "@/components/animate-ui/components/buttons/ripple"
import { Button } from "@/components/ui/button"

// Courbe ease-out forte (philosophie Emil Kowalski) pour les entrées.
const EASE = [0.23, 1, 0.32, 1] as const

function fade(delay = 0) {
  return {
    initial: { opacity: 0, y: 18, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.6, delay, ease: EASE },
  }
}

const STATS = [
  { to: 10, suffix: "", label: "questions guidées" },
  { to: 6, suffix: "", label: "axes d'évaluation" },
  { to: 5, suffix: "", label: "verdicts possibles" },
  { to: 15, suffix: " min", label: "maximum" },
]

const FEATURES = [
  {
    icon: <Activity animateOnHover size={26} className="text-primary" />,
    title: "Décision argumentée",
    desc: "GO, POC, ÉTUDE, AUTOMATISATION ou NO GO — avec un score sur 6 axes.",
  },
  {
    icon: <Cpu className="size-[26px] text-primary" weight="duotone" />,
    title: "Bonne technologie",
    desc: "RPA, ML, LLM, RAG, OCR ou AGENT, selon la nature réelle du besoin.",
  },
  {
    icon: <ShieldCheck className="size-[26px] text-primary" weight="duotone" />,
    title: "Conformité",
    desc: "Obligations RGPD, IA Act et ISO identifiées automatiquement.",
  },
  {
    icon: <CloudSunRain animateOnHover size={26} className="text-primary" />,
    title: "Vue d'ensemble",
    desc: "Radar technologique, tableau de bord et rapport PDF d'une page.",
  },
]

export function LandingPage() {
  const reduce = useReducedMotion()
  const router = useRouter()

  return (
    <div className="relative overflow-hidden">
      {/* Fond dégradé animé (animate-ui) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] overflow-hidden opacity-25 [mask-image:radial-gradient(60%_60%_at_50%_0%,black,transparent_75%)]"
      >
        <GradientBackground className="from-indigo-600 via-violet-600 to-blue-600 blur-3xl" />
      </div>

      {/* HERO */}
      <section className="mx-auto max-w-4xl px-6 pb-20 pt-20 text-center sm:pt-28">
        <motion.div
          {...(reduce ? {} : fade(0))}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary"
        >
          <Activity animateOnHover size={16} />
          Pré-cadrage IA · Secteur public
        </motion.div>

        <motion.div {...(reduce ? {} : fade(0.08))}>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Votre besoin, c&apos;est plutôt
          </h1>
          <RotatingTextContainer
            text={[
              "de l'IA ?",
              "de l'automatisation ?",
              "du RAG ?",
              "de l'OCR ?",
              "du machine learning ?",
            ]}
            duration={2200}
            className="mt-1 text-4xl font-semibold tracking-tight sm:text-6xl"
          >
            <RotatingText className="inline-block bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent" />
          </RotatingTextContainer>
        </motion.div>

        <motion.p
          {...(reduce ? {} : fade(0.16))}
          className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          Guidez votre besoin en 10 questions et obtenez une décision claire :
          IA ou automatisation, quelle technologie, et quelles obligations
          réglementaires.
        </motion.p>

        <motion.div
          {...(reduce ? {} : fade(0.24))}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <RippleButton
            size="lg"
            onClick={() => router.push("/projects/new")}
            className="glow-primary gap-2"
          >
            Démarrer un pré-cadrage
            <ArrowRight className="size-4" aria-hidden />
          </RippleButton>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard">Voir le tableau de bord</Link>
          </Button>
        </motion.div>

        <motion.p
          {...(reduce ? {} : fade(0.32))}
          className="mt-5 text-xs text-muted-foreground"
        >
          En moins de 15 minutes · 100 % on-premise · fonctionne sans clé API
        </motion.p>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-4xl px-6">
        <div className="grid grid-cols-2 divide-y divide-x rounded-xl border sm:grid-cols-4 sm:divide-y-0">
          {STATS.map((s) => (
            <Stat key={s.label} {...s} reduce={!!reduce} />
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: EASE }}
              className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary/30"
            >
              <div className="mb-3 flex size-11 items-center justify-center rounded-lg bg-primary/10">
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="glow-primary flex flex-col items-center gap-4 rounded-2xl border border-primary/20 bg-card px-8 py-12 text-center"
        >
          <h2 className="text-2xl font-semibold tracking-tight">
            Prêt à cadrer votre projet ?
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Décrivez le besoin, répondez aux questions, et laissez l&apos;outil
            objectiver la décision.
          </p>
          <Button asChild size="lg">
            <Link href="/projects/new">
              Créer un projet
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </motion.div>
      </section>
    </div>
  )
}

function Stat({
  to,
  suffix,
  label,
  reduce,
}: {
  to: number
  suffix: string
  label: string
  reduce: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const [n, setN] = useState(reduce ? to : 0)

  useEffect(() => {
    if (inView && !reduce) setN(to)
  }, [inView, reduce, to])

  return (
    <div ref={ref} className="px-6 py-6 text-center">
      <div className="flex items-center justify-center text-3xl font-semibold tabular-nums sm:text-4xl">
        <SlidingNumber number={n} />
        {suffix ? <span>{suffix}</span> : null}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
