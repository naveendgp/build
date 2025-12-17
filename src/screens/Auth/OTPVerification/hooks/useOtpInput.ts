// hooks/useOtpInput.ts
import { useRef, useState } from 'react';
import { TextInput } from 'react-native';

export const useOtpInput = (length: number = 4) => {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const inputsRef = useRef<Array<TextInput | null>>([]);

  const handleChange = (index: number, value: string) => {
    // Sanitize input to allow only numbers
    const sanitized = value.replace(/[^0-9]/g, '');

    // Handle empty value (deletion)
    if (!sanitized) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    // Handle paste or multi-character input
    if (sanitized.length > 1) {
      const next = [...digits];
      const chars = sanitized.split('');

      // If the pasted content is the full length (or more), start from the beginning
      // regardless of which input was focused.
      const startIndex = sanitized.length >= length ? 0 : index;

      chars.forEach((char, i) => {
        const targetIndex = startIndex + i;
        if (targetIndex < length) {
          next[targetIndex] = char;
        }
      });

      setDigits(next);

      // Focus logic remains similar, but based on startIndex
      const filledUpTo = startIndex + chars.length;
      if (filledUpTo < length) {
        inputsRef.current[filledUpTo]?.focus();
      } else {
        inputsRef.current[length - 1]?.focus();
      }
      return;
    }

    // Handle single character input (normal typing)
    const next = [...digits];
    // Take the last character to behave like a standard replace if multiple chars found but length was 1 somehow
    // But since we handled >1 above, getting here means length is 1.
    next[index] = sanitized;
    setDigits(next);

    if (index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, e: any) => {
    if (
      e.nativeEvent.key === 'Backspace' &&
      digits[index] === '' &&
      index > 0
    ) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const otp = digits.join('');
  const reset = () => setDigits(Array(length).fill(''));

  return { digits, otp, handleChange, handleKeyPress, inputsRef, reset };
};
