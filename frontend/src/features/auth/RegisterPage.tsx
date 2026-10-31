import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, User, Building2, Eye, EyeOff, UserPlus, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context';
import { Button, Input, Select, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui';
import { PasswordValidator } from './PasswordValidator';
import { validatePasswordCompliance } from './passwordRules';
import type { Role } from '../../types';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState<Role>('CUSTOMER');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordCompliance = validatePasswordCompliance(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!passwordCompliance.isValid) {
      setError('Password does not fulfill all required security criteria.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    try {
      const newUser = await register({
        fullName,
        email,
        password,
        role,
        companyName: companyName.trim() || undefined,
      });

      if (newUser.role === 'CUSTOMER') {
        navigate('/portal');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-600 text-white font-black text-xl shadow-md mb-3">
          B
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Create Brightloop Account
        </h2>
        <p className="mt-1 text-sm text-slate-500 font-medium">
          Get started with automated subscription and billing workflows
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold text-slate-900">Sign Up</CardTitle>
            <CardDescription>
              Enter your details to create an account with role-based access
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  placeholder="e.g. Alice Walker"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  leftIcon={<User className="h-4 w-4" />}
                  required
                />

                <Input
                  label="Email address"
                  type="email"
                  placeholder="alice@retailcorp.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="h-4 w-4" />}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Company / Organization"
                  placeholder="e.g. RetailCorp Ltd"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  leftIcon={<Building2 className="h-4 w-4" />}
                />

                <Select
                  label="Account Role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  options={[
                    { label: 'Customer (Self-Service Portal)', value: 'CUSTOMER' },
                    { label: 'Internal Staff (Billing Operations)', value: 'STAFF' },
                    { label: 'Admin (Full System Access)', value: 'ADMIN' },
                  ]}
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    leftIcon={<Lock className="h-4 w-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    }
                    required
                  />
                </div>
              </div>

              {/* Live Password Compliance Checklist */}
              <PasswordValidator password={password} showAlways={true} />

              {/* Confirm Password Input */}
              <div>
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Repeat your password"
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
                className="w-full mt-2"
                disabled={!passwordCompliance.isValid || !passwordsMatch || !fullName || !email}
                isLoading={isLoading}
                rightIcon={<UserPlus className="h-4 w-4" />}
              >
                Create Account
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center border-t border-slate-100 text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="ml-1 font-semibold text-blue-600 hover:underline">
              Sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
