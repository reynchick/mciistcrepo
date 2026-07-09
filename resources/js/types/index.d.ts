import type { ComponentType } from 'react'
import type { LucideProps, LucideIcon } from 'lucide-react'

export type BreadcrumbItem = {
  title: string
  href: string
}

export type NavItem = {
  title: string
  href: string | { url: string }
  icon?: ComponentType<LucideProps> | LucideIcon
}

export type MenuItem = {
  id: string
  label: string
  icon: LucideIcon
  route: string
  description?: string
  badge?: string | number
  submenu?: MenuItem[]
  roles: Array<'Administrator' | 'MCIIS Staff' | 'Faculty' | 'Student'>
  activePattern?: string | RegExp
}

export type UserRole = 'Administrator' | 'MCIIS Staff' | 'Faculty' | 'Student'

export interface NavMainProps {
  className?: string
  onNavigate?: (route: string) => void
  items?: MenuItem[] | NavItem[]
}

export type Role = {
  id: number
  name: string
}

export type User = {
  id: number
  first_name: string
  middle_name?: string | null
  last_name: string
  email: string
  avatar?: string | null
  roles?: Role[]
  role?: 'Administrator' | 'MCIIS Staff' | 'Faculty' | 'Student'
  student_id?: string | null
  faculty_id?: string | null
  contact_number?: string | null
  email_verified_at?: string | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  [key: string]: unknown
}

export type Auth = { user: User }

export type SharedData = {
  name?: string
  quote?: { message: string; author: string }
  sidebarOpen?: boolean
  auth: Auth
  [key: string]: unknown
}

export type Faculty = {
  id: number
  faculty_id?: string | null
  first_name: string
  middle_name?: string | null
  last_name: string
  email?: string | null
  position?: string | null
  designation?: string | null
  orcid?: string | null
  contact_number?: string | null
  educational_attainment?: string | null
  field_of_specialization?: string | null
  research_interest?: string | null
  name?: string | null
}

export type Adviser = {
  id: number
  name: string
  research_count?: number
}

export type Program = {
  id: number
  name: string
  code?: string | null
  description?: string | null
  research_count?: number
  researches_count?: number
}

export type Keyword = {
  id: number
  keyword: string
}

export type Researcher = {
  id: number
  research_id: number
  first_name: string
  middle_name?: string | null
  last_name: string
  email?: string | null
  name?: string | null
}

export type SDG = {
  id: number
  name: string
  description?: string | null
}

export type SRIG = {
  id: number
  name: string
  description?: string | null
}

export type Agenda = {
  id: number
  name: string
  description?: string | null
}

export type Research = {
  id: number
  research_title: string
  research_abstract: string
  published_year?: number | null
  published_month?: number | null
  program_id?: number | null
  research_adviser?: number | null
  research_approval_sheet?: string | null
  research_manuscript?: string | null
  researchers?: Researcher[]
  adviser?: Faculty | null
  program?: Program | null
  keywords?: Keyword[]
  panelists?: Faculty[]
  sdgs?: SDG[]
  srigs?: SRIG[]
  agendas?: Agenda[]
}
