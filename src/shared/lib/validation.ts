const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const HANDLE_PATTERN = /^[a-z0-9_]+$/

export type ValidationKey =
  | 'validation.required'
  | 'validation.email'
  | 'validation.handleLength'
  | 'validation.handleFormat'
  | 'validation.passwordLength'
  | 'validation.passwordComplexity'
  | 'validation.passwordMismatch'
  | 'validation.bioLength'
  | 'validation.displayNameLength'

export function required(value: string): ValidationKey | undefined {
  return value.trim() ? undefined : 'validation.required'
}

export function validateEmail(value: string): ValidationKey | undefined {
  if (!value.trim()) {
    return 'validation.required'
  }
  return EMAIL_PATTERN.test(value.trim()) ? undefined : 'validation.email'
}

export function validateHandle(value: string): ValidationKey | undefined {
  const handle = value.trim().toLowerCase()
  if (!handle) {
    return 'validation.required'
  }
  if (handle.length < 3 || handle.length > 24) {
    return 'validation.handleLength'
  }
  return HANDLE_PATTERN.test(handle) ? undefined : 'validation.handleFormat'
}

/** Mirrors the API rule: 8-72 characters with letters and numbers. */
export function validateNewPassword(value: string): ValidationKey | undefined {
  if (!value) {
    return 'validation.required'
  }
  if (value.length < 8 || value.length > 72) {
    return 'validation.passwordLength'
  }
  return /[A-Za-z]/.test(value) && /\d/.test(value) ? undefined : 'validation.passwordComplexity'
}

export function validateConfirmation(password: string, confirmation: string): ValidationKey | undefined {
  if (!confirmation) {
    return 'validation.required'
  }
  return password === confirmation ? undefined : 'validation.passwordMismatch'
}

export function validateDisplayName(value: string): ValidationKey | undefined {
  const name = value.trim()
  if (!name) {
    return 'validation.required'
  }
  return name.length > 64 ? 'validation.displayNameLength' : undefined
}

export function validateBio(value: string): ValidationKey | undefined {
  return value.length > 500 ? 'validation.bioLength' : undefined
}
