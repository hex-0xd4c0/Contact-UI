import dayjs from 'dayjs';

export const formatDate = (date: string | Date, format = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'default',
    in_transit: 'processing',
    delayed: 'error',
    delivered: 'success',
    active: 'error',
    acknowledged: 'warning',
    resolved: 'success',
  };
  return colors[status] || 'default';
};

export const getTimeAgo = (date: string): string => {
  const diff = dayjs().diff(dayjs(date), 'hour');
  if (diff < 1) return '刚刚';
  if (diff < 24) return `${diff}小时前`;
  const days = Math.floor(diff / 24);
  if (days < 30) return `${days}天前`;
  return formatDate(date);
};
