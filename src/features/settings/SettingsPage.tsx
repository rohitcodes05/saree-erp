import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store, User, Moon, Sun, Shield, Save } from 'lucide-react';
import { Card, Button, Input, Spinner } from '@/components/ui';
import { useShopDetails, useUpdateShop } from './hooks';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { UserAccessTab } from './components/UserAccessTab';
import { useThemeStore } from '@/store/themeStore';

const shopSchema = z.object({
  name: z.string().min(2, 'Shop name is required'),
  code: z.string().min(2, 'Shop code is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().min(5, 'Address is required'),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  gst_number: z.string().optional(),
});

type ShopFormValues = z.infer<typeof shopSchema>;

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'shop' | 'profile' | 'appearance' | 'access'>('shop');
  
  const { resolvedTheme, toggleTheme } = useThemeStore();
  const { user, isSuperAdmin } = useAuth();
  const { data: shopDetails, isLoading: isShopLoading } = useShopDetails();
  const updateShop = useUpdateShop();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ShopFormValues>({
    resolver: zodResolver(shopSchema),
  });

  useEffect(() => {
    if (shopDetails) {
      reset({
        name: shopDetails.name,
        code: shopDetails.code,
        phone: shopDetails.phone || '',
        email: shopDetails.email || '',
        address: shopDetails.address,
        city: shopDetails.city || '',
        state: shopDetails.state || '',
        pincode: shopDetails.pincode || '',
        gst_number: shopDetails.gst_number || '',
      });
    }
  }, [shopDetails, reset]);

  const onShopSubmit = async (data: ShopFormValues) => {
    const cleanedData = {
      ...data,
      email: data.email || undefined,
    };
    await updateShop.mutateAsync(cleanedData);
  };

  if (isShopLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-text">Settings</h1>
        <p className="text-text-muted mt-1">Manage your shop preferences and profile.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 space-y-1">
          <button
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'shop' ? 'bg-primary text-white shadow-sm' : 'text-text hover:bg-surface-2'
            }`}
            onClick={() => setActiveTab('shop')}
          >
            <Store className="h-4 w-4" />
            Shop Details
          </button>
          <button
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'profile' ? 'bg-primary text-white shadow-sm' : 'text-text hover:bg-surface-2'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            <User className="h-4 w-4" />
            My Profile
          </button>
          <button
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'appearance' ? 'bg-primary text-white shadow-sm' : 'text-text hover:bg-surface-2'
            }`}
            onClick={() => setActiveTab('appearance')}
          >
            {resolvedTheme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            Appearance
          </button>
          {isSuperAdmin && (
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'access' ? 'bg-primary text-white shadow-sm' : 'text-text hover:bg-surface-2'
              }`}
              onClick={() => setActiveTab('access')}
            >
              <Shield className="h-4 w-4" />
              User Access
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          
          {/* SHOP DETAILS TAB */}
          {activeTab === 'shop' && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-text mb-6">Shop Configuration</h2>
              <form onSubmit={handleSubmit(onShopSubmit)} className="space-y-6">
                
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Shop Name" {...register('name')} error={errors.name?.message} required />
                  <Input label="Shop Code (Prefix)" {...register('code')} error={errors.code?.message} required />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Phone Number" {...register('phone')} />
                  <Input label="Email Address" type="email" {...register('email')} />
                </div>
                
                <Input label="Street Address" {...register('address')} error={errors.address?.message} required />
                
                <div className="grid grid-cols-3 gap-4">
                  <Input label="City" {...register('city')} />
                  <Input label="State" {...register('state')} />
                  <Input label="Pincode" {...register('pincode')} />
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-text-muted mb-4 uppercase tracking-wider">Tax Details</h3>
                  <div className="w-1/2 pr-2">
                    <Input label="GST Number" {...register('gst_number')} />
                  </div>
                </div>

                <div className="pt-6 border-t border-border flex justify-end">
                  <Button type="submit" isLoading={updateShop.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-text mb-6">My Profile</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Email (Login ID)</label>
                  <Input value={user?.email || ''} disabled className="bg-surface-2" />
                  <p className="text-xs text-text-muted mt-2">
                    Your email is managed by the central authentication system. To change your password, use the "Forgot Password" link on the login screen.
                  </p>
                </div>
                
                <div className="pt-6 border-t border-border">
                  <Button variant="outline" onClick={() => alert('Profile updates via Supabase Auth are currently handled externally.')}>
                    Update Profile Details
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-text mb-6">Appearance</h2>
              <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                <div>
                  <h3 className="font-medium text-text">Theme Preference</h3>
                  <p className="text-sm text-text-muted mt-1">
                    Choose between light and dark mode.
                  </p>
                </div>
                <Button variant="outline" onClick={toggleTheme}>
                  {resolvedTheme === 'light' ? (
                    <><Moon className="h-4 w-4 mr-2" /> Switch to Dark</>
                  ) : (
                    <><Sun className="h-4 w-4 mr-2" /> Switch to Light</>
                  )}
                </Button>
              </div>
            </Card>
          )}

          {/* USER ACCESS TAB */}
          {activeTab === 'access' && isSuperAdmin && (
            <UserAccessTab />
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
