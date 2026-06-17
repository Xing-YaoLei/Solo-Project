import { useCallback, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useReplayStore } from '@/store/replayStore';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { calculateParkingFee } from '@/utils/time';
import { GAME_CONFIG } from '@/config/difficulty';
import { formatCurrency } from '@/utils/math';

export const useBilling = () => {
  const bills = useGameStore(state => state.bills);
  const spots = useGameStore(state => state.spots);
  const accessRecords = useGameStore(state => state.accessRecords);
  const phase = useGameStore(state => state.phase);
  const gameTime = useGameStore(state => state.gameTime);
  const payBill = useGameStore(state => state.payBill);
  
  const recordInteraction = useReplayStore(state => state.recordInteraction);
  const trackEvent = useAnalyticsStore(state => state.trackEvent);

  const unpaidBills = useMemo(() => 
    bills.filter(b => !b.isPaid),
    [bills]
  );

  const paidBills = useMemo(() => 
    bills.filter(b => b.isPaid),
    [bills]
  );

  const totalAmount = useMemo(() => 
    bills.reduce((sum, b) => sum + b.totalFee, 0),
    [bills]
  );

  const paidAmount = useMemo(() => 
    paidBills.reduce((sum, b) => sum + b.totalFee, 0),
    [paidBills]
  );

  const pendingAmount = useMemo(() => 
    unpaidBills.reduce((sum, b) => sum + b.totalFee, 0),
    [unpaidBills]
  );

  const getBillForSpot = useCallback((spotId: string) => {
    return bills.find(b => b.spotId === spotId && !b.isPaid);
  }, [bills]);

  const getCurrentFeeForSpot = useCallback((spotId: string) => {
    const spot = spots.find(s => s.id === spotId);
    if (!spot || !spot.entryTime || spot.status !== 'occupied') {
      return { baseFee: 0, discount: 0, totalFee: 0, durationMinutes: 0, appliedDiscount: 0 };
    }

    const record = accessRecords.find(r => r.assignedSpotId === spotId);
    const vehicleType = record?.vehicleType || 'car';
    const durationMinutes = (gameTime - spot.entryTime) / 60;

    const baseFee = calculateParkingFee(
      durationMinutes,
      GAME_CONFIG.baseParkingRate,
      vehicleType,
      GAME_CONFIG.discountThresholdMinutes,
      GAME_CONFIG.discountPercentage
    );

    const bill = bills.find(b => b.spotId === spotId && !b.isPaid);
    const appliedDiscount = bill?.appliedDiscount || 0;

    return {
      baseFee: baseFee.baseFee,
      discount: baseFee.discount,
      totalFee: Math.max(0, baseFee.totalFee - appliedDiscount),
      durationMinutes,
      appliedDiscount,
    };
  }, [spots, accessRecords, gameTime, bills]);

  const processPayment = useCallback((billId: string) => {
    if (phase !== 'billing' && phase !== 'settlement') return false;
    
    const bill = bills.find(b => b.id === billId);
    if (!bill || bill.isPaid) return false;

    payBill(billId);
    recordInteraction();
    trackEvent('task_complete', {
      task: 'pay_bill',
      billId,
      amount: bill.totalFee,
    });
    return true;
  }, [phase, bills, payBill, recordInteraction, trackEvent]);

  const getBillSummary = useCallback((billId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return null;

    const spot = spots.find(s => s.id === bill.spotId);
    const fee = getCurrentFeeForSpot(bill.spotId);
    const appliedDiscount = bill.appliedDiscount || 0;
    const baseFee = calculateParkingFee(
      fee.durationMinutes,
      GAME_CONFIG.baseParkingRate,
      (accessRecords.find(r => r.vehiclePlate === bill.vehiclePlate)?.vehicleType) || 'car',
      GAME_CONFIG.discountThresholdMinutes,
      GAME_CONFIG.discountPercentage
    );

    return {
      ...bill,
      spotNumber: spot?.number,
      currentFee: {
        ...fee,
        baseFee: baseFee.baseFee,
        discount: baseFee.discount + appliedDiscount,
        totalFee: fee.totalFee,
      },
      formattedTotal: formatCurrency(fee.totalFee),
      formattedBase: formatCurrency(baseFee.baseFee),
      formattedDiscount: formatCurrency(baseFee.discount + appliedDiscount),
      formattedAppliedDiscount: appliedDiscount > 0 ? formatCurrency(appliedDiscount) : null,
    };
  }, [bills, spots, getCurrentFeeForSpot, accessRecords]);

  const getSpotTurnover = useCallback(() => {
    const totalSpots = spots.length;
    const occupiedSpots = spots.filter(s => s.status === 'occupied').length;
    const turnoverCount = paidBills.length;
    return {
      totalSpots,
      occupiedSpots,
      turnoverCount,
      turnoverRate: totalSpots > 0 ? (turnoverCount / totalSpots) * 100 : 0,
    };
  }, [spots, paidBills]);

  return {
    bills,
    unpaidBills,
    paidBills,
    totalAmount,
    paidAmount,
    pendingAmount,
    phase,
    gameTime,
    getBillForSpot,
    getCurrentFeeForSpot,
    processPayment,
    getBillSummary,
    getSpotTurnover,
  };
};
