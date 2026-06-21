import { NextResponse } from 'next/server';
import { mockHearings } from '@/data/mockData';
import { getFilteredHearings } from '@/services/hearingsService';
import type { FilterParams } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const filters: FilterParams = {};
  
  const dateRangeStart = searchParams.get('dateRangeStart');
  const dateRangeEnd = searchParams.get('dateRangeEnd');
  if (dateRangeStart && dateRangeEnd) {
    filters.dateRange = {
      start: new Date(dateRangeStart),
      end: new Date(dateRangeEnd),
    };
  }
  
  const caseTypes = searchParams.get('caseTypes');
  if (caseTypes) {
    filters.caseTypes = caseTypes.split(',');
  }
  
  const attendanceStatuses = searchParams.get('attendanceStatuses');
  if (attendanceStatuses) {
    filters.attendanceStatuses = attendanceStatuses.split(',') as any;
  }
  
  const hasConflicts = searchParams.get('hasConflicts');
  if (hasConflicts !== null) {
    filters.hasConflicts = hasConflicts === 'true';
  }
  
  const timeSlots = searchParams.get('timeSlots');
  if (timeSlots) {
    filters.timeSlots = timeSlots.split(',');
  }
  
  const reminderStatuses = searchParams.get('reminderStatuses');
  if (reminderStatuses) {
    filters.reminderStatuses = reminderStatuses.split(',') as any;
  }

  const filtered = getFilteredHearings(filters);

  return NextResponse.json({
    data: filtered,
    total: filtered.length,
    filters,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  return NextResponse.json({
    success: true,
    message: 'Hearing created successfully',
    data: body,
  });
}
