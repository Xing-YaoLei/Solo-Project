import React, { useState, useEffect } from 'react';
import { Droplets, Zap, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { validateMeterReadingValue } from '@/utils/validation';
import type { MeterReading } from '@/types';

interface MeterDisplayProps {
  meter: MeterReading;
  type: 'water' | 'electric';
  unitPrice?: number;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const MeterDisplay: React.FC<MeterDisplayProps> = ({
  meter,
  type,
  unitPrice = 0,
  value,
  onChange,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState(value?.toString() || '');
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setInputValue(value?.toString() || '');
  }, [value]);

  const usage = meter.currentReading - meter.previousReading;
  const estimatedCost = usage * unitPrice;
  const playerUsage = parseFloat(inputValue) - meter.previousReading;
  const playerCost = isNaN(playerUsage) ? 0 : playerUsage * unitPrice;
  const tolerance = meter.tolerance;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*\.?\d*$/.test(val) || val === '') {
      setInputValue(val);
      setError(null);
    }
  };

  const handleBlur = () => {
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue)) {
      setError('请输入有效数字');
      return;
    }

    const validation = validateMeterReadingValue(
      numValue,
      meter.previousReading,
      meter.tolerance
    );

    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    onChange(numValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setInputValue(value?.toString() || '');
      setIsEditing(false);
      setError(null);
    }
  };

  const handleIncrement = () => {
    const current = parseFloat(inputValue) || 0;
    const newValue = current + 1;
    setInputValue(newValue.toString());
    onChange(newValue);
  };

  const handleDecrement = () => {
    const current = parseFloat(inputValue) || 0;
    const newValue = Math.max(meter.previousReading, current - 1);
    setInputValue(newValue.toString());
    onChange(newValue);
  };

  const isCorrect = Math.abs(parseFloat(inputValue) - meter.currentReading) <= meter.tolerance;
  const isFilled = value !== undefined && value !== null;

  const Icon = type === 'water' ? Droplets : Zap;
  const typeColor = type === 'water' ? 'text-blue-400' : 'text-yellow-400';
  const typeBg = type === 'water' ? 'bg-blue-500/10' : 'bg-yellow-500/10';
  const typeBorder = type === 'water' ? 'border-blue-500/30' : 'border-yellow-500/30';

  return (
    <Card
      className={cn(
        'transition-all duration-300',
        isFilled && isCorrect && 'border-green-500/50 bg-green-500/5',
        isFilled && !isCorrect && 'border-red-500/50 bg-red-500/5',
        error && 'border-red-500/50',
        disabled && 'opacity-60'
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', typeBg, typeBorder)}>
              <Icon className={cn('w-6 h-6', typeColor)} />
            </div>
            <div>
              <CardTitle className="text-base">
                {type === 'water' ? '水表' : '电表'}
              </CardTitle>
              <p className="text-xs text-gray-400">租户: {meter.tenantId}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-400">上期读数</span>
            <p className="text-xl font-bold text-white">{meter.previousReading}</p>
            <p className="text-xs text-gray-500 mt-1">
              允许误差: ±{tolerance}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="text-center">
            <span className="text-xs text-gray-400">实际用量</span>
            <p className="text-lg font-bold text-gray-300">{usage}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-600" />
          <div className="text-center">
            <span className="text-xs text-gray-400">单价</span>
            <p className="text-lg font-bold text-gray-300">¥{unitPrice}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-600" />
          <div className="text-center">
            <span className="text-xs text-gray-400">预估费用</span>
            <p className="text-lg font-bold text-accent-400">¥{estimatedCost.toFixed(0)}</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm text-gray-400">请录入本期读数:</label>
          
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDecrement}
              disabled={disabled || parseFloat(inputValue) <= meter.previousReading}
              keyboardShortcut="-"
            >
              -
            </Button>
            
            <input
              type="text"
              inputMode="decimal"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsEditing(true)}
              disabled={disabled}
              className={cn(
                'flex-1 text-center text-2xl font-bold py-3 px-4 rounded-lg',
                'bg-gray-900/50 border-2 transition-all',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                error ? 'border-red-500' : 'border-gray-700',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              placeholder="--"
            />
            
            <Button
              variant="secondary"
              size="sm"
              onClick={handleIncrement}
              disabled={disabled}
              keyboardShortcut="+"
            >
              +
            </Button>
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          {isFilled && !error && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">你录入的用量:</span>
              <span className={cn(
                'font-bold',
                isCorrect ? 'text-green-400' : 'text-red-400'
              )}>
                {playerUsage} ({isCorrect ? '正确' : '误差过大'})
              </span>
            </div>
          )}

          {isFilled && !error && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">你计算的费用:</span>
              <span className="font-bold text-accent-400">¥{playerCost.toFixed(0)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default MeterDisplay;
