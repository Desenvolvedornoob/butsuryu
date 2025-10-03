import React from 'react';
import { Input } from './input';

interface SimpleDateInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const SimpleDateInput: React.FC<SimpleDateInputProps> = ({
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

  // Formatar o valor para garantir formato yyyy-mm-dd
  const formatValue = (dateValue: string) => {
    if (!dateValue) return '';
    
    // Se já está no formato yyyy-mm-dd, retornar como está
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    // Se está no formato dd/mm/yyyy, converter
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
      const parts = dateValue.split('/');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    
    // Se está no formato dd-mm-yyyy, converter
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateValue)) {
      const parts = dateValue.split('-');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    
    return dateValue;
  };

  return (
    <Input
      id={id}
      type="text"
      value={formatValue(value)}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      className={`font-mono ${className}`}
      pattern="\\d{4}-\\d{2}-\\d{2}"
      maxLength={10}
    />
  );
}; 