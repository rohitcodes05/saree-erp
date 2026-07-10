import React, { useState } from 'react';
import { ShoppingCart, Search, Trash2, Plus, Minus, Receipt } from 'lucide-react';
import { 
  Button, Input, Card, EmptyState, Badge, Spinner
} from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useInventory } from '@/features/inventory/hooks';
import { useCart, useCreateSale } from './hooks';
import { CheckoutModal } from './components/CheckoutModal';
import toast from 'react-hot-toast';

export const POSPage: React.FC = () => {
  const { assignedShops } = useAuth();
  const shopId = assignedShops?.[0]?.id; // Default to first assigned shop for POS

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  // Success screen state
  const [completedSale, setCompletedSale] = useState<any>(null);

  // Queries & Mutations
  const { data: inventory = [], isLoading: isLoadingInventory } = useInventory(shopId);
  const { items, addItem, updateQuantity, removeItem, clearCart, getSubtotal, getTotalDiscount, getTotalGST, getGrandTotal } = useCart();
  const createSale = useCreateSale();

  // Search filtering
  const filteredProducts = inventory.filter(item => 
    item.quantity > 0 && // Only show items in stock
    (item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (item.barcode && item.barcode.includes(searchTerm)))
  );

  const handleCheckout = async ({ paymentMethod, amountPaid }: { paymentMethod: any, amountPaid: number }) => {
    if (!shopId) {
      toast.error('No shop assigned.');
      return;
    }
    
    try {
      const sale = await createSale.mutateAsync({
        shopId,
        items,
        subtotal: getSubtotal(),
        discountAmount: getTotalDiscount(),
        taxAmount: getTotalGST(),
        totalAmount: getGrandTotal(),
        amountPaid,
        paymentMethod
      });
      
      toast.success('Sale completed successfully!');
      setCompletedSale(sale);
      clearCart();
      setIsCheckoutOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete sale');
    }
  };

  const startNewSale = () => {
    setCompletedSale(null);
  };

  if (!shopId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState title="No Shop Assigned" description="You need to be assigned to a shop to use POS." icon={<ShoppingCart className="h-10 w-10" />} />
      </div>
    );
  }

  if (completedSale) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-1 rounded-2xl border border-border">
        <div className="h-20 w-20 bg-success-50 rounded-full flex items-center justify-center mb-6">
          <Receipt className="h-10 w-10 text-success" />
        </div>
        <h2 className="text-3xl font-bold text-text mb-2">Sale Completed!</h2>
        <p className="text-text-muted mb-8 text-center max-w-sm">
          The transaction was successful. You can now print the receipt or start a new sale.
        </p>
        
        <div className="bg-surface-2 p-6 rounded-xl border border-border w-full max-w-md mb-8 space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-border border-dashed">
            <span className="text-text-muted">Invoice Number</span>
            <span className="font-bold text-lg text-primary">{completedSale.invoice_number}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-muted">Total Amount</span>
            <span className="font-bold text-text">₹{completedSale.total_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-muted">Amount Paid</span>
            <span className="font-bold text-success">₹{completedSale.amount_paid.toFixed(2)}</span>
          </div>
          {completedSale.change_amount > 0 && (
            <div className="flex justify-between items-center pt-2 border-t border-border border-dashed">
              <span className="text-text-muted font-medium">Change to Return</span>
              <span className="font-bold text-warning text-lg">₹{completedSale.change_amount.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="flex gap-4 w-full max-w-md">
          <Button 
            variant="outline" 
            className="flex-1 py-6"
            onClick={() => {
              toast.success('Printing receipt... (Simulation)');
              // Future: call actual print logic
            }}
          >
            Print Receipt
          </Button>
          <Button 
            className="flex-1 py-6"
            onClick={startNewSale}
          >
            New Sale
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 max-h-[calc(100vh-6rem)]">
      
      {/* ── Left Side: Product Discovery ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface-1 rounded-2xl border border-border overflow-hidden">
        {/* Search Header */}
        <div className="p-4 border-b border-border bg-surface-2 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
            <Input 
              placeholder="Scan barcode or search products..." 
              className="pl-10 w-full text-lg py-6"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoadingInventory ? (
            <div className="flex h-full items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <EmptyState 
              icon={<Search className="h-8 w-8" />}
              title="No products found"
              description="Try searching for another SKU or name."
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(item => (
                <button
                  key={item.id}
                  onClick={() => addItem({
                    id: item.product_id,
                    name: item.product_name,
                    sku: item.sku,
                    barcode: item.barcode,
                    selling_price: item.selling_price,
                    purchase_price: item.purchase_price,
                    gst_rate: item.gst_rate as any,
                    discount_percent: 0 // defaults
                  } as any)} 
                  className="flex flex-col text-left bg-surface-2 p-3 rounded-xl border border-border hover:border-primary hover:shadow-glow-sm transition-all group"
                >
                  <div className="aspect-square bg-surface-3 rounded-lg mb-3 w-full flex items-center justify-center text-surface-4 overflow-hidden relative">
                     {(item as any).primary_image_url ? (
                       <img src={(item as any).primary_image_url} alt={item.product_name} className="w-full h-full object-cover" />
                     ) : (
                       <span className="text-xs uppercase font-bold">{item.category_name?.substring(0, 3) || 'SAR'}</span>
                     )}
                  </div>
                  <h3 className="font-semibold text-text text-sm line-clamp-2 mb-1">{item.product_name}</h3>
                  <p className="text-xs text-text-muted mb-2">SKU: {item.sku}</p>
                  <div className="mt-auto flex items-center justify-between w-full">
                    <span className="font-bold text-primary">₹{item.selling_price}</span>
                    <Badge variant="secondary" className="text-[10px]">Stk: {item.quantity}</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right Side: Cart Summary ── */}
      <div className="w-full lg:w-96 flex-shrink-0 flex flex-col bg-surface-2 rounded-2xl border border-border overflow-hidden">
        
        {/* Cart Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface-1">
          <div className="flex items-center gap-2 font-semibold text-text">
            <ShoppingCart className="h-5 w-5" />
            Current Order
          </div>
          <Badge variant="primary">{items.length} Items</Badge>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-60">
              <Receipt className="h-12 w-12 mb-3" />
              <p>Cart is empty</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex flex-col gap-2 p-3 bg-surface-1 rounded-xl border border-border">
                <div className="flex justify-between items-start">
                  <div className="pr-2">
                    <h4 className="font-medium text-sm text-text line-clamp-1">{(item.product as any).product_name || item.product.name}</h4>
                    <p className="text-xs text-text-muted mt-0.5">₹{item.unitPrice} / unit</p>
                  </div>
                  <span className="font-semibold text-sm">
                    ₹{(item.unitPrice * item.quantity).toFixed(2)}
                  </span>
                </div>
                
                {/* Controls */}
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1 bg-surface-3 rounded-lg p-0.5">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 hover:bg-surface-4 rounded-md transition-colors"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 hover:bg-surface-4 rounded-md transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-danger hover:bg-danger/10 rounded-md transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Checkout */}
        <div className="p-4 bg-surface-1 border-t border-border space-y-3">
          <div className="flex justify-between text-sm text-text-muted">
            <span>Subtotal</span>
            <span>₹{getSubtotal().toFixed(2)}</span>
          </div>
          {getTotalDiscount() > 0 && (
            <div className="flex justify-between text-sm text-success-600">
              <span>Discount</span>
              <span>- ₹{getTotalDiscount().toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-text-muted">
            <span>GST Amount</span>
            <span>+ ₹{getTotalGST().toFixed(2)}</span>
          </div>
          
          <div className="pt-3 border-t border-dashed border-border flex justify-between items-center">
            <span className="font-semibold text-text">Total</span>
            <span className="text-2xl font-bold text-text">₹{getGrandTotal().toFixed(2)}</span>
          </div>

          <Button 
            className="w-full mt-4 py-6 text-lg" 
            disabled={items.length === 0}
            onClick={() => setIsCheckoutOpen(true)}
          >
            Charge ₹{getGrandTotal().toFixed(2)}
          </Button>
        </div>
      </div>

      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        grandTotal={getGrandTotal()}
        onConfirm={handleCheckout}
        isProcessing={createSale.isPending}
      />
    </div>
  );
};

export default POSPage;
