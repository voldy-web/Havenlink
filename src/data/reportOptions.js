// Choices for problem reports.
export const reportCategories = [
  { id: 'plumbing', label: 'Plumbing', hint: 'Leaks, drains, fixtures', icon: 'wrench' },
  { id: 'electrical', label: 'Electrical', hint: 'Sockets, wiring, lights', icon: 'bolt' },
  { id: 'hvac', label: 'AC & Cooling', hint: 'AC, fans, cooling', icon: 'fan' },
  { id: 'appliances', label: 'Appliances', hint: 'Fridge, cooker, washer', icon: 'washer' },
  { id: 'structural', label: 'Structural', hint: 'Doors, locks, windows', icon: 'home' },
  { id: 'security', label: 'Security', hint: 'Gates, alarms, keys', icon: 'lock' },
]

export const urgencies = [
  { id: 'low', label: 'Low Priority', text: 'Cosmetic issues. Fixed within 5 days.' },
  { id: 'medium', label: 'Medium Priority', text: 'Standard repair. Fixed within 24-48 hours.' },
  { id: 'urgent', label: 'Urgent', text: 'Active leak or no power. Response within 2 hours.' },
]

// The four stages every report moves through (from the proposal).
export const reportStages = [
  { id: 'Submitted', text: 'Your report was logged and sent to the owner.' },
  { id: 'Acknowledged', text: 'The owner has seen it and is arranging a fix.' },
  { id: 'In Progress', text: 'A technician is working on it.' },
  { id: 'Resolved', text: 'The problem is fixed.' },
]

export const EMERGENCY_PHONE = '+233 30 000 0000'
