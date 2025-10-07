import { AlertCircle, Mail, Phone } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface AccessBlockedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
}

export default function AccessBlockedDialog({ open, onOpenChange, message }: AccessBlockedDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Access Restricted
          </DialogTitle>
        </DialogHeader>

        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Feature Access Blocked</AlertTitle>
          <AlertDescription className="mt-2 whitespace-pre-wrap">
            {message}
          </AlertDescription>
        </Alert>

        <div className="space-y-3 py-2">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Contact via email or phone for assistance</span>
          </div>
          
          <div className="flex items-center gap-3 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Your administrator will restore access after payment</span>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => window.location.href = 'mailto:admin@weighbridge.com'}
          >
            <Mail className="mr-2 h-4 w-4" />
            Email Support
          </Button>
          <Button 
            variant="default"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Understood
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
