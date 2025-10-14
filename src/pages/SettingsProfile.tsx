import { User, Mail, Shield, KeyRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { resetUserPassword, changePassword } from '@/services/database/userRepository';
import { PasswordStrength, validatePassword } from '@/components/setup/PasswordStrength';

export default function SettingsProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // State for super admin password management
  const [adminPassword, setAdminPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [operatorPassword, setOperatorPassword] = useState('');
  const [operatorConfirmPassword, setOperatorConfirmPassword] = useState('');

  // State for user's own password change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSetAdminPassword = async () => {
    if (!adminPassword || !adminConfirmPassword) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    if (adminPassword !== adminConfirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (!validatePassword(adminPassword)) {
      toast({ title: 'Error', description: 'Password does not meet requirements', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await resetUserPassword('dev-admin', adminPassword);
      toast({ title: 'Success', description: 'Admin password has been set successfully' });
      setAdminPassword('');
      setAdminConfirmPassword('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to set admin password', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetOperatorPassword = async () => {
    if (!operatorPassword || !operatorConfirmPassword) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    if (operatorPassword !== operatorConfirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (!validatePassword(operatorPassword)) {
      toast({ title: 'Error', description: 'Password does not meet requirements', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await resetUserPassword('dev-operator', operatorPassword);
      toast({ title: 'Success', description: 'Operator password has been set successfully' });
      setOperatorPassword('');
      setOperatorConfirmPassword('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to set operator password', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeOwnPassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'New passwords do not match', variant: 'destructive' });
      return;
    }
    if (!validatePassword(newPassword)) {
      toast({ title: 'Error', description: 'Password does not meet requirements', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const result = await changePassword(user!.id, oldPassword, newPassword);
      if (result.success) {
        toast({ title: 'Success', description: 'Your password has been changed successfully' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to change password', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to change password', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">View your account information</p>
      </div>

      <Alert>
        <AlertDescription>
          Desktop mode: User profile is read-only. Account management is not available in offline mode.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="card-shadow">
          <CardHeader className="text-center">
            <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <User className="h-12 w-12 text-primary" />
            </div>
            <CardTitle>{user?.username}</CardTitle>
            <CardDescription>{user?.email}</CardDescription>
            <Badge className="mx-auto mt-2">{user?.role}</Badge>
          </CardHeader>
        </Card>

        <Card className="card-shadow lg:col-span-2">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>User account details (read-only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="username" defaultValue={user?.username} className="pl-10" disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" defaultValue={user?.email} className="pl-10" disabled />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="role" defaultValue={user?.role} className="pl-10" disabled />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {user?.role === 'super_admin' && (
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              User Password Management
            </CardTitle>
            <CardDescription>Set passwords for admin and operator users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-semibold">Set Admin Password</h3>
              <div className="space-y-2">
                <Label htmlFor="admin-password">New Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-confirm-password">Confirm Password</Label>
                <Input
                  id="admin-confirm-password"
                  type="password"
                  value={adminConfirmPassword}
                  onChange={(e) => setAdminConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                />
              </div>
              {adminPassword && <PasswordStrength password={adminPassword} />}
              <Button onClick={handleSetAdminPassword} disabled={isLoading} className="w-full">
                Set Admin Password
              </Button>
            </div>

            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-semibold">Set Operator Password</h3>
              <div className="space-y-2">
                <Label htmlFor="operator-password">New Password</Label>
                <Input
                  id="operator-password"
                  type="password"
                  value={operatorPassword}
                  onChange={(e) => setOperatorPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="operator-confirm-password">Confirm Password</Label>
                <Input
                  id="operator-confirm-password"
                  type="password"
                  value={operatorConfirmPassword}
                  onChange={(e) => setOperatorConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                />
              </div>
              {operatorPassword && <PasswordStrength password={operatorPassword} />}
              <Button onClick={handleSetOperatorPassword} disabled={isLoading} className="w-full">
                Set Operator Password
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {user?.role !== 'super_admin' && (
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="old-password">Current Password</Label>
              <Input
                id="old-password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirm New Password</Label>
              <Input
                id="confirm-new-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            {newPassword && <PasswordStrength password={newPassword} />}
            <Button onClick={handleChangeOwnPassword} disabled={isLoading} className="w-full">
              Change Password
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
