import { dashboard, login, register } from '@/routes'
import { type SharedData } from '@/types'
import { Head, Link, usePage } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  BookOpen,
  ChartNoAxesCombined,
  Database,
  Eye,
  FolderOpen,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { JSX, useEffect, useState } from 'react'

type StackProps = {
  randomRotation?: boolean
  sensitivity?: number
  sendToBackOnClick?: boolean
  cards: JSX.Element[]
}

function Stack({ cards, randomRotation = false, sendToBackOnClick = true }: StackProps) {
  const [activeCard, setActiveCard] = useState(0)

  useEffect(() => {
    if (cards.length < 2) return
    const timer = window.setInterval(() => setActiveCard((current) => (current + 1) % cards.length), 4200)
    return () => window.clearInterval(timer)
  }, [cards.length])

  return (
    <div className="relative h-full w-full" aria-label="MCIIS research highlights">
      {cards.map((card, index) => {
        const position = (index - activeCard + cards.length) % cards.length
        const rotation = randomRotation ? (position - 2) * 2.5 : 0
        return (
          <button
            key={index}
            type="button"
            aria-label={`Show research highlight ${index + 1}`}
            onClick={() => sendToBackOnClick && setActiveCard((index + 1) % cards.length)}
            className="absolute inset-0 cursor-pointer rounded-[24px] text-left outline-none transition-[transform,opacity,filter] duration-700 ease-out focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-4"
            style={{ transform: `translate(${position * 10}px, ${-position * 10}px) rotate(${rotation}deg) scale(${1 - position * 0.025})`, opacity: Math.max(0.4, 1 - position * 0.18), filter: `brightness(${1 - position * 0.06})`, zIndex: cards.length - position }}
          >
            {card}
          </button>
        )
      })}
    </div>
  )
}

function DarkVeil() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-950/80 to-slate-900/80" />
  )
}

