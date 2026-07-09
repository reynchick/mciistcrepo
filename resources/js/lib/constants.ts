export const PROGRAMS = [
  'Bachelor of Science in Information Technology',
  'Bachelor of Science in Computer Science',
  'Bachelor of Library and Information Science',
  'Master of Library and Information Science',
  'Master in Information Technology',
] as const

export type Program = typeof PROGRAMS[number]

export const PROGRAM_CODES: Record<Program, string> = {
  'Bachelor of Science in Information Technology': 'BSIT',
  'Bachelor of Science in Computer Science': 'BSCS',
  'Bachelor of Library and Information Science': 'BLIS',
  'Master of Library and Information Science': 'MLIS',
  'Master in Information Technology': 'MIT',
}

export const PROGRAM_COLORS: Record<string, string> = {
  BSIT: 'blue',
  BSCS: 'green',
  BLIS: 'purple',
  MLIS: 'orange',
  MIT: 'red',
}

export const USER_ROLES = ['Administrator', 'MCIIS Staff', 'Faculty', 'Student'] as const

export type UserRole = typeof USER_ROLES[number]

export const ROLE_BADGES: Record<UserRole, { color: string; icon: string }> = {
  Administrator: { color: 'red', icon: 'Shield' },
  'MCIIS Staff': { color: 'blue', icon: 'Briefcase' },
  Faculty: { color: 'purple', icon: 'GraduationCap' },
  Student: { color: 'green', icon: 'User' },
}

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

export const MONTH_NUMBERS: Record<string, number> = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
}

export const MONTH_SHORT_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

export const REPORT_TYPES = {
  ABSTRACTS: 'abstracts',
  EXECUTIVE_SUMMARIES: 'executive_summaries',
  MATRIX: 'matrix',
  FACULTY_PRODUCTIVITY: 'faculty_productivity',
  THEMATIC_DISTRIBUTION: 'thematic_distribution',
  STATISTICS: 'statistics',
} as const

export type ReportType = typeof REPORT_TYPES[keyof typeof REPORT_TYPES]

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  [REPORT_TYPES.ABSTRACTS]: 'Abstract Compilation',
  [REPORT_TYPES.EXECUTIVE_SUMMARIES]: 'Executive Summary Compilation',
  [REPORT_TYPES.MATRIX]: 'Matrix Report',
  [REPORT_TYPES.FACULTY_PRODUCTIVITY]: 'Faculty Productivity Report',
  [REPORT_TYPES.THEMATIC_DISTRIBUTION]: 'Thematic Distribution Report',
  [REPORT_TYPES.STATISTICS]: 'Statistical Report',
}

export const EXPORT_FORMATS = ['pdf', 'excel', 'csv', 'word', 'json'] as const

export type ExportFormat = typeof EXPORT_FORMATS[number]

export const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  pdf: 'PDF Document',
  excel: 'Excel Spreadsheet',
  csv: 'CSV File',
  word: 'Word Document',
  json: 'JSON Data',
}

export const EXPORT_FORMAT_ICONS: Record<ExportFormat, string> = {
  pdf: 'FileText',
  excel: 'FileSpreadsheet',
  csv: 'FileText',
  word: 'FileText',
  json: 'FileCode',
}

export const ACTION_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  MODIFY: 'modify',
  VIEW: 'view',
  ACCESS: 'access',
  SEARCH: 'search',
  EXPORT: 'export',
} as const

export type ActionType = typeof ACTION_TYPES[keyof typeof ACTION_TYPES]

export const ACTION_TYPE_COLORS: Record<string, string> = {
  create: 'green',
  update: 'blue',
  delete: 'red',
  modify: 'yellow',
  view: 'gray',
  access: 'purple',
}

export const VALIDATION_LIMITS = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  MIN_TITLE_LENGTH: 10,
  MAX_TITLE_LENGTH: 200,
  MIN_ABSTRACT_LENGTH: 50,
  MAX_ABSTRACT_LENGTH: 5000,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,
  MAX_PDF_SIZE: 20 * 1024 * 1024,
  MIN_KEYWORDS: 3,
  MAX_KEYWORDS: 10,
  MIN_RESEARCHERS: 1,
  MAX_RESEARCHERS: 10,
  MAX_PANELISTS: 5,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'] as const
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf'] as const

export const FILE_TYPE_EXTENSIONS: Record<string, string[]> = {
  image: ['.jpg', '.jpeg', '.png'],
  document: ['.pdf'],
  spreadsheet: ['.xlsx', '.xls', '.csv'],
  word: ['.docx', '.doc'],
}

export const USEP_EMAIL_DOMAIN = 'usep.edu.ph'
export const USEP_EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@usep\.edu\.ph$/

export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_LONG: 'MMMM dd, yyyy',
  DISPLAY_TIME: "MMM dd, yyyy 'at' h:mm a",
  ISO: 'yyyy-MM-dd',
  MONTH_YEAR: 'MMMM yyyy',
} as const

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const

export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  VALIDATION: 500,
  AUTOSAVE: 2000,
  FILTER: 300,
} as const

export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const
