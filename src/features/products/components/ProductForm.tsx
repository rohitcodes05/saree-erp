import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Upload, X } from 'lucide-react';
import { 
  Button, Input, Textarea, Select, 
  Card, Drawer, Spinner 
} from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCategories, useBrands, useCreateProduct, useUpdateProduct } from '../hooks';
import { calculatePriceWithGST, generateSKU, generateBarcode } from '../utils';
import { uploadFile, getPublicUrl, STORAGE_BUCKETS, supabase } from '@/lib/supabase';
import type { Product } from '@/types/database.types';

const GST_RATES = [
  { value: '0', label: '0% (Exempt)' },
  { value: '5', label: '5% (Standard Saree)' },
  { value: '12', label: '12%' },
  { value: '18', label: '18%' },
  { value: '28', label: '28%' },
];

const productSchema = z.object({
  name: z.string().min(3, 'Name is required'),
  sku: z.string().min(3, 'SKU is required'),
  barcode: z.string().optional(),
  category_id: z.string().min(1, 'Category is required'),
  brand_id: z.string().optional(),
  description: z.string().optional(),
  // Pricing
  purchase_price: z.number().min(0),
  selling_price: z.number().min(0),
  mrp: z.number().optional(),
  gst_rate: z.enum(['0', '5', '12', '18', '28']),
  is_tax_inclusive: z.boolean().default(false),
  // Attributes
  fabric: z.string().optional(),
  color: z.string().optional(),
  minimum_stock: z.number().min(0).default(5),
});

type ProductFormData = z.infer<typeof productSchema>;

export interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

