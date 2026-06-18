import { Folder, Note, Transaction, Task, ScheduleItem, AppSettings } from './types';

export const INITIAL_FOLDERS: Folder[] = [
  { id: 'f1', name: 'Software Engineering', createdAt: '2026-06-10T10:00:00.000Z' },
  { id: 'f2', name: 'Finance & Planning', createdAt: '2026-06-12T11:00:00.000Z' },
  { id: 'f3', name: 'Personal Development', createdAt: '2026-06-14T09:30:00.000Z' }
];

export const INITIAL_NOTES: Note[] = [
  {
    id: 'n1',
    title: 'Python Sorting Algorithms',
    content: `## Quick Sort vs Merge Sort

This note records details regarding divide-and-conquer sorting approaches.

### Quick Sort Code Example:
\`\`\`python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

print("Sorted output:", quicksort([3, 6, 8, 10, 1, 2, 1]))
\`\`\`

### Complexity Breakdown
- **Time Complexity**: Average case O(n log n), worst case O(n²).
- **Space Complexity**: O(n) for recursions.`,
    folderId: 'f1',
    tags: ['Python', 'Data Structures', 'University'],
    createdAt: '2026-06-15T14:30:00.000Z',
    updatedAt: '2026-06-17T18:22:00.000Z'
  },
  {
    id: 'n2',
    title: 'REST API Best Practices',
    content: `# Designing Scalable APIs

Here are structural guidelines for building highly intuitive REST interfaces.

## Checklist
- [x] Use nouns instead of verbs for resource pathing
- [x] Implement pagination for large resources
- [ ] Implement robust token-based rate limiting
- [x] Return proper HTTP status codes (200, 201, 400, 404, 500)

### Express.js Endpoint Example:
\`\`\`javascript
// Fetch user account overview
const express = require('express');
const app = express();

app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  res.json({ id: userId, name: "Dr. Rachel Carter", role: "Sr. Architect" });
});

console.log("Server routed successfully");
\`\`\`

Ensure you apply suitable header validation before parsing req bodies.`,
    folderId: 'f1',
    tags: ['JavaScript', 'System Architecture'],
    createdAt: '2026-06-16T10:15:00.000Z',
    updatedAt: '2026-06-18T09:00:00.000Z'
  },
  {
    id: 'n3',
    title: 'Financial Independent Plan',
    content: `# Savings Strategy for Q3 & Q4
This document outlines my monthly allocation bounds to maximize investment capital.

### Key Rules
- Save at least 35% of post-tax recurring income.
- Limit eating out expenses below $250 / month.
- Allocate $200 / month to self-directed educational certifications.
- Review subscription audits on the first day of every month.`,
    folderId: 'f2',
    tags: ['Finance', 'Strategy'],
    createdAt: '2026-06-17T09:00:00.000Z',
    updatedAt: '2026-06-17T11:45:00.000Z'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 't1', amount: 3500, type: 'income', category: 'Other', date: '2026-06-01', description: 'Monthly Freelance Work' },
  { id: 't2', amount: 120, type: 'expense', category: 'Food', date: '2026-06-14', description: 'Weekly Groceries Store' },
  { id: 't3', amount: 45, type: 'expense', category: 'Travel', date: '2026-06-15', description: 'Metro Commute Pass' },
  { id: 't4', amount: 200, type: 'expense', category: 'Education', date: '2026-06-16', description: 'Algorithms Specialization Course' },
  { id: 't5', amount: 85, type: 'expense', category: 'Bills', date: '2026-06-17', description: 'Vaporized Fiber Broadband' },
  { id: 't6', amount: 110, type: 'expense', category: 'Shopping', date: '2026-06-17', description: 'Ergonomic Desk Accessories' },
  { id: 't7', amount: 1500, type: 'income', category: 'Other', date: '2026-06-15', description: 'Software Consulting Milestone' }
];

export const INITIAL_TASKS: Task[] = [
  { id: 'tk1', title: 'Compile Final OS Portfolio', description: 'Review and compile all coding labs, designs, and architectural papers for submission.', priority: 'high', dueDate: '2026-06-20', completed: false },
  { id: 'tk2', title: 'Submit Quarterly Income Reports', description: 'Assess business transaction summaries, invoice records and file local business taxes.', priority: 'high', dueDate: '2026-06-22', completed: false },
  { id: 'tk3', title: 'Refactor CodeRunner Sandbox', description: 'Ensure output buffers are flushed promptly and style stdin input boxes beautifully.', priority: 'medium', dueDate: '2026-06-19', completed: true },
  { id: 'tk4', title: 'Schedule Medical Health Screening', description: 'Routine checkup with Dr. Henderson at the Valley Medical Clinic.', priority: 'low', dueDate: '2026-06-25', completed: false },
  { id: 'tk5', title: 'Optimize Database Query Indexes', description: 'Create proper relational compound indexes for user analytics records in local stores.', priority: 'medium', dueDate: '2026-06-21', completed: false }
];

export const INITIAL_SCHEDULE: ScheduleItem[] = [
  { id: 's1', subject: 'Cloud Native Systems', instructor: 'Dr. John Sterling', room: 'Lecture Hall 4A', day: 1, startTime: '09:00', endTime: '10:30', color: 'indigo' },
  { id: 's2', subject: 'Advanced Algorithms', instructor: 'Prof. Helen Finch', room: 'Lab 203', day: 1, startTime: '13:00', endTime: '15:00', color: 'emerald' },
  { id: 's3', subject: 'Database Architectures', instructor: 'Dr. Evelyn Moss', room: 'Seminar C', day: 2, startTime: '10:00', endTime: '11:45', color: 'cyan' },
  { id: 's4', subject: 'Artificial Intelligence', instructor: 'Prof. Marcus Vance', room: 'Lecture Hall 1B', day: 3, startTime: '09:00', endTime: '10:30', color: 'purple' },
  { id: 's5', subject: 'Advanced Algorithms', instructor: 'Prof. Helen Finch', room: 'Lab 203', day: 3, startTime: '11:00', endTime: '12:30', color: 'emerald' },
  { id: 's6', subject: 'Cloud Native Systems', instructor: 'Dr. John Sterling', room: 'Lecture Hall 4A', day: 4, startTime: '14:00', endTime: '15:30', color: 'indigo' },
  { id: 's7', subject: 'Engineering Seminar', instructor: 'Various Speakers', room: 'Auditorium North', day: 5, startTime: '15:00', endTime: '17:00', color: 'amber' }
];

export const DEFAULT_SETTINGS: AppSettings = {
  profile: {
    name: 'Rachel Carter',
    role: 'Full-Stack Developer',
    email: 'rachel.carter@nexagen.io',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    joinedDate: '2026-01-01'
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true
  },
  soundEnabled: true,
  initialBalance: 5000
};
