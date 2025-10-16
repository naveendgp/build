// hooks/useOtpInput.ts
import { useRef, useState } from 'react';
import { TextInput } from 'react-native';

export const useOtpInput = (length: number = 4) => {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const inputsRef = useRef<Array<TextInput | null>>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);

    if (value && index < inputsRef.current.length - 1) {
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
