import { dashboard, login, register } from '@/routes'
import { type SharedData } from '@/types'
import { Head, Link, router, usePage } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
// import NewsCarousel from '@/components/news-carousel'
import {
  ArrowRight,
  BookOpen,
  ChartNoAxesCombined,
  Database,
  FolderOpen,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import NewsCarousel from '@/components/dashboard/news-carousel'

function DarkVeil() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-950/80 to-slate-900/80" />
  )
}

// Research Archive card content — hoisted to module scope since these are
// static and shouldn't be redeclared on every render of Welcome().
const marqueeRowOne = [
  'Application Systems Development',
  'ICT-centric Trainings and Consultations',
  'Applied Data Science',
  'Software Engineering',
  'Research and Development',
  'Systems Design',
]

const marqueeRowTwo = [
  'Data Analytics',
  'Consultation Services',
  'Technical Training',
  'Systems Integration',
  'Archive and Records',
  'Development Workflow',
]

// Example queries the search bar types out on its own when idle — gives
// people a sense of what it's for before they've typed anything.
const searchExamples = [
  'Find capstone projects on computer vision...',
  'Search theses about machine learning...',
  'Discover research aligned with SDG 9...',
]

function MarqueeRow({
  items,
  direction,
  duration,
}: {
  items: string[]
  direction: 'left' | 'right'
  duration: number
}) {
  return (
    <div className="flex w-max gap-3" style={{ animation: `scroll-${direction} ${duration}s linear infinite` }}>
      {[...items, ...items].map((label, i) => (
        <span
          key={`${label}-${i}`}
          className="whitespace-nowrap rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
        >
          {label}
        </span>
      ))}
    </div>
  )
}

