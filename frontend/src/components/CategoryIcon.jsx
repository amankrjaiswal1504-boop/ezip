import { Car, Laptop, Newspaper, Recycle, Refrigerator, Shirt, Wrench } from 'lucide-react';

const MAP = { recycle: Recycle, ewaste: Laptop, appliance: Refrigerator, vehicle: Car, paper: Newspaper, clothes: Shirt };

export default function CategoryIcon({ icon, className = 'w-6 h-6' }) {
  const Icon = MAP[icon] || Wrench;
  return <Icon className={className} aria-hidden />;
}
