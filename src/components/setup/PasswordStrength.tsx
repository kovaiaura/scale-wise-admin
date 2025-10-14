import { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PasswordStrengthProps {
  password: string;
}

export const PasswordStrength = ({ password }: PasswordStrengthProps) => {
  const requirements = useMemo(() => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
  }, [password]);

  const strength = useMemo(() => {
    const passedRequirements = Object.values(requirements).filter(Boolean).length;
    return (passedRequirements / 5) * 100;
  }, [requirements]);

  const getStrengthLabel = () => {
    if (strength === 0) return { text: '', color: '' };
    if (strength <= 40) return { text: 'Weak', color: 'text-destructive' };
    if (strength <= 60) return { text: 'Fair', color: 'text-orange-500' };
    if (strength <= 80) return { text: 'Good', color: 'text-yellow-500' };
    return { text: 'Strong', color: 'text-green-500' };
  };

  const strengthLabel = getStrengthLabel();

  const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {met ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={met ? 'text-foreground' : 'text-muted-foreground'}>
        {text}
      </span>
    </div>
  );

  if (!password) return null;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Password Strength</span>
          <span className={`text-sm font-medium ${strengthLabel.color}`}>
            {strengthLabel.text}
          </span>
        </div>
        <Progress value={strength} className="h-2" />
      </div>

      <div className="space-y-2 bg-muted/30 rounded-lg p-3">
        <p className="text-xs font-medium text-muted-foreground">Password must contain:</p>
        <RequirementItem met={requirements.length} text="At least 8 characters" />
        <RequirementItem met={requirements.uppercase} text="One uppercase letter" />
        <RequirementItem met={requirements.lowercase} text="One lowercase letter" />
        <RequirementItem met={requirements.number} text="One number" />
        <RequirementItem met={requirements.special} text="One special character" />
      </div>
    </div>
  );
};

export const validatePassword = (password: string): boolean => {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  );
};
