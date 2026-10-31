import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui';
import type { Role } from '../../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  const TEST_CREDENTIALS: Record<Role, { email: string; pass: string; title: string; subtitle: string }> = {
    ADMIN: {
      email: 'admin@brightloop.com',
      pass: 'Compliant@Pass123',
      title: 'Admin',
      subtitle: 'Full Control',
    },
    STAFF: {
      email: 'staff@brightloop.com',
      pass: 'Compliant@Pass123',
      title: 'Staff',
      subtitle: 'Operations',
    },
    CUSTOMER: {
      email: 'customer@acme.com',
      pass: 'Compliant@Pass123',
      title: 'Customer',
      subtitle: 'Portal View',
    },
  };

  const handleFillTestCreds = (role: Role) => {
    setError(null);
    const creds = TEST_CREDENTIALS[role];
    setEmail(creds.email);
    setPassword(creds.pass);
    setDemoNotice(`${creds.title} test credentials loaded into form. Click "Sign In" to proceed.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser.role === 'CUSTOMER') {
        navigate('/portal');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo */}
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-[#2B4257] text-[#FAF7F0] font-black text-xl shadow-md mb-3">
          B
        </div>
        <h2 className="text-3xl font-extrabold text-[#101E2B] tracking-tight">
          Brightloop
        </h2>
        <p className="mt-1 text-sm text-[#5A6D80] font-medium">
          Subscription Management & Recurring Invoicing Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="shadow-lg border-[#E5DFD3]">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold text-[#101E2B]">Sign in to your account</CardTitle>
            <CardDescription>
              Enter your credentials to access your billing workspace
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}

            {demoNotice && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{demoNotice}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4" />}
                required
              />

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#101E2B] tracking-wide uppercase">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-[#2B4257] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    leftIcon={<Lock className="h-4 w-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[#889AA9] hover:text-[#101E2B] focus:outline-none cursor-pointer"
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

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Sign In
              </Button>
            </form>

            {/* Fill Test Credentials Buttons */}
            <div className="pt-4 border-t border-[#E5DFD3]">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-[#5A6D80] flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#2B4257]" />
                  Fill Test Credentials:
                </span>
                <span className="text-[10px] bg-[#F5F0E6] text-[#2B4257] px-2 py-0.5 rounded font-mono border border-[#E5DFD3]">
                  Click to prefill
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleFillTestCreds('ADMIN')}
                  className={`px-2.5 py-2.5 text-xs font-semibold rounded-lg border transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    email === TEST_CREDENTIALS.ADMIN.email
                      ? 'border-[#2B4257] bg-[#F5F0E6] text-[#101E2B] ring-1 ring-[#2B4257] shadow-xs'
                      : 'border-[#E5DFD3] bg-white hover:bg-[#FAF7F0] text-[#101E2B]'
                  }`}
                >
                  <span className="font-bold text-[#2B4257]">Admin</span>
                  <span className="text-[10px] text-[#889AA9] font-normal">Full Control</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFillTestCreds('STAFF')}
                  className={`px-2.5 py-2.5 text-xs font-semibold rounded-lg border transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    email === TEST_CREDENTIALS.STAFF.email
                      ? 'border-[#2B4257] bg-[#F5F0E6] text-[#101E2B] ring-1 ring-[#2B4257] shadow-xs'
                      : 'border-[#E5DFD3] bg-white hover:bg-[#FAF7F0] text-[#101E2B]'
                  }`}
                >
                  <span className="font-bold text-[#101E2B]">Staff</span>
                  <span className="text-[10px] text-[#889AA9] font-normal">Operations</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFillTestCreds('CUSTOMER')}
                  className={`px-2.5 py-2.5 text-xs font-semibold rounded-lg border transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    email === TEST_CREDENTIALS.CUSTOMER.email
                      ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 ring-1 ring-emerald-500 shadow-xs'
                      : 'border-[#E5DFD3] bg-white hover:bg-[#FAF7F0] text-[#101E2B]'
                  }`}
                >
                  <span className="font-bold text-emerald-600">Customer</span>
                  <span className="text-[10px] text-[#889AA9] font-normal">Portal View</span>
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="justify-center border-t border-[#E5DFD3] text-xs text-[#5A6D80]">
            Don't have an account yet?{' '}
            <Link to="/register" className="ml-1 font-semibold text-[#2B4257] hover:underline">
              Create an account
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};