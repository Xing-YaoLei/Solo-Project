export type DateRange = {
  start: string;
  end: string;
};

export type FilterState = {
  dateRange: DateRange;
  area: string;
  repairType: string;
  driver: string;
};
