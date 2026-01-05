import { useMemo } from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const checks = useMemo(() => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  }, [password]);

  const strength = useMemo(() => {
    const passed = Object.values(checks).filter(Boolean).length;
    if (passed === 0) return { label: '', color: '', width: '0%' };
    if (passed <= 2) return { label: 'Weak', color: 'bg-destructive', width: '33%' };
    if (passed <= 4) return { label: 'Medium', color: 'bg-yellow-500', width: '66%' };
    return { label: 'Strong', color: 'bg-green-500', width: '100%' };
  }, [checks]);

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strength.color}`}
            style={{ width: strength.width }}
          />
        </div>
        {strength.label && (
          <span className={`text-xs font-medium ${
            strength.label === 'Weak' ? 'text-destructive' : 
            strength.label === 'Medium' ? 'text-yellow-500' : 'text-green-500'
          }`}>
            {strength.label}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-1 text-xs">
        <CheckItem passed={checks.length} label="8+ characters" />
        <CheckItem passed={checks.uppercase} label="Uppercase letter" />
        <CheckItem passed={checks.lowercase} label="Lowercase letter" />
        <CheckItem passed={checks.number} label="Number" />
        <CheckItem passed={checks.special} label="Special character" />
      </div>
    </div>
  );
};

const CheckItem = ({ passed, label }: { passed: boolean; label: string }) => (
  <div className={`flex items-center gap-1.5 ${passed ? 'text-green-500' : 'text-muted-foreground'}`}>
    {passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
    <span>{label}</span>
  </div>
);

export default PasswordStrengthIndicator;
