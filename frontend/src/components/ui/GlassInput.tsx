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
          <label className="block text-xs font-bold text-cool-primary tracking-tight">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cool-muted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full py-2.5 rounded-xl bg-[rgba(28,38,60,0.50)] border text-cool-primary placeholder-cool-muted/60 text-xs sm:text-sm backdrop-blur-md transition-all focus:outline-none focus:ring-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${
              icon ? 'pl-10' : 'pl-3.5'
            } pr-3.5 ${
              error
                ? 'border-status-error focus:border-status-error focus:ring-status-error/25'
                : 'border-white/[0.12] hover:border-white/[0.22] focus:border-aurora focus:ring-aurora/25 focus:bg-[rgba(39,51,78,0.65)]'
            } ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-[11px] text-status-error font-medium">{error}</p>}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';
