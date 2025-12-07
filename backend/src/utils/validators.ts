import { ValidationError } from './errors.js';

// ============================================
// VALIDATION UTILITIES
// ============================================

export class Validators {
  // Validate UUID
  static isValidUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  static validateUUID(value: string, fieldName: string = 'ID'): void {
    if (!this.isValidUUID(value)) {
      throw new ValidationError(`${fieldName} must be a valid UUID`);
    }
  }

  // Validate URL
  static isValidURL(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  static validateURL(value: string, fieldName: string = 'URL'): void {
    if (!this.isValidURL(value)) {
      throw new ValidationError(`${fieldName} must be a valid URL`);
    }
  }

  // Validate rating
  static validateRating(rating: number): void {
    if (rating < 0 || rating > 10) {
      throw new ValidationError('Rating must be between 0 and 10');
    }
  }

  // Validate positive number
  static validatePositiveNumber(value: number, fieldName: string): void {
    if (value < 0) {
      throw new ValidationError(`${fieldName} must be a positive number`);
    }
  }

  // Validate non-empty string
  static validateNonEmptyString(value: string, fieldName: string): void {
    if (!value || value.trim().length === 0) {
      throw new ValidationError(`${fieldName} cannot be empty`);
    }
  }

  // Validate enum value
  static validateEnum<T extends string>(
    value: string,
    allowedValues: readonly T[],
    fieldName: string
  ): void {
    if (!allowedValues.includes(value as T)) {
      throw new ValidationError(
        `${fieldName} must be one of: ${allowedValues.join(', ')}`
      );
    }
  }

  // Validate date is in future
  static validateFutureDate(date: Date, fieldName: string): void {
    if (date <= new Date()) {
      throw new ValidationError(`${fieldName} must be in the future`);
    }
  }

  // Validate array is not empty
  static validateNonEmptyArray<T>(
    arr: T[],
    fieldName: string
  ): void {
    if (!Array.isArray(arr) || arr.length === 0) {
      throw new ValidationError(`${fieldName} must be a non-empty array`);
    }
  }

  // Validate email (basic)
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateEmail(email: string): void {
    if (!this.isValidEmail(email)) {
      throw new ValidationError('Invalid email format');
    }
  }
}
