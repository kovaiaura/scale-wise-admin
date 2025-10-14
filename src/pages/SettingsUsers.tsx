import { useState, useEffect } from 'react';
import { Lock, Save, Info, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import PasswordConfirmationModal from '@/components/operator/PasswordConfirmationModal';

const SUPERVISOR_PASSWORD = 'supervisor';
const MAX_MESSAGE_LENGTH = 500;

export default function SettingsUsers() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(true);
  const [isAccessBlocked, setIsAccessBlocked] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      // Load from localStorage for desktop mode
      const saved = localStorage.getItem('accessControl');
      if (saved) {
        const data = JSON.parse(saved);
        setIsAccessBlocked(data.isAccessBlocked || false);
        setBlockedMessage(data.blockedMessage || '');
      }
    }
  }, [isAuthenticated]);

  const handlePasswordConfirm = () => {
    setIsAuthenticated(true);
    setShowPasswordModal(false);
    toast({
      title: "Access Granted",
      description: "You can now manage access control settings"
    });
  };

  const handleSave = () => {
    if (!blockedMessage.trim()) {
      toast({
        title: "Validation Error",
        description: "Blocked message cannot be empty",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    
    setTimeout(() => {
      // Save to localStorage for desktop mode
      const accessControl = {
        isAccessBlocked,
        blockedMessage,
        updatedBy: user?.username || 'admin',
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('accessControl', JSON.stringify(accessControl));
      
      toast({
        title: "Settings Saved",
        description: `Access control has been ${isAccessBlocked ? 'enabled' : 'disabled'} successfully`
      });
      
      setIsSaving(false);
    }, 500);
  };

  const blockedFeatures = [
    'Printing bills',
    'Generating new weighments',
    'Adding/editing vehicles',
    'Adding/editing parties',
    'Adding/editing products',
    'Generating reports',
    'Searching weighments',
    'Exporting data'
  ];

  if (!isAuthenticated) {
    return (
      <PasswordConfirmationModal
        open={showPasswordModal}
        onOpenChange={(open) => {
          if (!open && !isAuthenticated) {
            window.history.back();
          }
          setShowPasswordModal(open);
        }}
        onConfirm={handlePasswordConfirm}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Lock className="h-8 w-8" />
          Access Control Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage feature access for admins and operators
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Super Admin Privilege</AlertTitle>
        <AlertDescription>
          Super admins are never affected by access restrictions and can always access all features.
        </AlertDescription>
      </Alert>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Block Access for Admins & Operators
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div className="space-y-1">
              <Label htmlFor="access-toggle" className="text-base font-semibold cursor-pointer">
                Enable Access Restriction
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, admins and operators will be blocked from using key features
              </p>
            </div>
            <Switch
              id="access-toggle"
              checked={isAccessBlocked}
              onCheckedChange={setIsAccessBlocked}
              className="data-[state=checked]:bg-destructive"
            />
          </div>

          <div className="space-y-3 p-4 border rounded-lg bg-destructive/5">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-destructive" />
              <span className="font-semibold text-sm">Blocked Features:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {blockedFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="blocked-message" className="text-base font-semibold">
                Custom Blocked Message
              </Label>
              <Badge variant="outline">
                {blockedMessage.length}/{MAX_MESSAGE_LENGTH}
              </Badge>
            </div>
            <Textarea
              id="blocked-message"
              value={blockedMessage}
              onChange={(e) => {
                if (e.target.value.length <= MAX_MESSAGE_LENGTH) {
                  setBlockedMessage(e.target.value);
                }
              }}
              placeholder="Enter the message that will be shown to blocked users..."
              className="min-h-[150px] resize-none"
              maxLength={MAX_MESSAGE_LENGTH}
            />
            <p className="text-xs text-muted-foreground">
              This message will be displayed when admins or operators try to access blocked features.
              Include contact information and payment details.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
              size="lg"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Alert variant={isAccessBlocked ? "destructive" : "default"}>
        <Info className="h-4 w-4" />
        <AlertTitle>Current Status</AlertTitle>
        <AlertDescription>
          Access is currently <strong>{isAccessBlocked ? 'BLOCKED' : 'OPEN'}</strong> for admins and operators.
          {isAccessBlocked && ' They will see a payment reminder when trying to use restricted features.'}
        </AlertDescription>
      </Alert>
    </div>
  );
}
