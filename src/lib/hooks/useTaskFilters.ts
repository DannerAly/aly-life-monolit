'use client';

import { useState, useMemo } from 'react';
import type { TaskWithProgress, TaskStatus } from '@/lib/types/database';

type StatusFilter = 'all' | TaskStatus;

export function useTaskFilters(tasks: TaskWithProgress[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter(task => {
      const matchesSearch =
        searchQuery === '' ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.sub_filter?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      const matchesStatus =
        statusFilter === 'all' || task.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Auto-sort: completed tasks to bottom, preserve original order otherwise
    return filtered.sort((a, b) => {
      const aCompleted = a.status === 'completed' ? 1 : 0;
      const bCompleted = b.status === 'completed' ? 1 : 0;
      return aCompleted - bCompleted;
    });
  }, [tasks, searchQuery, statusFilter]);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredTasks,
  };
}
