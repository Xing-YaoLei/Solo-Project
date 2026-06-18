import dayjs from 'dayjs';
import type { SyncDelayInfo } from '@shared/types';
import type { ComposeOption } from 'echarts/core';

export function buildDelayMarkOptions(delays: SyncDelayInfo[], allDates?: string[]) {
  const delayed = delays.filter((d) => d.isDelayed);
  if (delayed.length === 0) return { markArea: undefined, markLine: undefined };

  const dateList = allDates ?? [];
  function indexOf(dateStr: string): number {
    if (dateList.length === 0) return 0;
    const target = dayjs(dateStr).valueOf();
    let closest = 0;
    let minDiff = Infinity;
    dateList.forEach((d, i) => {
      const diff = Math.abs(dayjs(d).valueOf() - target);
      if (diff < minDiff) {
        minDiff = diff;
        closest = i;
      }
    });
    return closest;
  }

  const markArea = {
    silent: true,
    itemStyle: {
      color: 'rgba(239, 68, 68, 0.08)',
      borderColor: 'rgba(239, 68, 68, 0.25)',
      borderWidth: 1,
      borderType: 'dashed' as const,
    },
    data: delayed.map((d) => [
      {
        name: `数据延迟 ${d.delayHours.toFixed(0)}h`,
        xAxis: dateList.length ? indexOf(d.affectedFrom) : d.affectedFrom,
        itemStyle: { color: 'rgba(239, 68, 68, 0.08)' },
      },
      {
        xAxis: dateList.length ? indexOf(d.affectedTo) : d.affectedTo,
      },
    ]),
  };

  const markLine = {
    silent: true,
    symbol: 'none',
    lineStyle: {
      color: 'rgba(239, 68, 68, 0.5)',
      type: 'dashed',
      width: 1,
    },
    label: {
      position: 'insideEndTop' as const,
      formatter: (params: { name: string }) => params.name,
      color: '#F87171',
      fontSize: 10,
      backgroundColor: 'rgba(239,68,68,0.08)',
      padding: [2, 5],
      borderRadius: 4,
    },
    data: delayed.flatMap((d) => [
      {
        name: `⚠ 数据延迟 ${d.delayHours.toFixed(0)}h`,
        xAxis: dateList.length ? indexOf(d.affectedFrom) : d.affectedFrom,
      },
      {
        xAxis: dateList.length ? indexOf(d.affectedTo) : d.affectedTo,
      },
    ]),
  };

  return { markArea, markLine } as {
    markArea: ComposeOption<any>['markArea'];
    markLine: ComposeOption<any>['markLine'];
  };
}
