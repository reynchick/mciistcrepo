/**
 * Validation utilities for user and faculty forms
 */

/**
 * Validate name field (first, middle, last names)
 * @param v - The name value to validate
 * @param required - Whether the field is required
 * @returns Error message or undefined if valid
 */
export function validateName(v: string, required = false): string | undefined {
  const trimmed = v.trim()
  if (required && !trimmed) return 'This field is required'
  if (trimmed && !/^[A-Za-zÀ-ÿ'\-\s.]{1,50}$/.test(trimmed)) {
    return 'Letters, periods, hyphens only, max 50 characters'
  }
  return undefined
}

/**
 * Validate email domain (must be @usep.edu.ph)
 */
export function validateEmailDomain(email: string): boolean {
  return /@usep\.edu\.ph$/i.test(email)
}

/**
 * Validate Philippine mobile number format
 * Supports: 09XX-XXX-XXXX and +63 9XXXXXXXXX
 */
export function validateContact(v: string): boolean {
  const s = v.replace(/\D/g, '')
  if (v.startsWith('+63')) return /^\+63\s?9\d{9}$/.test(v.replace(/\s/g, ''))
  return /^09\d{2}-\d{3}-\d{4}$/.test(v) || /^09\d{9}$/.test(s)
}

/**
 * Validate student ID format
 * Accepts: YYYY-NNNNN or alphanumeric 4-20 characters
 */
export function validateStudentId(v: string): string | undefined {
  const t = v.trim()
  if (!t) return 'Student ID is required'
  if (!/^\d{4}-\d{5}$/.test(t) && !/^[A-Za-z0-9-]{4,20}$/.test(t)) {
    return 'Invalid Student ID format'
  }
  return undefined
}

/**
 * Validate ORCID format (0000-0000-0000-0000)
 */
export function validateOrcid(v: string): boolean {
  return v === '' || /^\d{4}-\d{4}-\d{4}-\d{4}$/.test(v)
}
