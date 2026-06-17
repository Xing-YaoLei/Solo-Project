export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

export const distance = (a: [number, number, number], b: [number, number, number]): number => {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

export const formatCurrency = (amount: number): string => {
  return `¥${amount.toFixed(2)}`;
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatGameTime = (gameSeconds: number): string => {
  const hours = Math.floor(gameSeconds / 3600);
  const minutes = Math.floor((gameSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  }
  return `${minutes}分钟`;
};

export const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const randomRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

export const randomInt = (min: number, max: number): number => {
  return Math.floor(randomRange(min, max + 1));
};

export const randomChoice = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

export const generatePlateNumber = (): string => {
  const provinces = ['京', '沪', '粤', '苏', '浙', '鲁', '川', '鄂', '豫', '冀'];
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const province = randomChoice(provinces);
  const cityLetter = letters[Math.floor(Math.random() * letters.length)];
  const numbers = Array.from({ length: 5 }, () => 
    Math.random() > 0.5 
      ? Math.floor(Math.random() * 10).toString() 
      : letters[Math.floor(Math.random() * letters.length)]
  ).join('');
  return `${province}${cityLetter}${numbers}`;
};
