import React, { useState } from 'react';
import { Plus, Receipt, TrendingDown } from 'lucide-react';
import { 
  Button, Card, Table, Badge, EmptyState 
} from '@/components/ui';
import type { TableColumn } from '@/components/ui';
import { useExpenses, useDeleteExpense } from './hooks';
import { ExpenseForm } from './components/ExpenseForm';
import type { Expense } from '@/types/database.types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import toast from 'react-hot-toast';

export const ExpensesPage: React.FC = () => {
  const { isCashier } = useAuth();
  const { data: expenses = [], isLoading } = useExpenses();
  const deleteMutation = useDeleteExpense();
  
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Expense deleted successfully');
    } catch (error: any) {
      toast.error('Failed to delete expense');
    }
  };

  const columns: TableColumn<any>[] = [
    {
      header: 'Date',
      key: 'expense_date',
      render: (val) => new Date(val as string).toLocaleDateString('en-IN')
    },
    {
      header: 'Category',
      key: 'category',
      render: (val) => (
        <Badge variant="outline" className="capitalize">
          {String(val).replace('_', ' ')}
        </Badge>
      )
    },
    {
      header: 'Description',
      key: 'description',
      render: (val) => <span className="text-sm">{String(val || '-')}</span>
    },
    {
      header: 'Amount',
      key: 'amount',
      render: (val) => (
        <span className="font-medium text-danger">
          - ₹{Number(val).toLocaleString('en-IN')}
        </span>
      )
    },
    {
      header: 'Recorded By',
      key: 'recorded_by',
      render: (_, row) => {
        if (!row.recorded_by) return '-';
        return `${row.recorded_by.first_name} ${row.recorded_by.last_name || ''}`.trim();
      }
    },
    {
      header: 'Actions',
      key: 'id',
      render: (val) => (
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-danger hover:bg-danger/10"
          onClick={() => handleDelete(val as string)}
        >
          Delete
        </Button>
      )
    }
  ];

  // Calculate total for this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthExpenses = expenses.filter(e => {
    const d = new Date(e.expense_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalThisMonth = thisMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // CASHIER VIEW
  if (isCashier) {
    return (
      <div className="page-container animate-fade-up flex flex-col items-center justify-center min-h-[60vh]">
        <Receipt className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-2xl font-bold text-text mb-2">Record Expense</h1>
        <p className="text-text-muted mb-8 text-center max-w-md">
          Record any daily shop expenses like tea, snacks, or stationary here.
        </p>
        <Button size="lg" onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-5 w-5" /> Add New Expense
        </Button>
        <ExpenseForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
      </div>
    );
  }

  // ADMIN/MANAGER VIEW
  return (
    <div className="page-container animate-fade-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text">Expenses</h1>
          <p className="text-text-muted mt-1">Track and manage your shop expenditures.</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-danger-500/10 rounded-xl">
              <TrendingDown className="h-6 w-6 text-danger-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-muted">Total This Month</p>
              <h3 className="text-2xl font-bold text-text">₹{totalThisMonth.toLocaleString('en-IN')}</h3>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        {expenses.length === 0 ? (
          <EmptyState
            icon={<Receipt className="h-8 w-8 text-current" />}
            title="No expenses found"
            description="You haven't recorded any expenses yet."
            action={
              <Button onClick={() => setIsFormOpen(true)}>
                Add Expense
              </Button>
            }
          />
        ) : (
          <Table 
            data={expenses}
            columns={columns}
            isLoading={isLoading}
            rowKey="id"
          />
        )}
      </Card>

      <ExpenseForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
      />
    </div>
  );
};
