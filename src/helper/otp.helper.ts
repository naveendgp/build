import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class OtpHelper {
  /**
   * Generates a random OTP (One-Time Password) of specified digits
   * @param digits - Number of digits in the OTP (default: 6)
   * @returns A string containing the generated OTP
   * @example
   * generateOtp(6) // Returns: "123456"
   * generateOtp(4) // Returns: "7890"
   */
  generateOtp(digits: number = 6): string {
    if (digits < 1) {
      throw new Error('Number of digits must be at least 1');
    }

    if (digits > 10) {
      throw new Error('Number of digits cannot exceed 10');
    }

    // Generate a random number between 0 and 10^digits - 1
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    const otp = Math.floor(Math.random() * (max - min + 1)) + min;

    // Convert to string and pad with leading zeros if necessary
    return otp.toString().padStart(digits, '0');
  }

  /**
   * Generates a secure OTP using crypto for better randomness
   * @param digits - Number of digits in the OTP (default: 6)
   * @returns A string containing the generated OTP
   */
  generateSecureOtp(digits: number = 6): string {
    if (digits < 1) {
      throw new Error('Number of digits must be at least 1');
    }

    if (digits > 10) {
      throw new Error('Number of digits cannot exceed 10');
    }

    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    const range = max - min + 1;

    // Generate a random number using crypto for better randomness
    const randomBytes = crypto.randomBytes(4);
    const randomNumber = randomBytes.readUInt32BE(0);
    const otp = (randomNumber % range) + min;

    return otp.toString().padStart(digits, '0');
  }
}

/**
 * Standalone function to generate OTP without class instantiation
 * @param digits - Number of digits in the OTP (default: 6)
 * @returns A string containing the generated OTP
 * @example
 * generateOtp(6) // Returns: "123456"
 * generateOtp(4) // Returns: "7890"
 */
export function generateOtp(digits: number = 6): string {
  if (digits < 1) {
    throw new Error('Number of digits must be at least 1');
  }

  if (digits > 10) {
    throw new Error('Number of digits cannot exceed 10');
  }

  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  const otp = Math.floor(Math.random() * (max - min + 1)) + min;

  return otp.toString().padStart(digits, '0');
}

/**
 * Standalone function to generate secure OTP using crypto
 * @param digits - Number of digits in the OTP (default: 6)
 * @returns A string containing the generated OTP
 */
export function generateSecureOtp(digits: number = 6): string {
  if (digits < 1) {
    throw new Error('Number of digits must be at least 1');
  }

  if (digits > 10) {
    throw new Error('Number of digits cannot exceed 10');
  }

  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  const range = max - min + 1;

  const randomBytes = crypto.randomBytes(4);
  const randomNumber = randomBytes.readUInt32BE(0);
  const otp = (randomNumber % range) + min;

  return otp.toString().padStart(digits, '0');
}

