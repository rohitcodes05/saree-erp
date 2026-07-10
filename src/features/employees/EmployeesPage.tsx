import React, { useState } from 'react';
import { Users, Search, Plus, Phone, Edit2, Trash2, MapPin, Briefcase } from 'lucide-react';
import { 
  Button, Input, Card, Table, EmptyState, Spinner, Badge
} from '@/components/ui';
import type { TableColumn } from '@/components/ui';
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from './hooks';
import { EmployeeForm } from './components/EmployeeForm';
import type { Employee } from '@/types/database.types';
import toast from 'react-hot-toast';

export const EmployeesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>();

  const { data: employees = [], isLoading } = useEmployees();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const filteredEmployees = employees.filter(e => 
    e.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.phone && e.phone.includes(searchTerm))
  );

  const handleOpenForm = (employee?: Employee) => {
    setSelectedEmployee(employee);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedEmployee(undefined);
  };

  const handleSubmit = async (data: Partial<Employee>) => {
    if (selectedEmployee) {
      await updateEmployee.mutateAsync({ id: selectedEmployee.id, ...data });
      toast.success('Employee updated successfully');
    } else {
      await createEmployee.mutateAsync(data);
      toast.success('Employee added successfully');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployee.mutateAsync(id);
        toast.success('Employee deleted');
      } catch (err: any) {
        toast.error('Cannot delete employee. They may have active records.');
      }
    }
  };

  const columns: TableColumn<Employee>[] = [
    {
      header: 'Employee',
      key: 'first_name',
      render: (val: any, row) => (
        <div>
          <div className="font-semibold text-text">{row.first_name} {row.last_name}</div>
          <div className="text-xs text-text-muted">Code: {row.employee_code}</div>
        </div>
      )
    },
    {
      header: 'Role & Dept',
      key: 'designation',
      render: (val: any, row) => (
        <div className="space-y-1">
          {val ? <Badge variant="secondary" className="text-[10px]">{val}</Badge> : <span className="text-xs text-text-muted">No Role</span>}
          {row.department && <div className="flex items-center gap-1.5 text-text-muted text-xs"><Briefcase className="h-3 w-3" /> {row.department}</div>}
        </div>
      )
    },
    {
      header: 'Contact',
      key: 'phone',
      render: (val: any, row) => (
        <div className="space-y-0.5">
          {val && <div className="flex items-center gap-1.5 text-text text-sm"><Phone className="h-3 w-3 text-text-muted" /> {val}</div>}
          {row.email && <div className="text-xs text-text-muted">{row.email}</div>}
        </div>
      )
    },
    {
      header: 'Salary',
      key: 'base_salary',
      render: (val: any) => (
        <div className="font-medium text-text">₹{(val || 0).toLocaleString('en-IN')}</div>
      )
    },
    {
      header: 'Actions',
      key: 'id',
      render: (val: any, row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenForm(row)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-danger hover:text-danger hover:bg-danger/10" onClick={() => handleDelete(val)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text">Employees</h1>
          <p className="text-text-muted mt-1">Manage your staff directory, roles, and payroll information.</p>
        </div>
        <Button onClick={() => handleOpenForm()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface-2/50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input 
              placeholder="Search by name or code..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Spinner size="lg" />
          </div>
        ) : filteredEmployees.length === 0 ? (
          <EmptyState 
            icon={<Users className="h-8 w-8" />}
            title="No employees found"
            description="Add your first employee to start managing staff."
            action={<Button onClick={() => handleOpenForm()}>Add Employee</Button>}
          />
        ) : (
          <Table 
            columns={columns as any}
            data={filteredEmployees}
            rowKey="id"
          />
        )}
      </Card>

      <EmployeeForm 
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        initialData={selectedEmployee}
        isLoading={createEmployee.isPending || updateEmployee.isPending}
      />
    </div>
  );
};

export default EmployeesPage;
