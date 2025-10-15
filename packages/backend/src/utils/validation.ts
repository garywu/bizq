/**
 * Input validation utilities for BizQ
 */

import { UniversalTask } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class Validator {
  static validateUniversalTask(task: any): ValidationResult {
    const errors: string[] = [];

    if (!task) {
      errors.push('Task is required');
      return { isValid: false, errors };
    }

    if (!task.businessId || typeof task.businessId !== 'string') {
      errors.push('businessId must be a non-empty string');
    }

    if (!task.content || typeof task.content !== 'string') {
      errors.push('content must be a non-empty string');
    }

    if (!task.type || typeof task.type !== 'string') {
      errors.push('type must be a non-empty string');
    }

    if (task.credits !== undefined && (typeof task.credits !== 'number' || task.credits < 0)) {
      errors.push('credits must be a non-negative number');
    }

    if (task.priority !== undefined && !['low', 'medium', 'high', 'urgent'].includes(task.priority)) {
      errors.push('priority must be one of: low, medium, high, urgent');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static sanitizeString(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }
}