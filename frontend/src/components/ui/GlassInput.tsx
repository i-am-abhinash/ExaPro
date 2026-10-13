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
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full py-2.5 rounded-xl bg-slate-900/80 border text-slate-100 placeholder-slate-500 text-xs sm:text-sm backdrop-blur-md transition-all focus:outline-none focus:ring-1 ${
              icon ? 'pl-10' : 'pl-3.5'
            } pr-3.5 ${
              error
                ? 'border-red-500/50 focus:border-red-400 focus:ring-red-400'
                : 'border-slate-700/60 hover:border-slate-600/80 focus:border-cyan-400/80 focus:ring-cyan-400/50 focus:bg-slate-900'
            } ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-[11px] text-red-400 font-medium">{error}</p>}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';
