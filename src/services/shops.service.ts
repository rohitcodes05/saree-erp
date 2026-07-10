import { supabase } from '@/lib/supabase';
import type { Shop, ShopSettings } from '@/types/database.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShopWithStats extends Shop {
  manager_name?: string | null;
  today_revenue?: number;
  today_sales_count?: number;
  staff_count?: number;
}

export type CreateShopInput = {
  company_id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  phone?: string;
  email?: string;
  gst_number?: string;
  manager_id?: string;
  opening_time?: string;
  closing_time?: string;
};

export type UpdateShopInput = Partial<CreateShopInput> & {
  id: string;
  is_active?: boolean;
  logo_url?: string | null;
};

// ─── Fetch Shops ─────────────────────────────────────────────────────────────

export async function getShops(
  companyId: string
): Promise<{ data: ShopWithStats[]; error: string | null }> {
  const { data, error } = await supabase
    .from('shops')
    .select(`
      *,
      manager:profiles!manager_id(first_name, last_name)
    `)
    .eq('company_id', companyId)
    .order('name');

  if (error) return { data: [], error: error.message };

  const shops = (data ?? []).map((s: Shop & { manager?: { first_name: string; last_name: string | null } | null }) => ({
    ...s,
    manager_name: s.manager
      ? `${s.manager.first_name} ${s.manager.last_name ?? ''}`.trim()
      : null,
  }));

  return { data: shops, error: null };
}

// ─── Fetch Single Shop ────────────────────────────────────────────────────────

export async function getShop(
  shopId: string
): Promise<{ data: ShopWithStats | null; error: string | null }> {
  const { data, error } = await supabase
    .from('shops')
    .select(`
      *,
      manager:profiles!manager_id(id, first_name, last_name, email, avatar_url),
      shop_settings(*)
    `)
    .eq('id', shopId)
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as ShopWithStats, error: null };
}

// ─── Create Shop ──────────────────────────────────────────────────────────────

export async function createShop(
  input: CreateShopInput
): Promise<{ data: Shop | null; error: string | null }> {
  const { data, error } = await supabase
    .from('shops')
    .insert(input)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// ─── Update Shop ──────────────────────────────────────────────────────────────

export async function updateShop(
  input: UpdateShopInput
): Promise<{ data: Shop | null; error: string | null }> {
  const { id, ...rest } = input;
  const { data, error } = await supabase
    .from('shops')
    .update(rest)
    .eq('id', id)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// ─── Toggle Shop Status ───────────────────────────────────────────────────────

export async function toggleShopStatus(
  shopId: string,
  isActive: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('shops')
    .update({ is_active: isActive })
    .eq('id', shopId);

  return { error: error?.message ?? null };
}

// ─── Get Shop Settings ────────────────────────────────────────────────────────

export async function getShopSettings(
  shopId: string
): Promise<{ data: ShopSettings | null; error: string | null }> {
  const { data, error } = await supabase
    .from('shop_settings')
    .select('*')
    .eq('shop_id', shopId)
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// ─── Update Shop Settings ─────────────────────────────────────────────────────

export async function updateShopSettings(
  shopId: string,
  updates: Partial<Omit<ShopSettings, 'id' | 'shop_id' | 'created_at' | 'updated_at'>>
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('shop_settings')
    .update(updates)
    .eq('shop_id', shopId);

  return { error: error?.message ?? null };
}

// ─── Get Shop Managers (eligible profiles) ────────────────────────────────────

export async function getEligibleManagers(
  companyId: string
): Promise<{ data: { id: string; label: string }[]; error: string | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .eq('company_id', companyId)
    .in('role', ['super_admin', 'shop_manager'])
    .eq('is_active', true)
    .order('first_name');

  if (error) return { data: [], error: error.message };

  return {
    data: (data ?? []).map(p => ({
      id: p.id,
      label: `${p.first_name} ${p.last_name ?? ''}`.trim(),
    })),
    error: null,
  };
}

// ─── Get Shop Revenue Summary ─────────────────────────────────────────────────

export async function getShopRevenueSummary(
  shopId: string,
  period: 'today' | 'week' | 'month' = 'today'
): Promise<{
  data: { revenue: number; count: number; avg: number } | null;
  error: string | null;
}> {
  const now = new Date();
  let from: string;

  if (period === 'today') {
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  } else if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    from = d.toISOString();
  } else {
    from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }

  const { data, error } = await supabase
    .from('sales')
    .select('total_amount')
    .eq('shop_id', shopId)
    .eq('status', 'completed')
    .gte('sale_date', from);

  if (error) return { data: null, error: error.message };

  const sales = data ?? [];
  const revenue = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);

  return {
    data: {
      revenue,
      count: sales.length,
      avg: sales.length > 0 ? revenue / sales.length : 0,
    },
    error: null,
  };
}
