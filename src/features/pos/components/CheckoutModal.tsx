import React, { useState, useEffect } from 'react';
import { 
  Button, Input, Select, Modal 
} from '@/components/ui';
import type { PaymentMethod } from '@/types/database.types';
import { Banknote, CreditCard, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  grandTotal: number;
  onConfirm: (payload: { paymentMethod: PaymentMethod; amountPaid: number }) => Promise<void>;
  isProcessing: boolean;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'upi', label: 'UPI', icon: Smartphone },
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen, onClose, grandTotal, onConfirm, isProcessing
}) => {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [amountPaidStr, setAmountPaidStr] = useState<string>('');
  
  useEffect(() => {
    if (isOpen) {
      setMethod('cash');
      setAmountPaidStr(grandTotal.toString());
    }
  }, [isOpen, grandTotal]);

  const amountPaid = parseFloat(amountPaidStr) || 0;
  const changeDue = Math.max(0, amountPaid - grandTotal);
  const remainingDue = Math.max(0, grandTotal - amountPaid);

  const handleConfirm = () => {
    onConfirm({ paymentMethod: method, amountPaid });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Payment"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
          <Button 
            onClick={handleConfirm} 
            isLoading={isProcessing}
            disabled={remainingDue > 0 && method !== 'mixed'} // require full payment for simple demo
          >
            Charge ₹{amountPaid.toFixed(2)}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Grand Total Header */}
        <div className="p-6 bg-surface-2 rounded-2xl border border-border text-center">
          <p className="text-sm text-text-muted mb-1">Amount Due</p>
          <p className="text-4xl font-bold text-text">₹{grandTotal.toFixed(2)}</p>
        </div>

        {/* Payment Methods */}
        <div>
          <label className="block text-sm font-medium text-text mb-3">Payment Method</label>
          <div className="grid grid-cols-3 gap-3">
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm.value}
                onClick={() => setMethod(pm.value)}
                className={cn(
                  'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all',
                  method === pm.value 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border bg-surface-1 text-text-muted hover:border-text-muted'
                )}
              >
                <pm.icon className="h-6 w-6 mb-2" />
                <span className="text-sm font-medium">{pm.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Amount Given (for Cash) */}
        {method === 'cash' && (
          <div className="space-y-4 pt-4 border-t border-border">
            <Input
              label="Amount Received (₹)"
              type="number"
              value={amountPaidStr}
              onChange={(e) => setAmountPaidStr(e.target.value)}
              autoFocus
            />
            
            <div className="flex justify-between items-center p-4 bg-success/10 rounded-xl">
              <span className="text-sm font-medium text-success-600">Change Due:</span>
              <span className="text-xl font-bold text-success-700">₹{changeDue.toFixed(2)}</span>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
};
