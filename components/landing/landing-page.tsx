"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { motion, useInView, useReducedMotion } from "motion/react"
import {
  ArrowRight,
  ShieldCheck,
  Cpu,
  Star,
  HardDrives,
  SealCheck,
  FlagBanner,
} from "@phosphor-icons/react/dist/ssr"

import { Activity } from "@/components/animate-ui/icons/activity"
import { Bot } from "@/components/animate-ui/icons/bot"
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
    icon: <Activity animateOnHover size={24} className="text-[#0084FF]" />,
    title: "Décision argumentée",
    desc: "GO, POC, ÉTUDE, AUTOMATISATION ou NO GO — avec un score sur 6 axes.",
  },
  {
    icon: <Cpu className="size-6 text-[#0084FF]" weight="duotone" />,
    title: "Bonne technologie",
    desc: "RPA, ML, LLM, RAG, OCR ou AGENT, selon la nature réelle du besoin.",
  },
  {
    icon: <ShieldCheck className="size-6 text-[#0084FF]" weight="duotone" />,
    title: "Conformité",
    desc: "Obligations RGPD, IA Act et ISO identifiées automatiquement.",
  },
  {
    icon: <CloudSunRain animateOnHover size={24} className="text-[#0084FF]" />,
    title: "Vue d'ensemble",
    desc: "Radar technologique, tableau de bord et rapport PDF d'une page.",
  },
]

// Conformité. `logo` = chemin d'un fichier OFFICIEL à déposer dans /public/logos.
// Tant que le fichier est absent, on retombe sur l'emblème maison (badge).
const COMPLIANCE = [
  { label: "100 % on-premise", Icon: HardDrives },
  { label: "RGPD", eu: true, logo: "/logos/rgpd.jpg" },
  { label: "IA Act", eu: true, logo: "/logos/EU_AI_Act_logo_main.png" },
  { label: "ISO 27001", Icon: SealCheck, logo: "/logos/iso-27000-499x499.png" },
  { label: "CNIL", Icon: ShieldCheck, logo: "/logos/logo-CNIL.jpg" },
  { label: "Souveraineté", Icon: FlagBanner },
] as const

type ComplianceItem = (typeof COMPLIANCE)[number]

/** Cercle de 12 étoiles façon emblème européen (rendu local, non officiel). */
function EuStars({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2
        const cx = 12 + Math.cos(a) * 8.2
        const cy = 12 + Math.sin(a) * 8.2
        return <circle key={i} cx={cx} cy={cy} r={1.15} />
      })}
    </svg>
  )
}

/**
 * Affiche le logo OFFICIEL (/public/logos/...) UNIQUEMENT s'il se charge.
 * Sinon (fichier absent) on garde le badge maison — jamais d'image cassée.
 */
function ComplianceMark({ item }: { item: ComplianceItem }) {
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const logo = "logo" in item ? item.logo : undefined

  // Les images déjà en cache sont "complete" avant que onLoad puisse se déclencher.
  useEffect(() => {
    const el = imgRef.current
    if (el && el.complete && el.naturalWidth > 0) setLoaded(true)
  }, [])

  return (
    <span className="group flex h-16 shrink-0 items-center justify-center gap-2.5 rounded-2xl border border-black/[0.07] bg-white px-5 shadow-[0_2px_10px_-4px_rgba(49,154,255,0.25)] transition-transform hover:-translate-y-0.5">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={logo}
          alt={item.label}
          onLoad={() => setLoaded(true)}
          className={
            loaded
              ? "h-9 w-auto max-w-[130px] object-contain"
              : "hidden"
          }
        />
      ) : null}

      {!loaded ? (
        <>
          <span className="flex size-8 items-center justify-center rounded-lg bg-[#0084FF]/10 text-[#0084FF]">
            {"eu" in item && item.eu ? (
              <EuStars className="size-5" />
            ) : "Icon" in item ? (
              <item.Icon className="size-[18px]" weight="duotone" />
            ) : null}
          </span>
          <span className="font-display text-sm font-bold uppercase tracking-wide text-foreground/60">
            {item.label}
          </span>
        </>
      ) : null}
    </span>
  )
}

