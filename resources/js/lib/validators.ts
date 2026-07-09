import { USEP_EMAIL_PATTERN, VALIDATION_LIMITS } from '@/lib/constants'

/**
 * Checks if a string is a syntactically valid email address.
 */
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

/**
 * Validates that an email belongs to the USeP domain.
 */
export function isValidUSePEmail(email: string): boolean {
  return USEP_EMAIL_PATTERN.test(String(email).toLowerCase())
}

/**
 * Returns a user-friendly error message if email is invalid, otherwise null.
 */
export function getEmailValidationError(email: string): string | null {
  if (!email) return 'Email is required'
  if (!isValidEmail(email)) return 'Invalid email format'
  if (!isValidUSePEmail(email)) return 'Must be a valid USeP email (@usep.edu.ph)'
  return null
}

/**
 * Validates name by length and allowed characters (letters, spaces, hyphens, apostrophes).
 */
export function isValidName(name: string, minLength = 2, maxLength = 50): boolean {
  if (!name || name.trim().length < minLength) return false
  if (name.length > maxLength) return false
  const re = /^[a-zA-Z\s'-]+$/
  return re.test(name)
}

/**
 * Returns a user-friendly error message for invalid names, otherwise null.
 */
export function getNameValidationError(name: string, fieldName = 'Name', required = true): string | null {
  if (!name || name.trim() === '') return required ? `${fieldName} is required` : null
  if (name.length < 2) return `${fieldName} must be at least 2 characters`
  if (name.length > 50) return `${fieldName} must not exceed 50 characters`
  if (!/^[a-zA-Z\s'-]+$/.test(name)) return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`
  return null
}

/**
 * Password strength evaluation result.
 */
export interface PasswordStrength {
  score: number
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong'
  feedback: string[]
}

/**
 * Validates password against length and character class requirements.
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (password.length < VALIDATION_LIMITS.MIN_PASSWORD_LENGTH) errors.push('Password must be at least 8 characters long')
  if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter')
  if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter')
  if (!/[0-9]/.test(password)) errors.push('Password must contain at least one number')
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Password must contain at least one special character')
  return { valid: errors.length === 0, errors }
}

/**
 * Computes a simple password strength score and feedback.
 */
export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0
  const feedback: string[] = []
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++
  let label: PasswordStrength['label']
  if (score <= 1) {
    label = 'Very Weak'
    feedback.push('Try adding more characters and mixing character types')
  } else if (score === 2) {
    label = 'Weak'
    feedback.push('Add uppercase, lowercase, numbers, and symbols')
  } else if (score === 3) {
    label = 'Fair'
    feedback.push('Consider adding more variety')
  } else if (score === 4) {
    label = 'Good'
  } else {
    label = 'Strong'
  }
  return { score, label, feedback }
}

/**
 * Validates a Philippine mobile number in common formats.
 */
export function isValidPhilippinePhone(phone: string): boolean {
  const cleaned = String(phone).replace(/\D/g, '')
  if (cleaned.length === 11 && cleaned.startsWith('09')) return true
  if (cleaned.length === 12 && cleaned.startsWith('639')) return true
  return false
}

/**
 * Normalizes a Philippine mobile number to +63 format when possible.
 */
export function formatPhilippinePhone(phone: string): string {
  const cleaned = String(phone).replace(/\D/g, '')
  if (cleaned.startsWith('09') && cleaned.length === 11) return `+63${cleaned.substring(1)}`
  if (cleaned.startsWith('639') && cleaned.length === 12) return `+${cleaned}`
  return phone
}

/**
 * Returns a user-friendly error for invalid Philippine mobile numbers.
 */
export function getPhoneValidationError(phone: string): string | null {
  if (!phone) return 'Contact number is required'
  if (!isValidPhilippinePhone(phone)) return 'Invalid Philippine mobile number format (must start with 09 or +639)'
  return null
}

/**
 * Validates ORCID identifier format (supports check digit X).
 */
export function isValidORCID(orcid: string): boolean {
  const re = /^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/
  return re.test(orcid)
}

/**
 * Formats a 16-character ORCID into hyphenated form.
 */
export function formatORCID(orcid: string): string {
  const cleaned = String(orcid).replace(/[^0-9X]/g, '')
  if (cleaned.length === 16) {
    return `${cleaned.substring(0, 4)}-${cleaned.substring(4, 8)}-${cleaned.substring(8, 12)}-${cleaned.substring(12)}`
  }
  return orcid
}

/**
 * Checks if a file MIME type is among allowed types.
 */
export function isValidFileType(file: File, allowedTypes: readonly string[]): boolean {
  return allowedTypes.includes(file.type)
}

/**
 * Checks if a file size does not exceed the maximum size in bytes.
 */
export function isValidFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize
}

/**
 * Returns a descriptive validation error for a file input.
 */
export function getFileValidationError(file: File | null | undefined, allowedTypes: readonly string[], maxSize: number, fieldName = 'File'): string | null {
  if (!file) return `${fieldName} is required`
  if (!isValidFileType(file, allowedTypes)) {
    const allowedExtensions = allowedTypes.map((t) => `.${String(t.split('/')[1] || '').trim()}`).join(', ')
    return `${fieldName} must be one of: ${allowedExtensions}`
  }
  if (!isValidFileSize(file, maxSize)) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1)
    return `${fieldName} must not exceed ${maxSizeMB}MB`
  }
  return null
}

