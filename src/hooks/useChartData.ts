import { useState, useEffect, useCallback } from 'react';
import { reportApi } from '@/api/endpoints/report';
import {
  generateReconciliationTrendData,
  generateContractAttachmentData,
  generateInvoiceDetailData,
  generateApprovalNodeExceptionData,
} from '@/utils/mockData';
import type {
  ReconciliationTrendItem,
  ContractAttachmentItem,
  InvoiceDetailItem,
  ApprovalNodeExceptionItem,
  FilterParams,
  ChartDataResponse,
} from '@/types';

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

const useChartData = () => {
  const [reconciliationTrend, setReconciliationTrend] = useState<
    ChartDataResponse<ReconciliationTrendItem[]>
  >({
    data: [],
    loading: false,
    error: null,
    refetch: () => {},
  });

  const [contractAttachment, setContractAttachment] = useState<
    ChartDataResponse<ContractAttachmentItem[]>
  >({
    data: [],
    loading: false,
    error: null,
    refetch: () => {},
  });

  const [invoiceDetails, setInvoiceDetails] = useState<
    ChartDataResponse<InvoiceDetailItem[]>
  >({
    data: [],
    loading: false,
    error: null,
    refetch: () => {},
  });

  const [approvalNodeExceptions, setApprovalNodeExceptions] = useState<
    ChartDataResponse<ApprovalNodeExceptionItem[]>
  >({
    data: [],
    loading: false,
    error: null,
    refetch: () => {},
  });

  const fetchReconciliationTrend = useCallback(async (params?: FilterParams) => {
    setReconciliationTrend((prev) => ({ ...prev, loading: true, error: null }));
    try {
      let data: ReconciliationTrendItem[];
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        data = generateReconciliationTrendData();
      } else {
        data = await reportApi.getReconciliationTrend(params);
      }
      setReconciliationTrend({
        data,
        loading: false,
        error: null,
        refetch: () => fetchReconciliationTrend(params),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
      setReconciliationTrend((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  const fetchContractAttachment = useCallback(async (params?: FilterParams) => {
    setContractAttachment((prev) => ({ ...prev, loading: true, error: null }));
    try {
      let data: ContractAttachmentItem[];
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        data = generateContractAttachmentData();
      } else {
        data = await reportApi.getContractAttachmentComposition(params);
      }
      setContractAttachment({
        data,
        loading: false,
        error: null,
        refetch: () => fetchContractAttachment(params),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
      setContractAttachment((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  const fetchInvoiceDetails = useCallback(async (params?: FilterParams) => {
    setInvoiceDetails((prev) => ({ ...prev, loading: true, error: null }));
    try {
      let data: InvoiceDetailItem[];
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        data = generateInvoiceDetailData();
      } else {
        data = await reportApi.getInvoiceDetails(params);
      }
      setInvoiceDetails({
        data,
        loading: false,
        error: null,
        refetch: () => fetchInvoiceDetails(params),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
      setInvoiceDetails((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  const fetchApprovalNodeExceptions = useCallback(async (params?: FilterParams) => {
    setApprovalNodeExceptions((prev) => ({ ...prev, loading: true, error: null }));
    try {
      let data: ApprovalNodeExceptionItem[];
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 700));
        data = generateApprovalNodeExceptionData();
      } else {
        data = await reportApi.getApprovalNodeExceptions(params);
      }
      setApprovalNodeExceptions({
        data,
        loading: false,
        error: null,
        refetch: () => fetchApprovalNodeExceptions(params),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
      setApprovalNodeExceptions((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  useEffect(() => {
    fetchReconciliationTrend();
    fetchContractAttachment();
    fetchInvoiceDetails();
    fetchApprovalNodeExceptions();
  }, [
    fetchReconciliationTrend,
    fetchContractAttachment,
    fetchInvoiceDetails,
    fetchApprovalNodeExceptions,
  ]);

  const refetchAll = useCallback(() => {
    fetchReconciliationTrend();
    fetchContractAttachment();
    fetchInvoiceDetails();
    fetchApprovalNodeExceptions();
  }, [
    fetchReconciliationTrend,
    fetchContractAttachment,
    fetchInvoiceDetails,
    fetchApprovalNodeExceptions,
  ]);

  const isAllLoading =
    reconciliationTrend.loading ||
    contractAttachment.loading ||
    invoiceDetails.loading ||
    approvalNodeExceptions.loading;

  const hasAnyError =
    reconciliationTrend.error ||
    contractAttachment.error ||
    invoiceDetails.error ||
    approvalNodeExceptions.error;

  return {
    reconciliationTrend,
    contractAttachment,
    invoiceDetails,
    approvalNodeExceptions,
    isAllLoading,
    hasAnyError,
    refetchAll,
    fetchReconciliationTrend,
    fetchContractAttachment,
    fetchInvoiceDetails,
    fetchApprovalNodeExceptions,
  };
};

export default useChartData;