// Puces qui gravitent autour de l'orbe (feeling SaaS dynamique).
const ORB_CHIPS = [
  { label: "RGPD", className: "left-1 top-6", delay: 0 },
  { label: "RAG", className: "right-2 top-16", delay: 0.6 },
  { label: "OCR", className: "left-3 bottom-24", delay: 1.1 },
  { label: "Agent", className: "right-1 bottom-10", delay: 0.3 },
]

/**
 * La page d'accueil respecte le thème :
 *  - clair  → nouveau design "liquid glass" (LandingLight)
 *  - sombre → ancienne version d'origine, inchangée (LandingDark)
 * Avant le montage, on affiche la version claire (= rendu SSR), puis on
 * bascule sur la sombre si le thème résolu est "dark" — aucun mismatch d'hydratation.
 */
export function LandingPage() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === "dark"
  return isDark ? <LandingDark /> : <LandingLight />
}

function LandingLight() {
  const reduce = useReducedMotion()
  const router = useRouter()

  // Suivi du curseur sur l'orbe : révèle le voile blanc localement (--mx/--my)
  // et attire l'orbe vers le curseur (--ox/--oy, effet magnétique).
  function handleOrbMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    const s = e.currentTarget.style
    s.setProperty("--mx", `${(px * 100).toFixed(2)}%`)
    s.setProperty("--my", `${(py * 100).toFixed(2)}%`)
    if (!reduce) {
      s.setProperty("--ox", `${((px - 0.5) * 28).toFixed(1)}px`)
      s.setProperty("--oy", `${((py - 0.5) * 28).toFixed(1)}px`)
    }
  }

  function handleOrbLeave(e: React.MouseEvent<HTMLDivElement>) {
    const s = e.currentTarget.style
    s.setProperty("--ox", "0px")
    s.setProperty("--oy", "0px")
  }

  return (
    <div className="light relative min-h-screen overflow-hidden bg-background font-body text-foreground antialiased">
      <AuroraBackground reduce={!!reduce} />

      {/* HERO */}
      <section className="mx-auto grid max-w-[1280px] items-center gap-14 px-6 pb-24 pt-14 lg:grid-cols-2 lg:gap-10 lg:pt-24">
        {/* Colonne gauche — contenu */}
        <div className="relative z-10 text-center lg:text-left">
          <motion.div
            {...(reduce ? {} : fade(0))}
            className="glass-pill inline-flex items-center gap-2.5 rounded-full px-3.5 py-1.5"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#0084FF] opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-[#0084FF]" />
            </span>
            <span className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} weight="fill" className="size-3.5 text-[#FF801E]" />
              ))}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              Méthodologie 6 axes · secteur public
            </span>
          </motion.div>

          <motion.div {...(reduce ? {} : fade(0.08))}>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-[-0.02em] sm:text-6xl lg:text-[68px]">
              Votre besoin, c&apos;est plutôt
            </h1>
            <RotatingTextContainer
              text={[
                "de l'IA ?",
                "du RPA ?",
                "du RAG ?",
                "de l'OCR ?",
                "du ML ?",
                "d'un agent ?",
              ]}
              duration={2200}
              className="whitespace-nowrap font-display text-5xl font-bold leading-[1.05] tracking-[-0.02em] sm:text-6xl lg:text-[68px]"
            >
              <RotatingText className="inline-block whitespace-nowrap bg-gradient-to-r from-[#0084FF] via-[#319AFF] to-[#60B1FF] bg-clip-text text-transparent" />
            </RotatingTextContainer>
          </motion.div>

          <motion.p
            {...(reduce ? {} : fade(0.16))}
            className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed tracking-[-0.01em] text-muted-foreground lg:mx-0"
          >
            Guidez votre besoin en 10 questions et obtenez une décision claire :
            IA ou automatisation, quelle technologie, et quelles obligations
            réglementaires.
          </motion.p>

          <motion.div
            {...(reduce ? {} : fade(0.24))}
            className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
          >
            <button
              onClick={() => router.push("/projects/new")}
              className="glass-cta cta-sheen relative inline-flex h-[52px] items-center gap-3 overflow-hidden pl-6 pr-2 text-[15px] font-semibold"
            >
              <span className="relative z-10 flex items-center gap-3">
                Démarrer un pré-cadrage
                <span className="flex size-9 items-center justify-center rounded-full bg-white text-[#0084FF] transition-transform duration-300 group-hover:translate-x-0.5">
                  <ArrowRight className="size-4" weight="bold" aria-hidden />
                </span>
              </span>
            </button>
            <Link
              href="/dashboard"
              className="glass-pill inline-flex h-[52px] items-center rounded-2xl px-6 text-[15px] font-medium text-foreground transition-transform hover:scale-[1.02]"
            >
              Voir le tableau de bord
            </Link>
          </motion.div>

          <motion.p
            {...(reduce ? {} : fade(0.32))}
            className="mt-6 text-xs text-muted-foreground"
          >
            En moins de 15 minutes · 100 % on-premise · fonctionne sans clé API
          </motion.p>
        </div>

        {/* Colonne droite — orbe verre dynamique */}
        <motion.div
          {...(reduce ? {} : fade(0.18))}
          className="relative z-10 mx-auto w-full max-w-[460px]"
        >
          <div className="relative aspect-square w-full">
            {/* Lueur diffuse derrière l'orbe (couleur qui déborde, sans contour) */}
            <div className="orb-glow absolute inset-16 -z-10 rounded-full opacity-50 blur-2xl" />

            {/* Orbe vidéo "glassy" — voile blanc révélé au curseur + aimant */}
            <div className="orb-anim absolute inset-0 flex items-center justify-center">
              <div
                onMouseMove={handleOrbMove}
                onMouseLeave={handleOrbLeave}
                className="orb-stage group relative size-full"
              >
                <div className="orb-magnetic absolute inset-0">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    aria-hidden
                    className="orb-video absolute inset-0 size-full object-contain"
                  >
                    <source
                      src="https://future.co/images/homepage/glassy-orb/orb-purple.webm"
                      type="video/webm"
                    />
                  </video>
                  <div className="orb-veil absolute inset-0" aria-hidden />
                </div>
              </div>
            </div>

            {/* Badge "Assistant IA" avec icône Bot animée en boucle */}
            <motion.div
              className="glass-pill absolute -top-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3"
              animate={reduce ? undefined : { y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-[#0084FF] text-white">
                <Bot animate loop loopDelay={1400} size={18} />
              </span>
              <span className="text-xs font-semibold text-foreground">
                Assistant IA
              </span>
            </motion.div>

            {/* Puces gravitantes */}
            {ORB_CHIPS.map((chip) => (
              <motion.span
                key={chip.label}
                className={`glass-pill absolute rounded-full px-3 py-1 text-xs font-semibold text-foreground ${chip.className}`}
                animate={
                  reduce ? undefined : { y: [0, -12, 0], rotate: [0, 1.5, 0] }
                }
                transition={{
                  duration: 4.5,
                  delay: chip.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {chip.label}
              </motion.span>
            ))}

            {/* Carte verre flottante — aperçu d'un verdict */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
              className="glass-pill absolute -bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl px-4 py-3 sm:left-6 sm:right-auto sm:min-w-[230px]"
            >
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Décision
                </div>
                <div className="mt-0.5 flex items-baseline gap-2">
                  <span className="font-display text-xl font-bold text-foreground">
                    GO
                  </span>
                  <span className="text-xs text-muted-foreground">
                    score 4.6 / 6
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-[#0084FF]/10 px-2.5 py-1 text-[11px] font-semibold text-[#0084FF]">
                LLM + RAG
              </span>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-[1280px] px-6">
        <div className="glass-panel grid grid-cols-2 overflow-hidden rounded-3xl sm:grid-cols-4">
          {STATS.map((s) => (
            <Stat key={s.label} {...s} reduce={!!reduce} />
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-[1280px] px-6 py-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
              whileHover={reduce ? undefined : { y: -6 }}
              className="glass-panel group relative overflow-hidden rounded-2xl p-6"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-[#319AFF] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-20"
              />
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[#0084FF]/10 transition-transform duration-300 group-hover:scale-110">
                {f.icon}
              </div>
              <h3 className="font-display text-base font-bold tracking-[-0.01em] text-foreground">
                {f.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CONFORMITÉ — bandeau défilant (adaptation honnête du "Trusted by") */}
      <section className="mx-auto max-w-[1280px] px-6 pb-24">
        <p className="text-center text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Conçu pour la conformité du secteur public
        </p>
        <div className="relative mt-7 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
          <div className="flex w-max animate-marquee items-center gap-12 pr-12">
            {[...COMPLIANCE, ...COMPLIANCE].map((item, i) => (
              <ComplianceMark key={`${item.label}-${i}`} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="mx-auto max-w-[1280px] px-6 pb-28">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="glass-panel relative flex flex-col items-center gap-5 overflow-hidden rounded-[32px] px-8 py-14 text-center"
        >
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#319AFF] opacity-20 blur-[120px]"
            animate={reduce ? undefined : { scale: [1, 1.25, 1], opacity: [0.18, 0.28, 0.18] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <h2 className="relative font-display text-3xl font-bold tracking-[-0.02em] text-foreground">
            Prêt à cadrer votre projet ?
          </h2>
          <p className="relative max-w-md text-sm leading-relaxed text-muted-foreground">
            Décrivez le besoin, répondez aux questions, et laissez l&apos;outil
            objectiver la décision.
          </p>
          <button
            onClick={() => router.push("/projects/new")}
            className="glass-cta cta-sheen relative inline-flex h-[52px] items-center gap-3 overflow-hidden pl-6 pr-2 text-[15px] font-semibold"
          >
            <span className="relative z-10 flex items-center gap-3">
              Créer un projet
              <span className="flex size-9 items-center justify-center rounded-full bg-white text-[#0084FF]">
                <ArrowRight className="size-4" weight="bold" aria-hidden />
              </span>
            </span>
          </button>
        </motion.div>
      </section>
    </div>
  )
}

/** Fond "aurora" : blobs dégradés qui dérivent lentement (mélange ancienne + nouvelle version). */
function AuroraBackground({ reduce }: { reduce: boolean }) {
  const blobs = [
    {
      className: "-left-48 -top-48 h-[560px] w-[560px] bg-[#60B1FF] opacity-30",
      animate: { x: [0, 50, 0], y: [0, 36, 0], scale: [1, 1.12, 1] },
      duration: 20,
    },
    {
      className: "left-16 -top-28 h-[460px] w-[460px] bg-[#319AFF] opacity-25",
      animate: { x: [0, -40, 0], y: [0, 30, 0], scale: [1, 1.18, 1] },
      duration: 26,
    },
    {
      className:
        "right-0 top-40 h-[420px] w-[420px] bg-[#A5D2FF] opacity-25 lg:opacity-30",
      animate: { x: [0, -30, 0], y: [0, -40, 0], scale: [1, 1.1, 1] },
      duration: 23,
    },
  ]

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-[150px] ${b.className}`}
          animate={reduce ? undefined : b.animate}
          transition={{ duration: b.duration, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
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
    <div
      ref={ref}
      className="group border-b border-black/5 px-6 py-7 text-center transition-colors hover:bg-[#0084FF]/[0.04] last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 [&:nth-child(2)]:border-r-0 sm:[&:nth-child(2)]:border-r"
    >
      <div className="flex items-center justify-center font-display text-4xl font-bold tabular-nums text-foreground transition-transform duration-300 group-hover:scale-105">
        <SlidingNumber number={n} />
        {suffix ? <span>{suffix}</span> : null}
      </div>
      <div className="mt-1.5 text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Ancienne version sombre — restaurée à l'identique (mode sombre).    */
/* ------------------------------------------------------------------ */

const FEATURES_DARK = [
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

function LandingDark() {
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
            <StatDark key={s.label} {...s} reduce={!!reduce} />
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES_DARK.map((f, i) => (
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

function StatDark({
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
