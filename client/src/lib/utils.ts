import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format a date to a readable string
export function formatDate(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Format a number to a readable string with thousands separator
export function formatNumber(value: number | undefined): string {
  if (value === undefined) return 'N/A';
  
  return new Intl.NumberFormat('fr-FR').format(value);
}

// Format a price to a readable string with currency symbol
export function formatPrice(price: number | undefined): string {
  if (price === undefined) return 'N/A';
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
  }).format(price);
}

// Format a distance in kilometers
export function formatDistance(kilometers: number | undefined): string {
  if (kilometers === undefined) return 'N/A';
  
  return `${formatNumber(kilometers)} km`;
}

// Calculate fuel consumption (L/100km)
export function calculateFuelConsumption(
  fuelQuantity: number,
  distance: number
): number | null {
  if (!fuelQuantity || !distance || distance === 0) return null;
  
  // L/100km formula = (fuel quantity in liters / distance in km) * 100
  return (fuelQuantity / distance) * 100;
}

// Format fuel consumption
export function formatFuelConsumption(consumption: number | null | undefined): string {
  if (consumption === null || consumption === undefined) return 'N/A';
  
  return `${consumption.toFixed(2)} L/100km`;
}

// Get status color class based on status string
export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'operational':
    case 'completed':
    case 'active':
      return 'bg-success/10 text-success';
    case 'maintenance':
    case 'in_progress':
    case 'pending':
      return 'bg-warning/10 text-warning';
    case 'out_of_service':
    case 'cancelled':
    case 'inactive':
      return 'bg-secondary/10 text-secondary';
    case 'critical':
      return 'bg-destructive/10 text-destructive';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

// Translate status to French
export const translateStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'operational': 'Opérationnel',
    'maintenance': 'En maintenance',
    'out_of_service': 'Hors service',
    'pending': 'En attente',
    'in_progress': 'En cours',
    'completed': 'Terminé',
    'cancelled': 'Annulé',
    'active': 'Actif',
    'inactive': 'Inactif',
    'critical': 'Critique',
    'low': 'Faible',
    'medium': 'Moyen',
    'high': 'Élevé'
  };
  
  return statusMap[status.toLowerCase()] || status;
};

// Get icon name for navigation items
export const getNavIcon = (key: string): string => {
  const iconMap: Record<string, string> = {
    'dashboard': 'tachometer-alt',
    'vehicles': 'truck',
    'maintenance': 'tools',
    'work-orders': 'clipboard-list',
    'inventory': 'dolly-flatbed',
    'fuel': 'gas-pump',
    'technicians': 'users',
    'reports': 'file-export',
    'settings': 'cog',
    'logout': 'sign-out-alt'
  };
  
  return iconMap[key] || 'circle';
};
