import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PASSWORD_RULES, validatePasswordCompliance } from './passwordRules';

export interface PasswordValidatorProps {
  password: string;
  showAlways?: boolean;
  className?: string;
}

export const PasswordValidator: React.FC<PasswordValidatorProps> = ({
  password,
  showAlways = false,
  className,
}) => {
  if (!password && !showAlways) return null;

  const { checks, score } = validatePasswordCompliance(password);

  const strengthLabels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = [
    'bg-slate-200',
    'bg-rose-500',
    'bg-amber-500',
    'bg-blue-500',
    'bg-emerald-500',
  ];

  return (
    <div className={cn('p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">Password Requirements</span>
        {password && (
          <span className="text-[11px] font-semibold text-slate-600">
            {strengthLabels[score]}
          </span>
        )}
      </div>

      {/* Strength Bar */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={cn(
              'h-full rounded-full transition-colors duration-200',
              score > index ? strengthColors[score] : 'bg-slate-200'
            )}
          />
        ))}
      </div>

      {/* Rules Checklist */}
      <ul className="space-y-1.5 text-xs">
        {PASSWORD_RULES.map((rule) => {
          const passed = checks[rule.id];
          return (
            <li
              key={rule.id}
              className={cn(
                'flex items-center gap-2 transition-colors duration-150',
                passed ? 'text-emerald-700 font-medium' : 'text-slate-500'
              )}
            >
              <span
                className={cn(
                  'h-4 w-4 rounded-full flex items-center justify-center shrink-0 text-[10px] transition-colors',
                  passed
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-slate-200 text-slate-400'
                )}
              >
                {passed ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : <X className="h-2.5 w-2.5" />}
              </span>
              <span>{rule.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
