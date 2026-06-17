import { useState, useEffect, useCallback, useRef } from 'react';
import type { WorkOrder, WorkOrderResult, ActiveWorkOrder } from '../types';

interface UseWorkOrderOptions {
  orders: WorkOrder[];
  timeout: number;
  enabled: boolean;
  onTrigger: (order: WorkOrder, isRetrying: boolean) => void;
  onTimeout: (order: WorkOrder) => void;
  onComplete: (result: WorkOrderResult) => void;
}

export function useWorkOrder(options: UseWorkOrderOptions) {
  const { orders, timeout, enabled, onTrigger, onTimeout, onComplete } = options;
  
  const [activeOrders, setActiveOrders] = useState<ActiveWorkOrder[]>([]);
  const [completedOrders, setCompletedOrders] = useState<WorkOrderResult[]>([]);
  const [timeoutCount, setTimeoutCount] = useState(0);
  
  const gameStartTimeRef = useRef<number>(0);
  const triggeredOrdersRef = useRef<Set<string>>(new Set());
  const timersRef = useRef<Map<string, number>>(new Map());
  const onTriggerRef = useRef(onTrigger);
  const onTimeoutRef = useRef(onTimeout);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onTriggerRef.current = onTrigger;
    onTimeoutRef.current = onTimeout;
    onCompleteRef.current = onComplete;
  }, [onTrigger, onTimeout, onComplete]);

  const startGame = useCallback(() => {
    gameStartTimeRef.current = Date.now();
    triggeredOrdersRef.current.clear();
    setActiveOrders([]);
    setCompletedOrders([]);
    setTimeoutCount(0);
    timersRef.current.forEach((timerId) => clearTimeout(timerId));
    timersRef.current.clear();
  }, []);

  const triggerOrder = useCallback((order: WorkOrder, isRetrying = false) => {
    const startTime = Date.now();
    
    const activeOrder: ActiveWorkOrder = {
      ...order,
      startTime,
      remainingTime: timeout,
      isRetrying,
    };

    setActiveOrders((prev) => [...prev, activeOrder]);
    onTriggerRef.current(order, isRetrying);

    const timerId = window.setTimeout(() => {
      setActiveOrders((prev) => prev.filter((o) => o.id !== order.id));
      setTimeoutCount((prev) => prev + 1);
      onTimeoutRef.current(order);
      timersRef.current.delete(order.id);
    }, timeout * 1000);

    timersRef.current.set(order.id, timerId);
  }, [timeout]);

  const retryOrder = useCallback((orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      triggerOrder(order, true);
    }
  }, [orders, triggerOrder]);

  const resolveOrder = useCallback((orderId: string, optionId: string) => {
    const timerId = timersRef.current.get(orderId);
    if (timerId) {
      clearTimeout(timerId);
      timersRef.current.delete(orderId);
    }

    setActiveOrders((prev) => {
      const activeOrder = prev.find((o) => o.id === orderId);
      if (!activeOrder) return prev;

      const responseTime = Math.floor((Date.now() - activeOrder.startTime) / 1000);
      const isCorrect = optionId === activeOrder.correctOptionId;

      const result: WorkOrderResult = {
        orderId,
        optionId,
        responseTime,
        isCorrect,
        retried: activeOrder.isRetrying,
      };

      setCompletedOrders((completedPrev) => [...completedPrev, result]);
      onCompleteRef.current(result);

      return prev.filter((o) => o.id !== orderId);
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const checkInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);

      orders.forEach((order) => {
        if (
          !triggeredOrdersRef.current.has(order.id) &&
          elapsed >= order.triggerAt
        ) {
          triggeredOrdersRef.current.add(order.id);
          triggerOrder(order);
        }
      });
    }, 1000);

    return () => {
      clearInterval(checkInterval);
      timersRef.current.forEach((timerId) => clearTimeout(timerId));
      timersRef.current.clear();
    };
  }, [enabled, orders, triggerOrder]);

  useEffect(() => {
    const updateInterval = setInterval(() => {
      setActiveOrders((prev) =>
        prev.map((order) => ({
          ...order,
          remainingTime: Math.max(
            0,
            timeout - Math.floor((Date.now() - order.startTime) / 1000)
          ),
        }))
      );
    }, 1000);

    return () => clearInterval(updateInterval);
  }, [timeout]);

  return {
    activeOrders,
    completedOrders,
    timeoutCount,
    startGame,
    triggerOrder,
    retryOrder,
    resolveOrder,
  };
}

export default useWorkOrder;
