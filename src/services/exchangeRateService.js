const EXCHANGE_RATE_KEY = 'exchange_rate';

export const getExchangeRate = () => {
  const rate = localStorage.getItem(EXCHANGE_RATE_KEY);
  return rate ? parseFloat(rate) : 0; // 0 significa que no hay tasa definida
};

export const setExchangeRate = (rate) => {
  localStorage.setItem(EXCHANGE_RATE_KEY, rate.toString());
};