// Animated-placeholder search bar. Idle: cycles through example queries with
// a typewriter effect. Focused / has a value: animation stops and the field
// behaves like a normal input. Enter submits and routes to the dashboard
// with the query as a `q` param, same as any other Inertia navigation.
function HeroSearchBar() {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [placeholder, setPlaceholder] = useState('')
  const [exampleIndex, setExampleIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Freeze the animation once the person is actually interacting —
    // no point typewriter-cycling behind real input.
    if (focused || value) return

    const current = searchExamples[exampleIndex]
    const typingSpeed = deleting ? 28 : 55
    const pauseBeforeDelete = 1400

    if (!deleting && charIndex === current.length) {
      const pause = setTimeout(() => setDeleting(true), pauseBeforeDelete)
      return () => clearTimeout(pause)
    }

    if (deleting && charIndex === 0) {
      setDeleting(false)
      setExampleIndex((i) => (i + 1) % searchExamples.length)
      return
    }

    const step = setTimeout(() => {
      const nextIndex = deleting ? charIndex - 1 : charIndex + 1
      setPlaceholder(current.slice(0, nextIndex))
      setCharIndex(nextIndex)
    }, typingSpeed)

    return () => clearTimeout(step)
  }, [charIndex, deleting, exampleIndex, focused, value])

  const handleSubmit = () => {
    const query = value.trim()
    if (!query) {
      inputRef.current?.focus()
      return
    }
    router.get(dashboard().url, { q: query })
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <div
        className={`flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm transition-shadow duration-300 dark:border-neutral-800 dark:bg-neutral-900 ${
          focused ? 'shadow-md' : ''
        }`}
      >
        <Search className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder={placeholder}
          aria-label="Search the repository"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-50 dark:placeholder:text-slate-500"
        />

        <button
          type="button"
          onClick={handleSubmit}
          aria-label="Search"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors duration-200 hover:bg-slate-900 hover:text-white dark:text-slate-500 dark:hover:bg-white dark:hover:text-slate-900"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function Welcome() {
  const { auth } = usePage<SharedData>().props

  // "Research Archive" is the flagship capability — everything else in the
  // repository exists to feed it or surface what's inside it — so it gets
  // its own showcase card instead of being just another tile in a grid.
  const flagshipFeature = {
    icon: FolderOpen,
    title: 'Research Center Services',
    desc: 'The Mindanao Center for Informatics and Intelligent Systems (MCIIS) serves as a hub for research excellence, innovation, and collaboration and provides support for the development, dissemination, and preservation of scholarly work',
    points: [ 'Institutional Research Repository Services','Industry, Government, and Academic Research Collaboration', 'Innovation, and Knowledge and Technology Transfer'],
  }

  const supportingFeatures = [
    {
      icon: Database,
      title: 'Easy Submission',
      desc: 'Submit research records with complete metadata — authors, programs, publication years, and attached files.',
    },
    {
      icon: Search,
      title: 'Advanced Discovery',
      desc: 'Search and browse research outputs by keyword, program, year, author, or research category.',
    },
    {
      icon: ChartNoAxesCombined,
      title: 'Repository Analytics',
      desc: 'Monitor research output, frequently accessed studies, popular keywords, and program-level trends.',
    },
    {
      icon: Users,
      title: 'Research Alignment',
      desc: 'Highlight how research contributes to SDGs, SRIG priorities, and institutional research agendas.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Access',
      desc: 'Role-based access for administrators, faculty, students, researchers, and repository visitors.',
    },
  ]

  return (
    <>
      <Head title="MCIIS Repository" />

      <div className="min-h-screen overflow-x-hidden bg-slate-50/50 font-sans text-slate-900 selection:bg-black selection:text-white dark:bg-black dark:text-slate-50 dark:selection:bg-white dark:selection:text-black">
        <nav className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/75 shadow-sm shadow-slate-950/[0.02] backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:border-neutral-800/70 dark:bg-black/75 dark:shadow-black/10 dark:supports-[backdrop-filter]:bg-black/60">
          <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-6">
            <div className="flex w-[240px] items-center gap-3">
              <img
                src="/mciislogo_2.png"
                alt="MCIIS Repository Logo"
                className="h-9 w-9 object-contain"
              />
              <span className="text-lg font-bold leading-none tracking-tight text-slate-900 dark:text-slate-50">
                MCIIS Repository
              </span>
            </div>

            <div className="hidden flex-1 items-center justify-center gap-0.5 md:flex">
              {[
                { label: 'Home', href: '#home' },
                { label: 'Repository Features', href: '#features' },
                { label: 'About Us', href: '#about' },
              ].map((item) => (
                <Link key={item.label} href={item.href}>
                  <Button
                    variant="ghost"
                    className="rounded-full px-3 text-sm font-medium text-slate-600 transition-all duration-300 hover:bg-slate-100/80 hover:text-black dark:text-slate-300 dark:hover:bg-neutral-900/80 dark:hover:text-white"
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>

            <div className="flex w-[240px] items-center justify-end gap-3">
              {auth.user ? (
                <Link href={dashboard()}>
                  <Button className="cursor-pointer rounded-full bg-slate-900 px-6 py-2 text-xs font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href={login()}>
                    <Button
                      variant="outline"
                      className="cursor-pointer rounded-full px-4 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-lg dark:border-neutral-800 dark:text-slate-200 dark:hover:bg-neutral-900"
                    >
                      Log In
                    </Button>
                  </Link>

                </>
              )}
            </div>
          </div>
        </nav>

        <section
          id="home"
          className="mx-auto flex w-full max-w-[1400px] flex-col items-center justify-center gap-8 px-6 pb-16 pt-24 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000"
        >
          <div className="relative max-w-4xl space-y-8">
            <div className="absolute left-1/2 top-1/2 -z-10 h-[380px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-100/60 via-violet-100/50 to-emerald-100/50 blur-[110px] dark:from-blue-500/10 dark:via-violet-500/10 dark:to-emerald-500/10" />
            <div className="absolute left-1/2 top-1/2 -z-10 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/50 blur-[100px] mix-blend-multiply dark:bg-blue-500/10 dark:mix-blend-plus-lighter" />

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 shadow-sm shadow-slate-950/5 animate-in fade-in zoom-in-95 duration-700 dark:border-neutral-800 dark:bg-black/90 dark:shadow-black/10">
              <span className="relative flex h-2 w-2"><span className="absolute inset-0 animate-ping rounded-full bg-emerald-400" /><span className="relative h-2 w-2 rounded-full bg-emerald-500" /></span>
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
                Research Repository
              </span>
            </div>

            <h1 className="text-balance text-5xl font-bold leading-[1.05] animate-in fade-in slide-in-from-bottom-4 duration-700 tracking-tight text-slate-900 sm:text-6xl md:text-7xl dark:text-slate-50">
              MCIIS <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-slate-700 to-black bg-clip-text text-transparent dark:from-slate-300 dark:to-white">
                Research Repository
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-balance text-lg leading-relaxed text-slate-600 md:text-xl dark:text-slate-400">
              A centralized digital repository for discovering, preserving, and
              accessing research outputs from the MCIIS academic community.
            </p>

            <div className="flex justify-center pt-4">
              <HeroSearchBar />
            </div>
          </div>
        </section>

        <div className="w-full px-6">
          <div className="mx-auto h-px max-w-[1400px] bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-800" />
        </div>

        {/* ============ REPOSITORY FEATURES ============
            Flagship + spec-list layout instead of a uniform card grid:
            "Research Archive" is the reason the other five features exist,
            so it gets a showcase card. The rest read like a spec sheet —
            scannable rows, not six competing boxes of equal weight. */}
        <section
          id="features"
          className="mx-auto w-full max-w-[1400px] px-6 pb-16 pt-16"
        >
          <div className="mb-16 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl dark:text-slate-50">
                Repository Features
              </h2>
              <div className="h-1 w-20 rounded-full bg-black dark:bg-white" />
            </div>

            <p className="hidden max-w-md text-right leading-relaxed text-slate-500 md:block dark:text-slate-400">
              Built to preserve academic knowledge and make MCIIS research
              easier to discover, access, and measure.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            {/* Flagship card */}
            <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-10 shadow-sm transition-shadow duration-300 hover:shadow-md lg:col-span-2 dark:border-white/10 dark:bg-neutral-900">
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br from-slate-900/[0.04] to-transparent blur-2xl transition-transform duration-700 ease-out will-change-transform group-hover:scale-125 dark:from-white/[0.06]" />

              <div className="relative z-10 flex h-full flex-col justify-between gap-6">
                <div className="space-y-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 transition-transform duration-300 group-hover:scale-110 dark:border-white/10 dark:bg-white/10">
                    <flagshipFeature.icon className="h-5 w-5 text-slate-900 dark:text-white" />
                  </div>

                  <div className="space-y-3">
                    <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Core Capability
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {flagshipFeature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {flagshipFeature.desc}
                    </p>
                  </div>

                  {/* Ambient marquee, embedded in the same dark card — sits
                      between the description and the bullet list. */}
                  <div
                    className="-mx-10 overflow-hidden py-1"
                    style={{
                      maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
                      WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
                    }}
                  >
                    <div className="space-y-3">
                      <MarqueeRow items={marqueeRowOne} direction="left" duration={22} />
                      <MarqueeRow items={marqueeRowTwo} direction="right" duration={26} />
                    </div>
                  </div>
                </div>

                <ul className="space-y-3 border-t border-slate-200 pt-6 dark:border-white/10">
                  {flagshipFeature.points.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Supporting features, as a scannable list rather than a card grid */}
            <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-3 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950">
              {supportingFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className="group flex items-start gap-4 px-6 py-6 transition-colors duration-300 hover:bg-slate-50/80 dark:hover:bg-slate-900/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 transition-colors duration-300 group-hover:border-slate-900 group-hover:bg-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:group-hover:border-white dark:group-hover:bg-white">
                    <feature.icon className="h-4 w-4 text-slate-900 transition-colors duration-300 group-hover:text-white dark:text-slate-100 dark:group-hover:text-slate-900" />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ ABOUT MCIIS ============ */}
        <section
          id="about"
          className="w-full border-y border-slate-100 bg-white pb-12 pt-4 dark:border-neutral-800 dark:bg-black"
        >
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-6 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
           {/* Remove space-y completely here so it stops overriding custom margins */}
          <div> 
            <span className="block mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              About the Center
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl dark:text-slate-50">
              Mindanao Center for Informatics and Intelligent Systems
            </h2>
          </div>

            <div className="space-y-6 text-justify text-lg leading-8 text-slate-600 dark:text-slate-300">
              <p>
               The Mindanao Center for Informatics and Intelligent Systems is a multidisciplinary research hub which 
               aims to develop modern informatic tools and conduct theoretical and applied research in various aspects 
               of autonomous systems, machine learning, and computer vision.
              </p>

              <p>
                This center serves as a gender-responsive and inclusive research facility for multidisciplinary 
                interaction and fosters penta helix synergy with the academe, industry, government, and society. 
                MCIIS especially corresponds to the SDG 5 on gender equality and SDG 9 on building resilient infrastructure, 
                promoting inclusive and sustainable industrialization, and fostering innovation.
              </p>
            </div>

            {/* News / current articles — sliding card-stack carousel */}
            <div className="w-full pt-2">
              <span className="block text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Latest News
              </span>
              <NewsCarousel />
            </div>

            <Button
              variant="outline"
              className= "cursor-pointer rounded-full border-slate-300 px-8 py-5 text-sm font-medium text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-900 hover:text-white hover:border-slate-900 hover:shadow-md dark:border-neutral-800 dark:text-slate-300 dark:hover:bg-white dark:hover:text-slate-900 dark:hover:border-white"
            >
              <a
                href="https://www.usep.edu.ph/ic/research-center/"
                target="_blank"
                rel="noopener noreferrer"
                
              >
                Visit the MCIIS Website
              </a>
            </Button>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-slate-50 pb-20 pt-8 dark:border-neutral-800 dark:bg-neutral-950/40">
          <div className="mx-auto max-w-[1400px] px-6 text-center">
            <div className="mb-10 flex flex-wrap items-center justify-center gap-12 opacity-60 md:gap-24 dark:opacity-70">
              {[
                { src: '/usep_logo.png', alt: 'USeP' },
                { src: '/bagong_pilipinas_logo.png', alt: 'Bagong Pilipinas' },
                { src: '/pqa_logo.png', alt: 'PQA' },
                { src: '/iso_9001_logo.png', alt: 'ISO 9001' },
              ].map((logo) => (
                <div key={logo.alt} className="group relative">
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    className="h-16 w-auto object-contain grayscale transition-all duration-500 ease-out group-hover:scale-110 group-hover:grayscale-0 md:h-20 dark:brightness-0 dark:invert dark:group-hover:brightness-100 dark:group-hover:invert-0"
                  />
                </div>
              ))}
            </div>

            <p className="text-sm font-semibold uppercase tracking-widest text-gray-600 dark:text-slate-400">
              Preserving Knowledge. Empowering Research.
            </p>
          </div>
        </section>

        <section className="relative overflow-hidden bg-slate-950 py-24 text-white">
          <div className="absolute inset-0 z-0 opacity-30">
            <DarkVeil />
          </div>

          <div className="relative z-10 mx-auto max-w-[1400px] px-6">
            <div className="grid grid-cols-1 gap-12 text-left md:grid-cols-3 lg:grid-cols-5">
              {[
                {
                  title: 'Repository Vision',
                  content:
                    'To be the leading university-based research center for informatics and intelligent systems in the ASEAN region.',
                },
                {
                  title: 'Repository Mission',
                  content:
                    'To preserve, organize, and provide reliable access to scholarly works while supporting research discovery, collaboration, and evidence-based decisions.',
                },
                {
                  title: 'Repository Goals',
                  list: [
                    'Preserve academic research outputs.',
                    'Improve access to scholarly resources.',
                    'Support research visibility and utilization.',
                    'Provide reliable research analytics.',
                    'Promote institutional knowledge sharing.',
                  ],
                },
                {
                  title: 'Core Values',
                  list: [
                    'Accessibility',
                    'Integrity',
                    'Collaboration',
                    'Innovation',
                    'Excellence',
                  ],
                },
                {
                  title: 'Core Focus',
                  content:
                    'Building an organized, searchable, and sustainable knowledge base for MCIIS research.',
                },
              ].map((item) => (
                <div key={item.title} className="space-y-6">
                  <h3 className="border-l-2 border-yellow-500 pl-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                    {item.title}
                  </h3>

                  {item.list ? (
                    <ul className="space-y-3 text-sm leading-relaxed text-slate-300">
                      {item.list.map((listItem) => (
                        <li
                          key={listItem}
                          className="cursor-default transition-colors hover:text-white"
                        >
                          • {listItem}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="cursor-default text-sm leading-relaxed text-slate-300 transition-colors hover:text-white">
                      {item.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-200 bg-white dark:border-neutral-800 dark:bg-black">
          <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-6 px-6 py-12 md:flex-row">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-slate-50 p-2 dark:bg-neutral-950">
                <BookOpen className="h-8 w-8 text-slate-800 dark:text-slate-200" />
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  MCIIS Repository
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Research, Innovation, and Knowledge Management
                </span>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex gap-6">
                <Link
                  href="#"
                  className="text-xs font-medium text-slate-500 transition-colors hover:text-black dark:text-slate-400 dark:hover:text-white"
                >
                  Privacy Policy
                </Link>

                <Link
                  href="#"
                  className="text-xs font-medium text-slate-500 transition-colors hover:text-black dark:text-slate-400 dark:hover:text-white"
                >
                  Terms of Service
                </Link>
              </div>

              <div className="text-xs text-slate-400 dark:text-slate-500">
                © 2025 MCIIS Repository
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}