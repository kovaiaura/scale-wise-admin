import { useState } from 'react';
import { Lock, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNotification } from '@/contexts/NotificationContext';

interface PasswordConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export default function PasswordConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
}: PasswordConfirmationModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { error: showError } = useNotification();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock password validation (replace with real validation)
    if (password === 'supervisor') {
      setPassword('');
      setError('');
      onConfirm();
    } else {
      setError('Invalid supervisor password');
      showError('Invalid supervisor password');
    }
  };

  const handleCancel = () => {
    setPassword('');
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-destructive" />
            Supervisor Authentication Required
          </DialogTitle>
          <DialogDescription>
            Manual entries require supervisor password verification for security and audit purposes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
            <p className="text-xs text-muted-foreground">
              This action will be logged with your credentials for audit trail
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supervisor-password">Supervisor Password</Label>
            <Input
              id="supervisor-password"
              type="password"
              placeholder="Enter supervisor password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              autoFocus
              className={error ? 'border-destructive' : ''}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={!password} className="flex-1">
              Confirm
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Demo password: <code className="text-xs bg-muted px-1 py-0.5 rounded">supervisor</code>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
