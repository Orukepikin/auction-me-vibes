import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full px-4 py-3 bg-dark-800 border-2 border-dark-600 rounded-xl text-white placeholder-gray-500 transition-all duration-300 hover:border-dark-500 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 focus:outline-none ${
              icon ? 'pl-12' : ''
            } ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
            <span>⚠️</span> {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-4 py-3 bg-dark-800 border-2 border-dark-600 rounded-xl text-white placeholder-gray-500 transition-all duration-300 hover:border-dark-500 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 focus:outline-none resize-none ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
            <span>⚠️</span> {error}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full px-4 py-3 bg-dark-800 border-2 border-dark-600 rounded-xl text-white transition-all duration-300 hover:border-dark-500 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 focus:outline-none appearance-none cursor-pointer ${
            error ? 'border-red-500' : ''
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-dark-800">
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
            <span>⚠️</span> {error}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