export default function Welcome() {
  const { auth } = usePage<SharedData>().props

  const images = [
    '/welcome-img2.jpg',
    '/welcome-img3.jpg',
    '/welcome-img4.jpg',
    '/welcome-img5.jpg',
    '/welcome-img-6.png',
    '/welcome-img-8.png',
    '/welcome-img-7.png',
  ]

  const features = [
    {
      icon: FolderOpen,
      title: 'Research Archive',
      desc: 'Store and organize theses, capstone projects, research papers, and other academic outputs in one repository.',
    },
    {
      icon: Database,
      title: 'Easy Submission',
      desc: 'Submit research records with complete metadata, authors, programs, publication years, and attached files.',
    },
    {
      icon: Search,
      title: 'Advanced Discovery',
      desc: 'Search and browse research outputs using keywords, programs, years, authors, and research categories.',
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
      desc: 'Provide role-based access for administrators, faculty, students, researchers, and repository visitors.',
    },
  ]

  return (
    <>
      <Head title="MCIIS Repository" />

      <div className="min-h-screen overflow-x-hidden bg-slate-50/50 font-sans text-slate-900 selection:bg-black selection:text-white">
        <nav className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/75 shadow-sm shadow-slate-950/[0.02] backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
          <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-6">
            <div className="flex w-[240px] items-center gap-3">
              <img
                src="/ciclogo.png"
                alt="MCIIS Repository Logo"
                className="h-9 w-9 object-contain"
              />
              <span className="text-lg font-bold leading-none tracking-tight text-slate-900">
                MCIIS Repository
              </span>
            </div>

            <div className="hidden flex-1 items-center justify-center gap-1 md:flex">
              {[
                { label: 'Home', href: '#home' },
                { label: 'Repository Features', href: '#features' },
                { label: 'About Us', href: '#about' },
              ].map((item) => (
                <Link key={item.label} href={item.href}>
                  <Button
                    variant="ghost"
                    className="rounded-full px-5 text-sm font-medium text-slate-600 transition-all duration-300 hover:bg-slate-100/80 hover:text-black"
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>

            <div className="flex w-[240px] items-center justify-end gap-3">
              {auth.user ? (
                <Link href={dashboard()}>
                  <Button className="cursor-pointer rounded-full bg-slate-900 px-6 py-2 text-xs font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href={login()}>
                    <Button
                      variant="outline"
                      className="cursor-pointer rounded-full px-4 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-lg"
                    >
                      Log In
                    </Button>
                  </Link>

                  <Link href={register()}>
                    <Button className="cursor-pointer rounded-full bg-slate-900 px-6 py-2 text-xs font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg">
                      Register
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>

        <section
          id="home"
          className="mx-auto flex w-full max-w-[1400px] flex-col items-center justify-center gap-8 px-6 pb-32 pt-24 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000"
        >
          <div className="relative max-w-4xl space-y-8"><div className="absolute left-1/2 top-1/2 -z-10 h-[380px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-100/60 via-violet-100/50 to-emerald-100/50 blur-[110px]" />
            <div className="absolute left-1/2 top-1/2 -z-10 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/50 blur-[100px] mix-blend-multiply" />

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 shadow-sm shadow-slate-950/5 animate-in fade-in zoom-in-95 duration-700">
              <span className="relative flex h-2 w-2"><span className="absolute inset-0 animate-ping rounded-full bg-emerald-400" /><span className="relative h-2 w-2 rounded-full bg-emerald-500" /></span>
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Research Repository
              </span>
            </div>

            <h1 className="text-balance text-5xl font-bold leading-[1.05] animate-in fade-in slide-in-from-bottom-4 duration-700 tracking-tight text-slate-900 sm:text-6xl md:text-7xl">
              MCIIS <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-slate-700 to-black bg-clip-text text-transparent">
                Research Repository
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-balance text-lg leading-relaxed text-slate-600 md:text-xl">
              A centralized digital repository for discovering, preserving, and
              accessing research outputs from the MCIIS academic community.
            </p>

            <div className="flex justify-center gap-4 pt-4">
              <Link href="#features">
                <Button
                  size="lg"
                  className="group h-12 rounded-full bg-slate-900 px-8 shadow-lg shadow-slate-900/15 transition-all duration-300 hover:-translate-y-1 hover:bg-slate-800 hover:shadow-xl"
                >
                  Explore Repository
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <div className="w-full px-6">
          <div className="mx-auto h-px max-w-[1400px] bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        </div>

        <section
          id="features"
          className="mx-auto w-full max-w-[1400px] px-6 py-32"
        >
          <div className="mb-16 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Repository Features
              </h2>
              <div className="h-1 w-20 rounded-full bg-black" />
            </div>

            <p className="hidden max-w-md text-right leading-relaxed text-slate-500 md:block">
              Built to preserve academic knowledge and make MCIIS research
              easier to discover, access, and measure.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-8 shadow-sm shadow-slate-950/[0.03] transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative z-10 flex flex-col gap-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 transition-colors duration-300 group-hover:scale-110 group-hover:bg-slate-900 group-hover:rotate-3">
                    <feature.icon className="h-6 w-6 text-slate-900 transition-colors duration-300 group-hover:text-white" />
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-slate-900">
                      {feature.title}
                    </h3>

                    <p className="text-sm leading-relaxed text-slate-500 transition-colors group-hover:text-slate-600">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="about"
          className="w-full border-y border-slate-100 bg-white py-32"
        >
          <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-20 px-6 lg:flex-row">
            <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                About the MCIIS Repository
              </h2>

              <div className="space-y-6 text-lg leading-8 text-slate-600">
                <p>
                  The Mindanao Center for Informatics and Intelligent Systems is a multidisciplinary 
                  research hub which aims to develop modern informatic tools and conduct theoretical and applied 
                  research in various aspects of autonomous systems, machine learning, and computer vision.
                </p>

                <p>
                  This center serves as a gender-responsive and inclusive research facility for multidisciplinary interaction and fosters 
                  penta helix synergy with the academe, industry, government, and society. MCIIS especially corresponds to the SDG 5 on gender 
                  equality and SDG 9 on building resilient infrastructure, promoting inclusive and sustainable industrialization, and fostering innovation.
                </p>

              </div>

              <Button
                variant="outline"
                className="mt-4 rounded-full border-slate-300 px-8 hover:bg-slate-50 hover:text-black"
              >
                <a
                  href="https://www.usep.edu.ph/ic/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn More
                </a>
              </Button>
            </div>

            <div className="flex w-full flex-1 justify-center lg:justify-end animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
              <div className="relative flex aspect-square w-full max-w-[500px] items-center justify-center">
                <div className="cursor-pointer scale-75 transition-transform duration-500 hover:scale-[0.8] sm:scale-90 sm:hover:scale-95 md:scale-100 md:hover:scale-105">
                  <div
                    style={{
                      width: 500,
                      height: 500,
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                      borderRadius: '24px',
                      background: 'white',
                    }}
                  >
                    <Stack
                      randomRotation
                      sensitivity={150}
                      sendToBackOnClick
                      cards={images.map((src, index) => (
                        <img
                          key={src}
                          src={src}
                          alt={`MCIIS research highlight ${index + 1}`}
                          className="h-full w-full rounded-[24px] border border-gray-100 object-cover"
                        />
                      ))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-slate-50 py-20">
          <div className="mx-auto max-w-[1400px] px-6 text-center">
            <div className="mb-10 flex flex-wrap items-center justify-center gap-12 opacity-60 md:gap-24">
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
                    className="h-16 w-auto object-contain grayscale transition-all duration-500 ease-out group-hover:scale-110 group-hover:grayscale-0 md:h-20"
                  />
                </div>
              ))}
            </div>

            <p className="text-sm font-semibold uppercase tracking-widest text-gray-600">
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
                    'A trusted digital repository that makes MCIIS research visible, accessible, and valuable to the academic community and beyond.',
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

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-6 px-6 py-12 md:flex-row">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-slate-50 p-2">
                <BookOpen className="h-8 w-8 text-slate-800" />
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-800">
                  MCIIS Repository
                </span>
                <span className="text-xs text-slate-500">
                  Research, Innovation, and Knowledge Management
                </span>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex gap-6">
                <Link
                  href="#"
                  className="text-xs font-medium text-slate-500 transition-colors hover:text-black"
                >
                  Privacy Policy
                </Link>

                <Link
                  href="#"
                  className="text-xs font-medium text-slate-500 transition-colors hover:text-black"
                >
                  Terms of Service
                </Link>
              </div>

              <div className="text-xs text-slate-400">
                © 2025 MCIIS Repository
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}