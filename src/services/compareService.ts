import type { CompareResponse, Discrepancy, Hearing } from '@/types';
import { mockHearings, mockDataVersions } from '@/data/mockData';

function seededRandom(seed: number): () => number {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const random = seededRandom(12345);

function modifyHearingForSource(
  hearing: Hearing,
  source: 'CASE_SYSTEM' | 'CALENDAR_TOOL' | 'EMAIL_ATTACHMENT'
): Hearing {
  const modified = { ...hearing };
  const r = random();

  if (source === 'CALENDAR_TOOL' && r < 0.1) {
    modified.hearingTime = '10:00';
  }
  if (source === 'EMAIL_ATTACHMENT' && r < 0.15) {
    modified.court = '北京市朝阳区人民法院（临时法庭）';
  }
  if (source === 'CASE_SYSTEM' && r < 0.05) {
    modified.judge = '张伟法官（代）';
  }
  if (source === 'EMAIL_ATTACHMENT' && r < 0.08) {
    modified.attendanceStatus = 'POSTPONED';
  }

  return modified;
}

export function getCompareData(): CompareResponse {
  const caseSystemData = mockHearings;
  const calendarToolData = mockHearings.map((h) => modifyHearingForSource(h, 'CALENDAR_TOOL'));
  const emailAttachmentData = mockHearings.map((h) => modifyHearingForSource(h, 'EMAIL_ATTACHMENT'));

  const discrepancies: Discrepancy[] = [];
  const fieldsToCompare = ['hearingDate', 'hearingTime', 'court', 'judge', 'attendanceStatus'];

  mockHearings.forEach((hearing) => {
    const calendarHearing = calendarToolData.find((h) => h.id === hearing.id);
    const emailHearing = emailAttachmentData.find((h) => h.id === hearing.id);

    if (!calendarHearing || !emailHearing) return;

    fieldsToCompare.forEach((field) => {
      const caseValue = hearing[field as keyof Hearing];
      const calendarValue = calendarHearing[field as keyof Hearing];
      const emailValue = emailHearing[field as keyof Hearing];

      if (
        JSON.stringify(caseValue) !== JSON.stringify(calendarValue) ||
        JSON.stringify(caseValue) !== JSON.stringify(emailValue) ||
        JSON.stringify(calendarValue) !== JSON.stringify(emailValue)
      ) {
        discrepancies.push({
          hearingId: hearing.id,
          field,
          caseSystemValue: caseValue,
          calendarToolValue: calendarValue,
          emailAttachmentValue: emailValue,
        });
      }
    });
  });

  return {
    caseSystemData,
    calendarToolData,
    emailAttachmentData,
    discrepancies,
  };
}

export function getDataVersions() {
  return mockDataVersions;
}

export function getVersionComparison(version1: string, version2: string) {
  const v1 = mockDataVersions.find((v) => v.version === version1);
  const v2 = mockDataVersions.find((v) => v.version === version2);

  return { v1, v2, differences: [] };
}
