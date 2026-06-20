'use client';

import { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  isWarning: boolean;
  totalSeconds: number;
  formatted: string;
}

export function useCountdown(deadline: Date | string, warningThresholdHours: number = 1): CountdownResult {
  const calculate = useCallback((): CountdownResult => {
    const now = dayjs();
    const deadlineTime = dayjs(deadline);
    const diff = deadlineTime.diff(now, 'second');
    const isExpired = diff <= 0;
    const isWarning = diff > 0 && diff <= warningThresholdHours * 3600;

    const absDiff = Math.abs(Math.max(0, diff));
    const days = Math.floor(absDiff / 86400);
    const hours = Math.floor((absDiff % 86400) / 3600);
    const minutes = Math.floor((absDiff % 3600) / 60);
    const seconds = absDiff % 60;

    let formatted = '';
    if (isExpired) {
      formatted = '已超时';
    } else if (days > 0) {
      formatted = `${days}天${hours}时${minutes}分`;
    } else if (hours > 0) {
      formatted = `${hours}时${minutes}分${seconds}秒`;
    } else if (minutes > 0) {
      formatted = `${minutes}分${seconds}秒`;
    } else {
      formatted = `${seconds}秒`;
    }

    return {
      days,
      hours,
      minutes,
      seconds,
      isExpired,
      isWarning,
      totalSeconds: diff,
      formatted,
    };
  }, [deadline, warningThresholdHours]);

  const [result, setResult] = useState<CountdownResult>(calculate);

  useEffect(() => {
    const timer = setInterval(() => {
      setResult(calculate());
    }, 1000);

    return () => clearInterval(timer);
  }, [calculate]);

  return result;
}