/**
 * Validates research title by length thresholds.
 */
export function isValidResearchTitle(title: string): boolean {
  if (!title || title.trim().length < VALIDATION_LIMITS.MIN_TITLE_LENGTH) return false
  if (title.length > VALIDATION_LIMITS.MAX_TITLE_LENGTH) return false
  return true
}

/**
 * Returns a user-friendly error for invalid research titles.
 */
export function getResearchTitleValidationError(title: string): string | null {
  if (!title || title.trim() === '') return 'Research title is required'
  if (title.trim().length < VALIDATION_LIMITS.MIN_TITLE_LENGTH) return 'Research title must be at least 10 characters'
  if (title.length > VALIDATION_LIMITS.MAX_TITLE_LENGTH) return 'Research title must not exceed 200 characters'
  return null
}

/**
 * Validates a keyword by length and allowed characters (letters, numbers, spaces, hyphens).
 */
export function isValidKeyword(keyword: string): boolean {
  if (!keyword || keyword.trim().length < VALIDATION_LIMITS.MIN_NAME_LENGTH) return false
  if (keyword.length > VALIDATION_LIMITS.MAX_NAME_LENGTH) return false
  return /^[a-zA-Z0-9\s-]+$/.test(keyword)
}

/**
 * Normalizes a keyword to lowercase single-spaced string.
 */
export function normalizeKeyword(keyword: string): string {
  return keyword.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Checks if a value is present (string non-empty, array non-empty, otherwise not null/undefined).
 */
export function isRequired(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

/**
 * Minimum string length (ignores surrounding whitespace).
 */
export function isMinLength(value: string, min: number): boolean {
  return value.trim().length >= min
}

/**
 * Maximum string length.
 */
export function isMaxLength(value: string, max: number): boolean {
  return value.length <= max
}

/**
 * Checks if a number is within a closed interval [min, max].
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

/**
 * Validates a year (>= 1900 and <= current year).
 */
export function isValidYear(year: number): boolean {
  const currentYear = new Date().getFullYear()
  return year >= 1900 && year <= currentYear
}

/**
 * Validates a month number (1–12).
 */
export function isValidMonth(month: number): boolean {
  return month >= 1 && month <= 12
}

/**
 * Runs batch field validations and collects errors.
 */
export function validateForm<T extends Record<string, unknown>>(data: T, rules: Record<keyof T, (value: unknown) => string | null>): { valid: boolean; errors: Partial<Record<keyof T, string>> } {
  const errors: Partial<Record<keyof T, string>> = {}
  let valid = true
  for (const key of Object.keys(rules) as Array<keyof T>) {
    const validator = rules[key]
    const error = validator(data[key])
    if (error) {
      errors[key] = error
      valid = false
    }
  }
  return { valid, errors }
}
