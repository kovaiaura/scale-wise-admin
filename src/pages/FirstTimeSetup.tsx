import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Weight, ChevronRight, ChevronLeft, Shield, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PasswordStrength, validatePassword } from '@/components/setup/PasswordStrength';
import { createUser } from '@/services/database/userRepository';
import { markSetupCompleted } from '@/services/database/connection';
import { logSecurityEvent } from '@/services/database/securityLogger';
import { useToast } from '@/hooks/use-toast';

type SetupStep = 'welcome' | 'account' | 'password' | 'success';

interface FirstTimeSetupProps {
  onSetupComplete?: () => void;
}

export default function FirstTimeSetup({ onSetupComplete }: FirstTimeSetupProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<SetupStep>('welcome');
  const [username, setUsername] = useState('superadmin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNext = () => {
    setError('');
    
    if (currentStep === 'welcome') {
      setCurrentStep('account');
    } else if (currentStep === 'account') {
      if (!username.trim()) {
        setError('Username is required');
        return;
      }
      if (username.length < 3) {
        setError('Username must be at least 3 characters');
        return;
      }
      setCurrentStep('password');
    } else if (currentStep === 'password') {
      handleCreateAccount();
    }
  };

  const handleBack = () => {
    setError('');
    if (currentStep === 'account') setCurrentStep('welcome');
    else if (currentStep === 'password') setCurrentStep('account');
  };

  const handleCreateAccount = async () => {
    setError('');

    if (!password) {
      setError('Password is required');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password does not meet requirements');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const userId = await createUser({
        username: username.trim(),
        email: email.trim() || null,
        password,
        role: 'super_admin',
      });

      await markSetupCompleted();
      await logSecurityEvent('SETUP_COMPLETED', userId, 'Initial super admin account created');

      if (onSetupComplete) {
        onSetupComplete();
      }

      setCurrentStep('success');
    } catch (err: any) {
      console.error('Setup failed:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    window.location.href = '/login';
  };

  const stepVariants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-elevated">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
              <Weight className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-3xl">Truckore Pro</CardTitle>
              <CardDescription>First-Time Setup</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <AnimatePresence mode="wait">
              {currentStep === 'welcome' && (
                <motion.div
                  key="welcome"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-4">
                    <h2 className="text-2xl font-semibold">Welcome to Truckore Pro</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      A secure desktop weighbridge management system for your industrial operations.
                      Let's set up your Super Admin account to get started.
                    </p>
                  </div>

                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      The Super Admin account has full system access and cannot be recovered.
                      Please keep your credentials secure.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-between items-center pt-4">
                    <span className="text-sm text-muted-foreground">Step 1 of 3</span>
                    <Button onClick={handleNext}>
                      Next <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {currentStep === 'account' && (
                <motion.div
                  key="account"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-semibold">Account Details</h2>
                    <p className="text-muted-foreground">
                      Set up your Super Admin username and email
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username *</Label>
                      <Input
                        id="username"
                        placeholder="superadmin"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoFocus
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email (Optional)</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-between items-center pt-4">
                    <Button variant="outline" onClick={handleBack}>
                      <ChevronLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">Step 2 of 3</span>
                      <Button onClick={handleNext}>
                        Next <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 'password' && (
                <motion.div
                  key="password"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-semibold">Create Password</h2>
                    <p className="text-muted-foreground">
                      Choose a strong password for your account
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Re-enter password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <PasswordStrength password={password} />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Important:</strong> There is no password recovery mechanism.
                      Make sure to remember this password or store it securely.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-between items-center pt-4">
                    <Button variant="outline" onClick={handleBack} disabled={loading}>
                      <ChevronLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">Step 3 of 3</span>
                      <Button onClick={handleNext} disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 'success' && (
                <motion.div
                  key="success"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-semibold">Setup Complete!</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Your Super Admin account has been created successfully.
                      You can now sign in and start using Truckore Pro.
                    </p>
                  </div>

                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Security Reminder:</strong> Your credentials are stored securely with bcrypt hashing.
                      There is no password recovery - keep your credentials safe.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-center pt-4">
                    <Button size="lg" onClick={handleFinish}>
                      Start Using Truckore Pro <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
