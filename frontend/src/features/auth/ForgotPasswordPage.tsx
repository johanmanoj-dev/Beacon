import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui';
import { PasswordValidator } from './PasswordValidator';
import { validatePasswordCompliance } from './passwordRules';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset step fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const passwordCompliance = validatePasswordCompliance(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage(`Password reset link generated for ${email}. You can simulate entering a new password below.`);
      setStep('reset');
    }, 600);
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordCompliance.isValid || !passwordsMatch) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage('Password successfully updated! You can now log in.');
      setTimeout(() => {
        navigate('/login');
      }, 1200);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-600 text-white font-black text-xl shadow-md mb-3">
          B
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Reset Your Password
        </h2>
        <p className="mt-1 text-sm text-slate-500 font-medium">
          Recover access to your Brightloop account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold text-slate-900">
              {step === 'request' ? 'Request Password Reset' : 'Set New Compliant Password'}
            </CardTitle>
            <CardDescription>
              {step === 'request'
                ? 'Enter your account email to receive a secure recovery link'
                : 'Enter and verify your new password according to security policy'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {successMessage && (
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {step === 'request' ? (
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <Input
                  label="Registered Email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="h-4 w-4" />}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isSubmitting}
                >
                  Send Reset Link
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div>
                  <Input
                    label="New Password"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    leftIcon={<Lock className="h-4 w-4" />}
                    required
                  />
                </div>

                {/* Password compliance checklist */}
                <PasswordValidator password={newPassword} showAlways={true} />

                <div>
                  <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    leftIcon={<Lock className="h-4 w-4" />}
                    required
                    error={
                      confirmPassword && !passwordsMatch
                        ? 'Passwords do not match'
                        : undefined
                    }
                  />
                  {passwordsMatch && (
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Passwords match
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={!passwordCompliance.isValid || !passwordsMatch}
                  isLoading={isSubmitting}
                  leftIcon={<KeyRound className="h-4 w-4" />}
                >
                  Update Password
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="justify-center border-t border-slate-100 text-xs text-slate-500">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
