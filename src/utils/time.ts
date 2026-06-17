export const calculateParkingFee = (
  durationMinutes: number,
  baseRate: number,
  vehicleType: 'car' | 'truck' | 'motorcycle',
  discountThreshold: number,
  discountPercentage: number
): { baseFee: number; discount: number; totalFee: number } => {
  let rate = baseRate;
  if (vehicleType === 'motorcycle') {
    rate = baseRate * 0.4;
  } else if (vehicleType === 'truck') {
    rate = baseRate * 2;
  }

  const hours = Math.ceil(durationMinutes / 60);
  const baseFee = hours * rate;
  let discount = 0;

  if (durationMinutes >= discountThreshold) {
    discount = baseFee * discountPercentage;
  }

  return {
    baseFee: Math.round(baseFee * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    totalFee: Math.round((baseFee - discount) * 100) / 100,
  };
};

export const getGameTimeMultiplier = (difficulty: 'easy' | 'normal' | 'hard'): number => {
  const multipliers = {
    easy: 6,
    normal: 12,
    hard: 20,
  };
  return multipliers[difficulty];
};

export const realTimeToGameTime = (
  realSeconds: number,
  multiplier: number
): number => {
  return realSeconds * multiplier;
};

export const gameTimeToRealTime = (
  gameSeconds: number,
  multiplier: number
): number => {
  return gameSeconds / multiplier;
};

export const formatGameTime = (gameSeconds: number): string => {
  const hours = Math.floor(gameSeconds / 3600);
  const minutes = Math.floor((gameSeconds % 3600) / 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};
