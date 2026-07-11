import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Table, Badge, Spinner, Select } from '@/components/ui';
import { Shield, UserPlus, Trash2, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useShops } from '@/hooks/useShops';
import type { TableColumn } from '@/components/ui';
import toast from 'react-hot-toast';

export const UserAccessTab: React.FC = () => {
  const { companyId, isSuperAdmin } = useAuth();
  const { data: shops = [] } = useShops();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assignEmail, setAssignEmail] = useState('');
  const [assignRole, setAssignRole] = useState('staff');
  const [assignShop, setAssignShop] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchProfiles = async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err: any) {
      toast.error('Failed to load user access list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [companyId]);

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignEmail.trim()) return;
    if (assignRole !== 'super_admin' && !assignShop) {
      toast.error('Please select a shop to assign the user to.');
      return;
    }
    
    setIsAssigning(true);
    try {
      // 1. Find profile by email (if they just signed up, company_id might be null)
      // Since Admin can't query profiles with null company_id directly due to RLS,
      // we might need to rely on the fact that if they signed up, they can't be fetched easily.
      const { data, error } = await supabase.rpc('assign_role_by_email', {
        p_email: assignEmail.trim().toLowerCase(),
        p_role: assignRole,
        p_company_id: companyId,
        p_shop_id: assignRole === 'super_admin' ? null : (assignShop || null)
      });

      if (error) {
        if (error.message.includes('User not found')) {
          toast.error('User not found. Make sure they have signed up first!');
        } else {
          throw error;
        }
      } else {
        toast.success(`Assigned ${assignRole} to ${assignEmail}`);
        setAssignEmail('');
        fetchProfiles();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign role');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveAccess = async (id: string, role: string) => {
    if (role === 'super_admin') {
      toast.error('Cannot remove access from super admin');
      return;
    }
    if (window.confirm('Are you sure you want to revoke access for this user?')) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ company_id: null, role: 'staff' })
          .eq('id', id);
        
        if (error) throw error;
        toast.success('Access revoked');
        fetchProfiles();
      } catch (err: any) {
        toast.error('Failed to revoke access');
      }
    }
  };

  const columns: TableColumn<any>[] = [
    {
      header: 'Name',
      key: 'first_name',
      render: (val, row) => (
        <div>
          <p className="font-medium text-text">{row.first_name} {row.last_name}</p>
          <p className="text-xs text-text-muted">{row.email}</p>
        </div>
      )
    },
    {
      header: 'Role',
      key: 'role',
      render: (val) => (
        <Badge variant={val === 'super_admin' ? 'primary' : val === 'cashier' ? 'warning' : 'secondary'}>
          {val === 'super_admin' ? 'Admin' : val === 'cashier' ? 'Cashier' : 'Staff'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      key: 'id',
      render: (val, row) => (
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-danger hover:text-danger hover:bg-danger/10" 
          onClick={() => handleRemoveAccess(val as string, row.role)}
          disabled={row.role === 'super_admin'}
        >
          Revoke
        </Button>
      )
    }
  ];

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center bg-surface-2 rounded-xl">
        <ShieldAlert className="h-12 w-12 text-warning mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-text">Restricted Access</h3>
        <p className="text-text-muted mt-1">Only the Company Admin can assign roles and manage access.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-text">User Roles & Access</h2>
          <p className="text-text-muted mt-1">Assign system roles to emails in your company.</p>
        </div>
      </div>

      {/* Assignment Form */}
      <Card>
        <form onSubmit={handleAssignRole} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="space-y-2 md:col-span-4">
              <label className="text-sm font-medium text-text">User Email</label>
              <Input 
                type="email" 
                placeholder="user@example.com" 
                value={assignEmail}
                onChange={e => setAssignEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-3">
              <label className="text-sm font-medium text-text">Role</label>
              <Select 
                value={assignRole}
                onChange={val => {
                  setAssignRole(val ?? 'staff');
                  if (val === 'super_admin') setAssignShop('');
                }}
                options={[
                  { label: 'Admin (All Access)', value: 'super_admin' },
                  { label: 'Manager (Shop Access)', value: 'shop_manager' },
                  { label: 'Staff (POS Only)', value: 'staff' },
                ]}
              />
            </div>
            <div className="space-y-2 md:col-span-3">
              <label className="text-sm font-medium text-text">Shop</label>
              <Select 
                value={assignShop}
                onChange={val => setAssignShop(val ?? '')}
                options={[
                  { label: 'Select a shop...', value: '' },
                  ...shops.map(s => ({ label: s.name, value: s.id }))
                ]}
                disabled={assignRole === 'super_admin'}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" loading={isAssigning} className="w-full">
                Assign
              </Button>
            </div>
          </div>
          {assignRole !== 'super_admin' && (
            <div className="text-sm text-warning mt-2 bg-warning/10 p-2 rounded-md">
              Note: Non-admin users must also be assigned to a specific shop to log in.
            </div>
          )}
        </form>
      </Card>

      {/* Users List */}
      <div>
        <h3 className="text-lg font-semibold text-text mb-4">Current Users</h3>
        <Card className="p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-8 flex justify-center"><Spinner /></div>
          ) : (
            <Table 
              data={profiles} 
              columns={columns} 
              rowKey="id"
            />
          )}
        </Card>
      </div>
    </div>
  );
};
