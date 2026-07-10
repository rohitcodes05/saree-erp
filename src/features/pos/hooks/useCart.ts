import { create } from 'zustand';
import type { Product } from '@/types/database.types';

export interface CartItem {
  id: string; // unique id for cart line
  product: Product;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateDiscount: (id: string, discountPercent: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  
  // Computed helpers (we can calculate these on the fly in UI too)
  getSubtotal: () => number;
  getTotalDiscount: () => number;
  getTotalGST: () => number;
  getGrandTotal: () => number;
}

export const useCart = create<CartState>((set, get) => ({
  items: [],
  
  addItem: (product, quantity = 1) => set((state) => {
    // Check if product already in cart
    const existingItem = state.items.find(item => item.product.id === product.id);
    if (existingItem) {
      return {
        items: state.items.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      };
    }
    
    // Add new item
    const newItem: CartItem = {
      id: crypto.randomUUID(),
      product,
      quantity,
      unitPrice: product.selling_price,
      discountPercent: product.discount_percent || 0,
    };
    return { items: [...state.items, newItem] };
  }),

  updateQuantity: (id, quantity) => set((state) => ({
    items: state.items.map(item => item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item)
  })),

  updateDiscount: (id, discountPercent) => set((state) => ({
    items: state.items.map(item => item.id === id ? { ...item, discountPercent: Math.max(0, Math.min(100, discountPercent)) } : item)
  })),

  removeItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id)
  })),

  clearCart: () => set({ items: [] }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  },

  getTotalDiscount: () => {
    return get().items.reduce((sum, item) => {
      const lineTotal = item.unitPrice * item.quantity;
      return sum + (lineTotal * (item.discountPercent / 100));
    }, 0);
  },

  getTotalGST: () => {
    return get().items.reduce((sum, item) => {
      const lineTotal = item.unitPrice * item.quantity;
      const discount = lineTotal * (item.discountPercent / 100);
      const taxableAmount = lineTotal - discount;
      const gstRate = parseFloat(item.product.gst_rate || '0');
      
      // Assuming prices are exclusive of GST for simplicity. 
      // If inclusive, formula is taxableAmount - (taxableAmount / (1 + gstRate/100))
      return sum + (taxableAmount * (gstRate / 100));
    }, 0);
  },

  getGrandTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getTotalDiscount();
    const gst = get().getTotalGST();
    return subtotal - discount + gst;
  }
}));
