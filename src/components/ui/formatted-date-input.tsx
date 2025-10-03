import React from 'react';
import { Input } from './input';

interface FormattedDateInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const FormattedDateInput: React.FC<FormattedDateInputProps> = ({
  id,
  value,
  onChange,
  placeholder = "YYYY-MM-DD",
  required = false,
  className = ""
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    
    // Remover todos os caracteres não numéricos
    const numbersOnly = inputValue.replace(/\D/g, '');
    
    // Formatar automaticamente para YYYY-MM-DD
    let formattedValue = '';
    
    if (numbersOnly.length >= 1) {
      formattedValue = numbersOnly.slice(0, 4);
    }
    
    if (numbersOnly.length >= 5) {
      formattedValue = numbersOnly.slice(0, 4) + '-' + numbersOnly.slice(4, 6);
    }
    
    if (numbersOnly.length >= 7) {
      formattedValue = numbersOnly.slice(0, 4) + '-' + numbersOnly.slice(4, 6) + '-' + numbersOnly.slice(6, 8);
    }
    
    // Limitar a 10 caracteres (YYYY-MM-DD)
    formattedValue = formattedValue.slice(0, 10);
    
    onChange(formattedValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir: backspace, delete, tab, escape, enter, e números
    if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
        // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true) ||
        // Permitir números
        (e.keyCode >= 48 && e.keyCode <= 57) ||
        (e.keyCode >= 96 && e.keyCode <= 105)) {
      return;
    }
    
    // Bloquear outros caracteres
    e.preventDefault();
  };

  return (
    <Input
      id={id}
      type="text"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      required={required}
      className={`font-mono ${className}`}
      maxLength={10}
      autoComplete="off"
    />
  );
}; 