export type BookingService = {
  id: string;
  title: string;
  description: string;
  duration: string;
  durationMins: number;
  icon: string;
  color: string;
  bgColor: string;
  price?: string;
  popular?: boolean;
};

export type TimeSlot = {
  time: string;
  available: boolean;
};

export type BookingFormData = {
  serviceId: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  notes: string;
};

export const SERVICES: BookingService[] = [
  {
    id: 'site_visit',
    title: 'Site Visit',
    description: 'In-person walkthrough of the property with a dedicated agent',
    duration: '90 min',
    durationMins: 90,
    icon: 'MapPin',
    color: '#10B981',
    bgColor: 'rgba(16,185,129,0.10)',
    price: 'Free',
    popular: true,
  },
  {
    id: 'demo',
    title: 'Product Demo',
    description: 'Live demo of the CRM platform tailored to your business',
    duration: '60 min',
    durationMins: 60,
    icon: 'MonitorPlay',
    color: '#7C3AED',
    bgColor: 'rgba(124,58,237,0.10)',
    price: 'Free',
  },
  {
    id: 'call',
    title: 'Discovery Call',
    description: 'Quick call to understand your needs and discuss next steps',
    duration: '30 min',
    durationMins: 30,
    icon: 'Phone',
    color: '#2563EB',
    bgColor: 'rgba(37,99,235,0.10)',
    price: 'Free',
  },
  {
    id: 'consultation',
    title: 'Consultation',
    description: 'In-depth strategy session with a senior advisor',
    duration: '45 min',
    durationMins: 45,
    icon: 'Users',
    color: '#F59E0B',
    bgColor: 'rgba(245,158,11,0.10)',
    price: '₹500',
  },
];

export const AGENTS = [
  { id: 'a1', name: 'Priya Sharma', role: 'Senior Agent', rating: 4.9 },
  { id: 'a2', name: 'Arjun Kapoor', role: 'Sales Lead', rating: 4.8 },
  { id: 'a3', name: 'Sneha Patel', role: 'Property Advisor', rating: 4.7 },
  { id: 'a4', name: 'Rahul Verma', role: 'Field Executive', rating: 4.6 },
];

export function generateTimeSlots(date: string): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const baseSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30',
  ];

  const today = new Date().toISOString().split('T')[0];
  const isToday = date === today;
  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();

  // Deterministic "randomness" based on date string for unavailable slots
  const seed = date.split('-').reduce((s, p) => s + parseInt(p), 0);

  baseSlots.forEach((time, i) => {
    const [h, m] = time.split(':').map(Number);
    let available = true;

    if (isToday && (h < currentHour || (h === currentHour && m <= currentMin))) {
      available = false;
    } else {
      // Pseudo-random unavailability
      available = (seed + i * 3) % 4 !== 0;
    }

    slots.push({ time, available });
  });

  return slots;
}

export function generateDateOptions(days: number): { date: string; label: string; weekday: string; dayNum: string }[] {
  const options: { date: string; label: string; weekday: string; dayNum: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (d.toDateString() === today.toDateString()) label = 'Today';
    else if (d.toDateString() === tomorrow.toDateString()) label = 'Tomorrow';

    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = String(d.getDate());

    options.push({ date: dateStr, label, weekday, dayNum });
  }

  return options;
}
