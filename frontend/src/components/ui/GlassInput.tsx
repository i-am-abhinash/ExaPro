import React, { forwardRef } from 'react';

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
  label?: string;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ icon, error, label, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-bold text-graphite-800 tracking-tight">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-muted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full py-2.5 rounded-xl bg-white/90 border text-graphite placeholder-slate-muted/70 text-xs sm:text-sm backdrop-blur-sm transition-all focus:outline-none focus:ring-2 ${
              icon ? 'pl-10' : 'pl-3.5'
            } pr-3.5 ${
              error
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                : 'border-black/[0.09] hover:border-black/[0.18] focus:border-cobalt focus:ring-cobalt/15 focus:bg-white'
            } ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';
