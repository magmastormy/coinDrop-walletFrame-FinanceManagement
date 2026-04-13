import React, { useState } from 'react';
import { Target, DollarSign, Calendar } from 'lucide-react';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import FormContainer from '../ui/FormContainer';
import useFormManager from '../../hooks/useFormManager';

const NewGoalCard = ({ onCreate }) => {
  const { formData, updateField, resetForm } = useFormManager({
    name: '',
    targetAmount: '',
    deadline: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      ...formData,
      targetAmount: Number(formData.targetAmount)
    });
    resetForm();
  };

  return (
    <FormContainer onSubmit={handleSubmit} spacing="6" className="flex-1 flex flex-col">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Target className="w-[20px] h-[20px]" strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-bold text-white">Create New Savings Goal</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-on-surface-variant">Goal Name</label>
          <Input
            placeholder="e.g., First Home, New Car, Europe Trip"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-on-surface-variant">Target Amount</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              placeholder="0.00"
              value={formData.targetAmount}
              onChange={(e) => updateField('targetAmount', e.target.value)}
              required
              min="0"
              step="0.01"
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-on-surface-variant">Target Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              value={formData.deadline}
              onChange={(e) => updateField('deadline', e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button variant="ghost" type="button" onClick={resetForm}>
          Cancel
        </Button>
        <Button type="submit" disabled={!formData.name || !formData.targetAmount}>
          Create Goal
        </Button>
      </div>
    </FormContainer>
  );
};

export default NewGoalCard;
