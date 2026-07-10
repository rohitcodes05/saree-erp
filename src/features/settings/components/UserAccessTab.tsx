import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Table, Badge, Spinner, Select } from '@/components/ui';
import { Shield, UserPlus, Trash2 } from 'lucide-react';
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
  const [assignRole, setAssignRole] = useState('cashier');
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
    if (!assignShop) {
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
        p_shop_id: assignShop
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
          onClick={() => handleRemoveAccess(val, row.role)}
          disabled={row.role === 'super_admin'}
        >
          Revoke
        </Button>
      )
    }
  ];

  if (!isSuperAdmin) {
    return (
      <Card className="p-6 text-center">
        <Shield className="h-12 w-12 text-danger/50 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-text">Access Denied</h2>
        <p className="text-sm text-text-muted mt-2">You do not have permission to manage user access.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-bold text-text mb-2 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" /> Assign New Staff Role
        </h2>
        <p className="text-sm text-text-muted mb-4">
          Enter the email address of the staff member who just signed up. This will grant them access to your shop.
        </p>
        
        <form onSubmit={handleAssignRole} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <Input 
              label="Staff Email Address" 
              type="email" 
              placeholder="staff@example.com" 
              value={assignEmail}
              onChange={(e) => setAssignEmail(e.target.value)}
              required
            />
          </div>
          <div className="w-full sm:w-48">
            <Select 
              label="Select Shop"
              value={assignShop}
              onChange={(val) => setAssignShop(val ?? '')}
              options={[
                { value: '', label: 'Select a shop...' },
                ...shops.map(s => ({ value: s.id, label: s.name }))
              ]}
              required
            />
          </div>
          <div className="w-full sm:w-48">
            <Select 
              label="Select Role"
              value={assignRole}
              onChange={(val) => setAssignRole(val ?? 'staff')}
              options={[
                { value: 'staff', label: 'Staff' },
                { value: 'cashier', label: 'Cashier (Billing Only)' },
                { value: 'shop_manager', label: 'Shop Manager' }
              ]}
            />
          </div>
          <Button type="submit" isLoading={isAssigning} className="w-full sm:w-auto h-10">
            Grant Access
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-text mb-6">Staff with Access</h2>
        
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <Table 
            data={profiles}
            columns={columns}
          />
        )}
      </Card>
    </div>
  );
};
