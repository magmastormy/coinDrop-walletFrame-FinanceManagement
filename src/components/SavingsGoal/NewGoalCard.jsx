import React, { useState } from 'react';
import { Plus, Target, DollarSign, Calendar } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';

const NewGoalCard = ({ onCreate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({
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
    setFormData({ name: '', targetAmount: '', deadline: '' });
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full h-full min-h-[280px] group relative flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
      >
        <div className="p-4 rounded-full bg-white/5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
          <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
            Create New Goal
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Set a target and start saving
          </p>
        </div>
      </button>
    );
  }

  return (
    <GlassCard className="h-full min-h-[280px] p-6 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20 text-primary">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">New Goal</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
        <Input
          placeholder="Goal Name (e.g., New Car)"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="bg-white/5"
        />

        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="number"
            placeholder="Target Amount"
            value={formData.targetAmount}
            onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
            required
            min="0"
            step="0.01"
            className="pl-9 bg-white/5"
          />
        </div>

        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="date"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            className="pl-9 bg-white/5"
          />
        </div>

        <Button type="submit" className="mt-auto w-full">
          Create Goal
        </Button>
      </form>
    </GlassCard>
  );
};

export default NewGoalCard;
