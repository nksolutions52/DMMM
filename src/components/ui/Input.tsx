import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  ...props
}) => (
  <div className={`mb-2 ${fullWidth ? 'w-full' : ''}`}>
    {label && (
      <label className="block mb-1 text-sm font-semibold text-gray-700">
        {label}
      </label>
    )}
    <div className="relative">
      {leftIcon && (
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          {leftIcon}
        </span>
      )}
      <input
        className={`
          ${leftIcon ? 'pl-10' : 'pl-4'}
          ${rightIcon ? 'pr-10' : 'pr-4'}
          py-2 bg-white/80 border
          ${error ? 'border-red-300' : 'border-gray-200'}
          rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500
          block w-full text-base
          transition
          ${className}
        `}
        {...props}
      />
      {rightIcon && (
        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          {rightIcon}
        </span>
      )}
    </div>
    {error && (
      <div className="mt-1 text-xs text-red-500">{error}</div>
    )}
  </div>
);

export default Input;