import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isToday, isFuture, isPast, startOfDay } from 'date-fns';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatDateTime(date) {
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}

export function formatTime(date) {
  return format(new Date(date), 'h:mm a');
}

export function isOrderToday(date) {
  return isToday(new Date(date));
}

export function isOrderUpcoming(date) {
  const d = new Date(date);
  return isFuture(startOfDay(d)) && !isToday(d);
}

export function isOverdue(date, status) {
  return isPast(new Date(date)) && status !== 'Delivered';
}
