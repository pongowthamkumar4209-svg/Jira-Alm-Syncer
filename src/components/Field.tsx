import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  icon?: ReactNode;
  disabled?: boolean;
  hint?: string;
  required?: boolean;
}

export function Field({ label, value, onChange, placeholder, type = 'text', icon, disabled, hint, required }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: disabled ? '#3a3a3a' : '#777' }}>
        {label}
        {required && <span style={{ color: '#e03030' }}>*</span>}
        {hint && <span className="normal-case font-normal" style={{ color: '#444' }}>({hint})</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-2.5" style={{ color: disabled ? '#333' : '#555' }}>{icon}</div>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full rounded px-3 py-2 text-sm font-mono focus:outline-none transition-colors"
          style={{
            background: disabled ? '#0a0a0a' : '#111',
            border: '1px solid #222',
            color: disabled ? '#3a3a3a' : '#e8e8e8',
            paddingLeft: icon ? '2.25rem' : '0.75rem',
            cursor: disabled ? 'not-allowed' : 'text',
            opacity: disabled ? 0.6 : 1,
          }}
          onFocus={e => { if (!disabled) e.target.style.borderColor = 'rgba(200,0,0,0.45)'; }}
          onBlur={e => (e.target.style.borderColor = '#222')}
        />
      </div>
    </div>
  );
}
