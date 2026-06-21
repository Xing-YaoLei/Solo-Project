import { PrismaClient, Prisma } from '@prisma/client';
import { mockCases, mockHearings, mockConflicts, mockSatisfactions, mockReminders, mockDataVersions } from '@/data/mockData';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  for (const caseData of mockCases) {
    await prisma.case.upsert({
      where: { id: caseData.id },
      update: {},
      create: {
        id: caseData.id,
        caseNumber: caseData.caseNumber,
        caseName: caseData.caseName,
        caseType: caseData.caseType,
        clientId: caseData.clientId,
        clientName: caseData.clientName,
        createdAt: caseData.createdAt,
      },
    });
  }

  for (const conflict of mockConflicts) {
    await prisma.conflict.upsert({
      where: { id: conflict.id },
      update: {},
      create: {
        id: conflict.id,
        caseId: conflict.caseId,
        hearingId: conflict.hearingId,
        conflictType: conflict.conflictType,
        description: conflict.description,
        status: conflict.status,
        dataGapStart: conflict.dataGapStart,
        dataGapEnd: conflict.dataGapEnd,
        resolvedAt: conflict.resolvedAt,
        createdAt: conflict.createdAt,
      },
    });
  }

  for (const hearing of mockHearings) {
    await prisma.hearing.upsert({
      where: { id: hearing.id },
      update: {},
      create: {
        id: hearing.id,
        caseId: hearing.caseId,
        hearingDate: hearing.hearingDate,
        hearingTime: hearing.hearingTime,
        court: hearing.court,
        judge: hearing.judge,
        attendanceStatus: hearing.attendanceStatus,
        caseSystemVersion: hearing.caseSystemVersion,
        calendarToolVersion: hearing.calendarToolVersion,
        emailAttachmentVersion: hearing.emailAttachmentVersion,
        hasConflict: hearing.hasConflict,
        conflictId: hearing.conflictId,
        capacityRule: hearing.capacityRule,
        anomalyExplanation: hearing.anomalyExplanation,
        createdAt: hearing.createdAt,
        updatedAt: hearing.updatedAt,
      },
    });
  }

  for (const satisfaction of mockSatisfactions) {
    await prisma.satisfaction.upsert({
      where: { id: satisfaction.id },
      update: {},
      create: {
        id: satisfaction.id,
        caseId: satisfaction.caseId,
        clientId: satisfaction.clientId,
        clientName: satisfaction.clientName,
        rating: satisfaction.rating,
        feedback: satisfaction.feedback,
        surveyDate: satisfaction.surveyDate,
        improvementMeasures: satisfaction.improvementMeasures,
        followUpRating: satisfaction.followUpRating,
        followUpDate: satisfaction.followUpDate,
      },
    });
  }

  for (const reminder of mockReminders) {
    await prisma.reminder.upsert({
      where: { id: reminder.id },
      update: {},
      create: {
        id: reminder.id,
        hearingId: reminder.hearingId,
        recipient: reminder.recipient,
        recipientType: reminder.recipientType,
        reminderType: reminder.reminderType,
        sentAt: reminder.sentAt,
        status: reminder.status,
      },
    });
  }

  for (const version of mockDataVersions) {
    await prisma.dataVersion.upsert({
      where: { id: version.id },
      update: {},
      create: {
        id: version.id,
        source: version.source,
        version: version.version,
        snapshotData: version.snapshotData as Prisma.InputJsonValue,
        importDate: version.importDate,
        importedBy: version.importedBy,
      },
    });
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
