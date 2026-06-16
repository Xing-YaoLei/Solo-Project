import React, { useEffect, useMemo, useState } from 'react';
import { Table } from 'antd';
import type { TableProps, TablePaginationConfig } from 'antd';
import type { PagedResultDto } from '@/types';

interface FetchParams {
  pageIndex: number;
  pageSize: number;
}

interface PaginationTableProps<T> extends Omit<TableProps<T>, 'dataSource' | 'pagination'> {
  fetchData: (params: FetchParams) => Promise<PagedResultDto<T>>;
  refreshTrigger?: number;
  showSizeChanger?: boolean;
  pageSizeOptions?: string[];
}

function PaginationTableInner<T extends object>(
  props: PaginationTableProps<T>,
  ref: React.ForwardedRef<any>
): React.ReactElement {
  const {
    fetchData,
    refreshTrigger,
    showSizeChanger = true,
    pageSizeOptions = ['10', '20', '50', '100'],
    loading: loadingProp,
    ...tableProps
  } = props;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const loadData = async (): Promise<void> => {
    setLoading(true);
    try {
      const result = await fetchData({ pageIndex, pageSize });
      setData(result.items);
      setTotal(result.totalCount);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [pageIndex, pageSize, refreshTrigger]);

  const handleTableChange = (pagination: TablePaginationConfig): void => {
    if (pagination.current !== undefined && pagination.current !== pageIndex) {
      setPageIndex(pagination.current);
    }
    if (pagination.pageSize !== undefined && pagination.pageSize !== pageSize) {
      setPageSize(pagination.pageSize);
      setPageIndex(1);
    }
  };

  const paginationConfig = useMemo<TablePaginationConfig>(
    () => ({
      current: pageIndex,
      pageSize,
      total,
      showSizeChanger,
      pageSizeOptions,
      showQuickJumper: true,
      showTotal: (totalCount: number) => `共 ${totalCount} 条`,
    }),
    [pageIndex, pageSize, total, showSizeChanger, pageSizeOptions]
  );

  return (
    <Table<T>
      ref={ref}
      {...tableProps}
      dataSource={data}
      loading={loadingProp ?? loading}
      pagination={paginationConfig}
      onChange={handleTableChange}
      rowKey={(record) => (record as any).id ?? Math.random().toString()}
    />
  );
}

const PaginationTable = React.forwardRef(PaginationTableInner) as <T extends object>(
  props: PaginationTableProps<T> & { ref?: React.ForwardedRef<any> }
) => React.ReactElement;

export default PaginationTable;
