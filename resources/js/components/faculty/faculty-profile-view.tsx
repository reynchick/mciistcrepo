import { Link, usePage } from '@inertiajs/react'
import { type Faculty, type Research, type SharedData } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Phone, Pencil, ExternalLink, FileText, Trash2, GraduationCap, Briefcase } from 'lucide-react'

interface Props {
  faculty: Faculty & { avatar?: string | null }
  advisedCount?: number
  paneledCount?: number
  recentResearches?: Research[]
}

export default function FacultyProfileView({ faculty, advisedCount = 0, paneledCount = 0, recentResearches = [] }: Props) {
  const { auth } = usePage<SharedData>().props
  const isAdmin = auth.user.roles?.some((r) => r.name === 'Administrator') ?? auth.user.role === 'Administrator'
  const isFaculty = auth.user.role === 'Faculty' || auth.user.roles?.some((r) => r.name === 'Faculty')
  const isOwn = isFaculty && auth.user.faculty_id && faculty.faculty_id && auth.user.faculty_id === faculty.faculty_id

  const name = [faculty.first_name, faculty.middle_name, faculty.last_name].filter(Boolean).join(' ')
  const initials = `${(faculty.first_name || '').charAt(0)}${(faculty.last_name || '').charAt(0)}`.toUpperCase() || 'F'
  const specializations = parseSpecializations(faculty.field_of_specialization)

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-20">
            <AvatarImage src={faculty.avatar ?? undefined} alt={name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{name}</h1>
            <p className="text-muted-foreground">{faculty.position || '-'}</p>
            {faculty.designation && <p className="text-sm">{faculty.designation}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {faculty.orcid && (
                <Badge asChild variant="outline">
                  <a href={`https://orcid.org/${faculty.orcid}`} target="_blank" rel="noreferrer">
                    ORCID <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Badge>
              )}
              {specializations.map((s) => (
                <Badge key={s} variant="secondary">{s}</Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/faculty">Back to Faculty</Link>
          </Button>
          {(isAdmin || isOwn) && (
            <Button size="sm" asChild>
              <Link href={`/faculty/${faculty.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit Profile</Link>
            </Button>
          )}
          {isAdmin && (
            <Button size="sm" variant="destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
          )}
        </div>
      </header>

      <section aria-labelledby="contact">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><FileText className="mr-2 h-5 w-5" />Contact</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              {faculty.email ? (
                <a href={`mailto:${faculty.email}`} className="inline-flex items-center gap-2 text-blue-600">
                  <Mail className="h-4 w-4" />{faculty.email}
                </a>
              ) : (
                <span className="text-muted-foreground">No email</span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              {faculty.contact_number ? (
                <a href={`tel:${faculty.contact_number.replace(/\s|-/g, '')}`} className="inline-flex items-center gap-2 text-blue-600">
                  <Phone className="h-4 w-4" />{faculty.contact_number}
                </a>
              ) : (
                <span className="text-muted-foreground">No contact</span>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="professional">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5" />Professional Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Position</p>
              <p>{faculty.position || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Designation</p>
              <p>{faculty.designation || '-'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Educational Attainment</p>
              <p>{faculty.educational_attainment || '-'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Research Interest</p>
              <p className="whitespace-pre-line">{faculty.research_interest || '-'}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="contributions">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><GraduationCap className="mr-2 h-5 w-5" />Research Contributions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Stat title="Advised" value={advisedCount} />
              <Stat title="Paneled" value={paneledCount} />
              <div className="flex items-end justify-end">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/research?adviser=${faculty.id}`}>View All Research</Link>
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {recentResearches.length === 0 ? (
                <p className="text-muted-foreground">No research projects yet</p>
              ) : (
                recentResearches.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-2">
                    <Link href={`/research/${r.id}`} className="line-clamp-1 hover:underline">{r.research_title}</Link>
                    <div className="flex items-center gap-2">
                      {r.program && <Badge variant="secondary">{r.program.name}</Badge>}
                      {typeof r.published_year === 'number' && <span className="text-xs text-muted-foreground">{r.published_year}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  )
}

function parseSpecializations(v?: string | null) {
  if (!v) return []
  return v.split(',').map((s) => s.trim()).filter(Boolean)
}
