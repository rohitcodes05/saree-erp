import { supabase, rpc } from './supabase';
import type { AuthUser, LoginCredentials, LoginResult } from '@/types/auth';
import type { Profile, Shop, Company } from '@/types/database.types';
import { ROLE_DEFAULT_ROUTE } from '@/constants/roles';

// ─── Sign In ─────────────────────────────────────────────────────────────────

export async function signIn(credentials: LoginCredentials): Promise<LoginResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email.trim().toLowerCase(),
    password: credentials.password,
  });

  if (error) {
    return {
      success: false,
      error: mapAuthError(error.message),
    };
  }

  if (!data.user) {
    return { success: false, error: 'Authentication failed. Please try again.' };
  }

  // Update last login timestamp via RPC (bypasses RLS safely)
  await rpc('update_last_login');

  // Fetch full user context
  const user = await fetchAuthUser(data.user.id);
  if (!user) {
    return { success: false, error: 'Failed to load user profile. Please contact support.' };
  }

  return { success: true, user };
}

// ─── Sign Out ────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// ─── Get Current Session ─────────────────────────────────────────────────────

export async function getCurrentSession(): Promise<AuthUser | null> {
  console.log('[DEBUG] Step 1: getCurrentSession start');
  const { data: { session } } = await supabase.auth.getSession();
  console.log('[DEBUG] Step 2: got session', session?.user?.id);
  if (!session?.user) return null;
  console.log('[DEBUG] Step 3: calling fetchAuthUser');
  const result = await fetchAuthUser(session.user.id);
  console.log('[DEBUG] Step 4: fetchAuthUser returned', result);
  return result;
}

// ─── Fetch Full Auth User ────────────────────────────────────────────────────

export async function fetchAuthUser(userId: string): Promise<AuthUser | null> {
  console.log('[DEBUG] Step 1: fetchAuthUser start', userId);
  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    console.error('[Auth] Failed to fetch profile:', profileError?.message);
    return null;
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();
    return null;
  }

  // Fetch company
  let company: Company | null = null;
  if (profile.company_id) {
    const { data: companyData } = await supabase
      .from('companies')
      .select('*')
      .eq('id', profile.company_id)
      .single();
    company = companyData;
  }

  // Fetch assigned shops
  let assignedShops: Shop[] = [];
  if (profile.role === 'super_admin' && profile.company_id) {
    // Super admin gets all shops in their company
    const { data: shops } = await supabase
      .from('shops')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .order('name');
    assignedShops = shops ?? [];
  } else {
    // Other roles get only their assigned shops
    const { data: staffData } = await supabase
      .from('shop_staff')
      .select('shop_id, shops(*)')
      .eq('profile_id', userId)
      .eq('is_active', true);

    if (staffData) {
      assignedShops = staffData
        .map(s => s.shops as unknown as Shop)
        .filter(Boolean);
    }
  }

  return {
    id: userId,
    email: profile.email,
    profile: profile as Profile,
    company,
    assignedShops,
  };
}

// ─── Password Reset ──────────────────────────────────────────────────────────

export async function requestPasswordReset(email: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    return { success: false, error: mapAuthError(error.message) };
  }

  return { success: true };
}

export async function updatePassword(newPassword: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { success: false, error: mapAuthError(error.message) };
  }
  return { success: true };
}

// ─── Create Staff User (by Super Admin) ──────────────────────────────────────

export async function createStaffUser(params: {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  role: Profile['role'];
  companyId: string;
}): Promise<{ success: boolean; error?: string; userId?: string }> {
  // Note: Creating users via client requires Supabase service key (Edge Function).
  // This function is a placeholder that should be called via an Edge Function.
  console.warn('[Auth] createStaffUser should be called via Edge Function to use service role key.');
  return { success: false, error: 'Use the Edge Function to create staff users.' };
}

// ─── Get Default Route for Role ──────────────────────────────────────────────

export function getDefaultRoute(user: AuthUser): string {
  return ROLE_DEFAULT_ROUTE[user.profile.role];
}

// ─── Auth Error Mapping ───────────────────────────────────────────────────────

function mapAuthError(message: string): string {
  const map: Record<string, string> = {
    'Invalid login credentials':       'Incorrect email or password.',
    'Email not confirmed':             'Please verify your email before logging in.',
    'Too many requests':               'Too many login attempts. Please wait a moment.',
    'User not found':                  'No account found with this email.',
    'Invalid email or password':       'Incorrect email or password.',
    'Password should be at least 6 characters': 'Password must be at least 6 characters.',
    'Email rate limit exceeded':       'Too many requests. Please try again in a few minutes.',
    'Refresh Token Not Found':         'Your session expired. Please log in again.',
    'JWT expired':                     'Your session expired. Please log in again.',
  };

  for (const [key, label] of Object.entries(map)) {
    if (message.includes(key)) return label;
  }

  return message || 'An unexpected error occurred. Please try again.';
}

// ─── Listen to Auth State Changes ────────────────────────────────────────────

export function onAuthStateChange(
  callback: (user: AuthUser | null) => void
): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        callback(null);
        return;
      }

      // SIGNED_IN is already handled by signIn() — skip it here to avoid
      // a duplicate fetchAuthUser call that causes a race condition / hang.
      // Only re-fetch on token refresh or external profile updates.
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        const user = await fetchAuthUser(session.user.id);
        callback(user);
      }
    }
  );

  return () => subscription.unsubscribe();
}
