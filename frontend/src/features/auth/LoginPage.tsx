import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui';
import type { Role } from '../../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, demoLogin, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

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

  const handleQuickDemo = async (role: Role) => {
    setError(null);
    try {
      const u = await demoLogin(role);
      setDemoNotice(`Logged in as ${u.fullName} (${role})`);
      setTimeout(() => {
        if (u.role === 'CUSTOMER') {
          navigate('/portal');
        } else {
          navigate('/');
        }
      }, 300);
    } catch (err: any) {
      setError(err?.message || 'Demo login failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo */}
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-600 text-white font-black text-xl shadow-md mb-3">
          B
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Brightloop
        </h2>
        <p className="mt-1 text-sm text-slate-500 font-medium">
          Subscription Management & Recurring Invoicing Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold text-slate-900">Sign in to your account</CardTitle>
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
                  <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
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

            {/* Quick Demo Role Picker for Judges */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Instant Hackathon Demo Login:
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                  1-Click
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('ADMIN')}
                  className="px-2.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-400 text-slate-700 transition-all text-center"
                >
                  <span className="block font-bold text-blue-600">Admin</span>
                  <span className="text-[10px] text-slate-400 block truncate">Full Control</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('STAFF')}
                  className="px-2.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-400 text-slate-700 transition-all text-center"
                >
                  <span className="block font-bold text-slate-800">Staff</span>
                  <span className="text-[10px] text-slate-400 block truncate">Operations</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('CUSTOMER')}
                  className="px-2.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-400 text-slate-700 transition-all text-center"
                >
                  <span className="block font-bold text-emerald-600">Customer</span>
                  <span className="text-[10px] text-slate-400 block truncate">Portal View</span>
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="justify-center border-t border-slate-100 text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="ml-1 font-semibold text-blue-600 hover:underline">
              Create an account
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
