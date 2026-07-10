'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Sparkles, TrendingUp, Package, Users } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '../hooks/useAuth';

// ─── Schema ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required.')
    .email('Enter a valid email address.'),
  password: z
    .string()
    .min(1, 'Password is required.')
    .min(6, 'Password must be at least 6 characters.'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ─── Feature Items (left panel) ───────────────────────────────────────────────

const features = [
  {
    icon: TrendingUp,
    title: 'Real-time Analytics',
    desc: 'Track revenue, profit & shop performance live.',
  },
  {
    icon: Package,
    title: 'Smart Inventory',
    desc: 'Manage stock across all your stores effortlessly.',
  },
  {
    icon: Users,
    title: 'Customer CRM',
    desc: 'Loyalty points, purchase history & WhatsApp alerts.',
  },
];

// ─── Login Page ───────────────────────────────────────────────────────────────

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);

    const result = await login({
      email: data.email,
      password: data.password,
      rememberMe: data.rememberMe,
    });

    if (!result.success) {
      setServerError(result.error ?? 'Login failed.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface">
      {/* ── Left Panel – Branding ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative overflow-hidden flex-col">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-primary-900 to-surface" />
        {/* Noise texture */}
        <div className="absolute inset-0 bg-noise opacity-50" />
        {/* Decorative orbs */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-primary-600/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 h-64 w-64 rounded-full bg-primary-400/10 blur-2xl" />

        {/* Content */}
        <div className="relative flex flex-col h-full p-10 xl:p-14">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex items-center gap-3"
          >
            <div className="h-11 w-11 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-300" />
            </div>
            <div>
              <p className="font-semibold text-white text-lg leading-tight">
                Saree ERP
              </p>
              <p className="text-xs text-primary-300 leading-tight">
                Multi-Store Management
              </p>
            </div>
          </motion.div>

          {/* Hero Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
            className="mt-auto mb-12"
          >
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight">
              Manage every saree
              <br />
              <span className="text-primary-300">store from one place.</span>
            </h1>
            <p className="mt-4 text-base text-primary-200/80 max-w-md leading-relaxed">
              A production-ready ERP & POS system designed for multi-location
              saree retail businesses. Premium. Fast. Reliable.
            </p>
          </motion.div>

          {/* Feature Items */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col gap-4"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="flex-shrink-0 h-9 w-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-sm">
                  <feature.icon className="h-4 w-4 text-primary-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {feature.title}
                  </p>
                  <p className="text-xs text-primary-200/70 mt-0.5">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Footer */}
          <p className="mt-8 text-xs text-primary-300/50">
            © {new Date().getFullYear()} Saree ERP. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right Panel – Login Form ──────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gradient-radial from-primary-900/5 via-transparent to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-[400px] relative"
        >
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-text text-lg">Saree ERP</span>
          </div>

          {/* Card */}
          <div className="bg-surface-1 border border-border rounded-2xl p-7 shadow-surface-xl">
            {/* Heading */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-text">Welcome back</h2>
              <p className="text-sm text-text-muted mt-1">
                Sign in to your account to continue
              </p>
            </div>

            {/* Error Alert */}
            <AnimatePresence mode="wait">
              {serverError && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/20 text-sm text-danger">
                    {serverError}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <motion.form
              onSubmit={handleSubmit(onSubmit)}
              animate={shake ? { x: [0, -8, 8, -6, 6, -2, 2, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-4"
              noValidate
            >
              {/* Email */}
              <Input
                label="Email Address"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="admin@example.com"
                leftIcon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                required
                {...register('email')}
              />

              {/* Password */}
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.password?.message}
                required
                {...register('password')}
              />

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className={[
                      'h-4 w-4 rounded border-border bg-surface-2',
                      'text-primary focus:ring-primary/30 focus:ring-2',
                      'cursor-pointer transition-colors',
                    ].join(' ')}
                    {...register('rememberMe')}
                  />
                  <span className="text-sm text-text-muted group-hover:text-text transition-colors">
                    Remember me
                  </span>
                </label>
                <a
                  href="/forgot-password"
                  className="text-sm text-primary hover:text-primary-400 transition-colors"
                >
                  Forgot password?
                </a>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2"
                isLoading={isSubmitting}
              >
                {isSubmitting ? 'Signing in…' : 'Sign In'}
              </Button>
            </motion.form>

            <p className="text-center text-sm text-text-muted mt-6">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Create one
              </Link>
            </p>
          </div>

          {/* Security note */}
          <p className="mt-4 text-center text-xs text-text-muted">
            Protected by Row-Level Security & JWT authentication
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
