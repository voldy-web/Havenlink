// The trades in the directory. `id` is used in page addresses, `label` on
// screen. `services` are example price-list items used on provider profiles:
// price = provider hourly rate x factor (or a fixed amount if `fixed` is set).
export const trades = [
  {
    id: 'plumbing', label: 'Plumbing', pill: 'Plumbers', icon: 'wrench',
    services: [
      { name: 'Diagnostic & Leak Inspection', scope: 'Full moisture scan and a written repair quote. Credited toward the repair if you go ahead.', factor: 0.6, unit: 'flat' },
      { name: 'Pipe & Sink Drain Repairs', scope: 'Clearing blocked drains, replacing traps and fixing leaking pipes and taps.', factor: 1, unit: '/hr + parts' },
      { name: 'Water Heater & Valves', scope: 'Water heater service, valve checks and pressure adjustments.', factor: 1.8, unit: 'service' },
      { name: 'Emergency Weekend Callout', scope: 'Fast arrival for burst pipes, severe blockages and total loss of pressure.', factor: 1.4, unit: 'callout' },
    ],
  },
  {
    id: 'electrical', label: 'Electrical', pill: 'Electricians', icon: 'bolt',
    services: [
      { name: 'Fault Finding & Inspection', scope: 'Tracing faults, testing sockets and checking the fuse board.', factor: 0.6, unit: 'flat' },
      { name: 'Wiring & Socket Installation', scope: 'New sockets, switches, lights and safe re-wiring of rooms.', factor: 1, unit: '/hr + parts' },
      { name: 'Backup Power & Solar Hookup', scope: 'Installing changeover switches, inverters or solar connections.', factor: 2.2, unit: 'install' },
      { name: 'Emergency Callout', scope: 'Urgent visits for sparking, tripping or dead circuits.', factor: 1.4, unit: 'callout' },
    ],
  },
  {
    id: 'carpentry', label: 'Carpentry', pill: 'Carpenters', icon: 'hammer',
    services: [
      { name: 'Site Visit & Quote', scope: 'Measuring up and a written quote for your woodwork.', factor: 0.4, unit: 'flat' },
      { name: 'Doors, Frames & Locks', scope: 'Fitting, repairing or re-hanging doors, frames and locks.', factor: 1, unit: '/hr + parts' },
      { name: 'Wardrobes & Cabinetry', scope: 'Built-in wardrobes, kitchen cabinets and shelving to measure.', factor: 3, unit: 'from' },
    ],
  },
  {
    id: 'hvac', label: 'AC & Cooling', pill: 'AC & Cooling', icon: 'fan',
    services: [
      { name: 'AC Diagnostic', scope: 'Checking gas, filters and performance, with a written report.', factor: 0.6, unit: 'flat' },
      { name: 'AC Servicing & Gas Refill', scope: 'Full clean, gas top-up and leak check for split units.', factor: 1.2, unit: 'service' },
      { name: 'New AC Installation', scope: 'Mounting, piping and commissioning of a new split unit.', factor: 2.5, unit: 'install' },
    ],
  },
  {
    id: 'appliances', label: 'Appliances', pill: 'Appliance Repair', icon: 'washer',
    services: [
      { name: 'Appliance Diagnostic', scope: 'Finding the fault in fridges, washers, cookers and more.', factor: 0.5, unit: 'flat' },
      { name: 'Repair Labour', scope: 'Repairing or replacing faulty parts on site.', factor: 1, unit: '/hr + parts' },
    ],
  },
  {
    id: 'cleaning', label: 'Cleaning', pill: 'Deep Cleaners', icon: 'sparkle',
    services: [
      { name: 'Deep Clean', scope: 'Top-to-bottom clean of kitchens, bathrooms and floors.', factor: 4, unit: 'flat' },
      { name: 'Move-in / Move-out Clean', scope: 'Full turnover clean so the home is ready for handover.', factor: 5, unit: 'flat' },
      { name: 'Regular Cleaning', scope: 'Weekly or fortnightly home cleaning.', factor: 1, unit: '/hr' },
    ],
  },
  {
    id: 'security', label: 'Security', pill: 'Security', icon: 'lock',
    services: [
      { name: 'Security Assessment', scope: 'A visit to check doors, locks, gates and lighting.', factor: 0.5, unit: 'flat' },
      { name: 'Locks, Gates & Alarms', scope: 'Fitting and repairing locks, gate motors and alarm systems.', factor: 1, unit: '/hr + parts' },
      { name: 'CCTV Installation', scope: 'Camera supply, fitting and phone setup.', factor: 5, unit: 'from' },
    ],
  },
  {
    id: 'painting', label: 'Painting', pill: 'Painters', icon: 'paint',
    services: [
      { name: 'Site Visit & Quote', scope: 'Measuring up and a written quote for your painting job.', factor: 0.4, unit: 'flat' },
      { name: 'Interior Painting', scope: 'Walls and ceilings, with furniture covered and surfaces prepared.', factor: 1, unit: '/hr + paint' },
      { name: 'Exterior & Fence Painting', scope: 'Weather-proof painting for outer walls and fences.', factor: 1.2, unit: '/hr + paint' },
    ],
  },
  {
    id: 'chef', label: 'Chefs', pill: 'Chefs', icon: 'chef',
    services: [
      { name: 'Private Dinner', scope: 'A chef cooks dinner at your home, shopping included on request.', factor: 3, unit: 'event' },
      { name: 'Weekly Meal Prep', scope: 'A week of meals prepared, labelled and stored.', factor: 4, unit: 'week' },
    ],
  },
  {
    id: 'driver', label: 'Drivers', pill: 'Drivers', icon: 'car',
    services: [
      { name: 'Hourly Driver', scope: 'A driver and vehicle by the hour within the city.', factor: 1, unit: '/hr' },
      { name: 'Moving Day Help', scope: 'Driver and helpers for carrying furniture to your new home.', factor: 4, unit: 'half day' },
    ],
  },
  {
    id: 'handyman', label: 'Handyman', pill: 'Handyman', icon: 'tool',
    services: [
      { name: 'Small Repairs', scope: 'Hanging shelves, fixing handles, patching walls and more.', factor: 1, unit: '/hr' },
      { name: 'Furniture Assembly', scope: 'Building beds, wardrobes and shelves from flat packs.', factor: 0.8, unit: '/hr' },
    ],
  },
]

export const certifications = [
  { id: 'license', label: 'License Verified' },
  { id: 'insured', label: 'Insured' },
  { id: 'emergency', label: 'Emergency 24/7' },
  { id: 'background', label: 'Background Checked' },
]

export const sortOptions = [
  { id: 'rating', label: 'Highest Rated' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'reviews', label: 'Most Reviews' },
]

export const rateRange = { min: 50, max: 250, step: 10 }
