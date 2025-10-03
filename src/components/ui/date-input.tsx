import React from 'react';
import { Input } from './input';

interface DateInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const DateInput: React.FC<DateInputProps> = ({
  id,
  value,
  onChange,
  placeholder = "YYYY-MM-DD",
  required = false,
  className = ""
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <Input
      id={id}
      type="date"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      className={className}
    />
  );
}; 