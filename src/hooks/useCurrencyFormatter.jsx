import { useMemo } from 'react';

export const useCurrencyFormatter = () => {
  const formatter = useMemo(() => 
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }), []
  );

  const formatCurrency = useMemo(() => (amount) => {
    if (amount === null || amount === undefined) return '$0.00';
    return formatter.format(amount);
  }, [formatter]);

  return formatCurrency;
};

export default useCurrencyFormatter;