export const ProductForm: React.FC<ProductFormProps> = ({ isOpen, onClose, product }) => {
  const { companyId } = useAuth();
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      barcode: '',
      category_id: '',
      brand_id: '',
      description: '',
      purchase_price: 0,
      selling_price: 0,
      mrp: 0,
      gst_rate: '5',
      is_tax_inclusive: false,
      fabric: '',
      color: '',
      minimum_stock: 5,
    },
  });

  const watchPurchasePrice = watch('purchase_price');
  const watchGstRate = watch('gst_rate');

  // Auto-generate SKU on open if new
  useEffect(() => {
    if (isOpen) {
      if (product) {
        // Reset form with existing product
        reset({
          name: product.name,
          sku: product.sku,
          barcode: product.barcode || '',
          category_id: product.category_id || '',
          brand_id: product.brand_id || '',
          description: product.description || '',
          purchase_price: product.purchase_price,
          selling_price: product.selling_price,
          mrp: product.mrp || 0,
          gst_rate: product.gst_rate,
          is_tax_inclusive: product.is_tax_inclusive,
          fabric: product.fabric || '',
          color: product.color || '',
          minimum_stock: product.minimum_stock,
        });
        setImageFile(null);
        setImagePreview(null);
      } else {
        // New product setup
        reset({
          name: '',
          sku: generateSKU('SILK', Math.floor(Math.random() * 10000)),
          barcode: generateBarcode(),
          category_id: '',
          brand_id: '',
          description: '',
          purchase_price: 0,
          selling_price: 0,
          mrp: 0,
          gst_rate: '5',
          is_tax_inclusive: false,
          fabric: '',
          color: '',
          minimum_stock: 5,
        });
        setImageFile(null);
        setImagePreview(null);
      }
    }
  }, [isOpen, product, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      let savedProduct;

      // Sanitize optional UUID fields
      const cleanData = {
        ...data,
        brand_id: data.brand_id || null,
      };

      if (product) {
        savedProduct = await updateMutation.mutateAsync({
          id: product.id,
          ...cleanData,
        });
        toast.success('Product updated successfully!');
      } else {
        savedProduct = await createMutation.mutateAsync(cleanData);
        toast.success('Product created successfully!');
      }

      // Handle Image Upload
      if (imageFile && savedProduct && companyId) {
        const fileExt = imageFile.name.split('.').pop();
        const filePath = `${companyId}/${savedProduct.id}-${Date.now()}.${fileExt}`;
        
        const uploadResult = await uploadFile(STORAGE_BUCKETS.PRODUCTS, filePath, imageFile);
        
        if ('error' in uploadResult) {
           console.error("Upload error:", uploadResult.error);
           toast.error("Image upload failed! Please create 'product-images' bucket in Supabase.");
        } else {
           // Get the public URL for the uploaded image
           const publicUrl = getPublicUrl(STORAGE_BUCKETS.PRODUCTS, filePath);

           // Save into product_images
           const { error: imgError } = await supabase.from('product_images').insert([{
             product_id: savedProduct.id,
             url: publicUrl,
             storage_path: filePath,
             is_primary: true,
             sort_order: 1
           }]);
           
           if (imgError) console.error("Failed to save product image metadata", imgError);
        }
      }

      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save product');
    }
  };

  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));
  const brandOptions = brands.map(b => ({ value: b.id, label: b.name }));

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Product' : 'Add New Product'}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={isSubmitting}>
            {product ? 'Save Changes' : 'Create Product'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5">
            <h3 className="text-base font-semibold mb-4">Basic Information</h3>
            <div className="space-y-4">
              <Input
                label="Product Name"
                placeholder="e.g. Banarasi Silk Saree"
                error={errors.name?.message}
                {...register('name')}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="category_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Category"
                      options={categoryOptions}
                      placeholder="Select Category"
                      error={errors.category_id?.message}
                      {...field}
                    />
                  )}
                />
                <Controller
                  name="brand_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Brand (Optional)"
                      options={brandOptions}
                      placeholder="Select Brand"
                      error={errors.brand_id?.message}
                      {...field}
                    />
                  )}
                />
              </div>

              <Textarea
                label="Description"
                placeholder="Describe the product..."
                error={errors.description?.message}
                rows={3}
                {...register('description')}
              />
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-base font-semibold mb-4">Pricing & GST</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Purchase Price (₹)"
                type="number"
                error={errors.purchase_price?.message}
                {...register('purchase_price', { valueAsNumber: true })}
              />
              <Input
                label="Selling Price (₹)"
                type="number"
                error={errors.selling_price?.message}
                {...register('selling_price', { valueAsNumber: true })}
              />
              <Input
                label="MRP (₹)"
                type="number"
                error={errors.mrp?.message}
                {...register('mrp', { valueAsNumber: true })}
              />
              <Controller
                name="gst_rate"
                control={control}
                render={({ field }) => (
                  <Select
                    label="GST Rate"
                    options={GST_RATES}
                    error={errors.gst_rate?.message}
                    {...field}
                  />
                )}
              />
            </div>
            {/* Informational GST Calculation */}
            <div className="mt-4 p-3 bg-primary-500/10 text-primary border border-primary/20 rounded-lg text-sm flex items-center justify-between">
              <span>Cost with GST (Est.):</span>
              <span className="font-semibold">₹{calculatePriceWithGST(watchPurchasePrice || 0, Number(watchGstRate)).toFixed(2)}</span>
            </div>
          </Card>
        </div>

        {/* Right Column - Media & Inventory */}
        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="text-base font-semibold mb-4">Product Image</h3>
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-full aspect-square bg-surface-2 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="object-cover w-full h-full" />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute top-2 right-2 p-1 bg-surface shadow-sm rounded-md text-text-muted hover:text-danger"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <Upload className="h-8 w-8 text-surface-4 mx-auto mb-2" />
                    <p className="text-sm text-text-muted">Click to upload image</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-base font-semibold mb-4">Inventory & Tracking</h3>
            <div className="space-y-4">
              <Input
                label="SKU"
                error={errors.sku?.message}
                {...register('sku')}
              />
              <Input
                label="Barcode"
                error={errors.barcode?.message}
                {...register('barcode')}
              />
              <Input
                label="Minimum Stock Alert"
                type="number"
                error={errors.minimum_stock?.message}
                {...register('minimum_stock', { valueAsNumber: true })}
              />
            </div>
          </Card>
        </div>

      </div>
    </Drawer>
  );
};
