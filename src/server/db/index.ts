import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import {
  mockCareLevels,
  mockUsers,
  mockElders,
  mockAssessments,
  mockMedications,
  mockMedicationExecutions,
  mockVisitRecords,
  mockIncidents,
  mockIncidentParties,
  mockFlowAttachments,
  mockFlowRemarks,
  mockFlowHandlers,
  createMockDb,
  type MockDb
} from './seed';

export type Database = PostgresJsDatabase<typeof schema>;

export interface DbInstance {
  db: Database | MockDb;
  isMock: boolean;
}

let dbInstance: DbInstance | null = null;

const DEFAULT_HASHED_PASSWORD =
  '$2a$10$placeholder.please.configure.real.password.hashing';

function toDate(d: Date | string | null | undefined): Date | null {
  if (d === null || d === undefined) return null;
  return d instanceof Date ? d : new Date(d);
}

function toDateString(d: Date | string | null | undefined): string | undefined {
  if (d === null || d === undefined) return undefined;
  const date = d instanceof Date ? d : new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function seedDatabase(db: Database): Promise<void> {
  try {
    const existingCareLevels = await db.query.careLevels.findMany();
    if (existingCareLevels.length === 0) {
      await db.insert(schema.careLevels).values(
        mockCareLevels.map((cl) => ({
          id: cl.id,
          name: cl.name,
          scoreRange: cl.scoreRange as any,
          description: cl.description,
          careItems: (cl.careItems ?? []) as any,
          isActive: cl.isActive
        }))
      );
      console.log('[DB Seed] Inserted careLevels:', mockCareLevels.length);
    }

    const existingUsers = await db.query.users.findMany();
    if (existingUsers.length === 0) {
      await db.insert(schema.users).values(
        mockUsers.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          hashedPassword: DEFAULT_HASHED_PASSWORD,
          isActive: u.isActive,
          createdAt: toDate(u.createdAt) ?? new Date(),
          updatedAt: toDate(u.updatedAt) ?? new Date()
        }))
      );
      console.log('[DB Seed] Inserted users:', mockUsers.length);
    }

    const existingElders = await db.query.elders.findMany();
    if (existingElders.length === 0) {
      await db.insert(schema.elders).values(
        mockElders.map((e) => ({
          id: e.id,
          name: e.name,
          gender: e.gender,
          birthDate: toDateString(e.birthDate) ?? '',
          idCard: e.idCard ?? undefined,
          roomNumber: e.roomNumber ?? undefined,
          admissionDate: toDateString(e.admissionDate) ?? undefined,
          status: e.status ?? undefined,
          careLevelId: e.careLevelId ?? undefined,
          avatar: e.avatar ?? undefined,
          allergies: (e.allergies ?? []) as any,
          medicalHistory: (e.medicalHistory ?? []) as any,
          emergencyContact: (e.emergencyContact ?? {}) as any,
          createdAt: toDate(e.createdAt) ?? new Date(),
          updatedAt: toDate(e.updatedAt) ?? new Date()
        }))
      );
      console.log('[DB Seed] Inserted elders:', mockElders.length);
    }

    const existingAssessments = await db.query.assessments.findMany();
    if (existingAssessments.length === 0) {
      await db.insert(schema.assessments).values(
        mockAssessments.map((a) => ({
          id: a.id,
          elderId: a.elderId,
          status: a.status ?? undefined,
          adlScore: a.adlScore ?? 0,
          cognitionScore: a.cognitionScore ?? 0,
          emotionScore: a.emotionScore ?? 0,
          socialScore: a.socialScore ?? 0,
          totalScore: a.totalScore ?? 0,
          suggestedLevelId: a.suggestedLevelId ?? undefined,
          finalLevelId: a.finalLevelId ?? undefined,
          currentStep: a.currentStep ?? 0,
          createdAt: toDate(a.createdAt) ?? new Date(),
          updatedAt: toDate(a.updatedAt) ?? new Date()
        }))
      );
      console.log('[DB Seed] Inserted assessments:', mockAssessments.length);
    }

    const existingMedications = await db.query.medications.findMany();
    if (existingMedications.length === 0) {
      await db.insert(schema.medications).values(
        mockMedications.map((m) => ({
          id: m.id,
          elderId: m.elderId,
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          route: m.route,
          startDate: toDateString(m.startDate) ?? '',
          endDate: toDateString(m.endDate) ?? undefined,
          prescribedBy: m.prescribedBy ?? undefined,
          notes: m.notes ?? undefined,
          isActive: m.isActive ?? true
        }))
      );
      console.log('[DB Seed] Inserted medications:', mockMedications.length);
    }

    const existingExecutions = await db.query.medicationExecutions.findMany();
    if (existingExecutions.length === 0) {
      await db.insert(schema.medicationExecutions).values(
        mockMedicationExecutions.map((e) => ({
          id: e.id,
          medicationId: e.medicationId,
          executedAt: toDate(e.executedAt) ?? new Date(),
          executedBy: e.executedBy,
          signature: e.signature ?? undefined,
          isAbnormal: e.isAbnormal ?? false,
          abnormalNote: e.abnormalNote ?? undefined
        }))
      );
      console.log('[DB Seed] Inserted medicationExecutions:', mockMedicationExecutions.length);
    }

    const existingVisits = await db.query.visitRecords.findMany();
    if (existingVisits.length === 0) {
      await db.insert(schema.visitRecords).values(
        mockVisitRecords.map((v) => ({
          id: v.id,
          elderId: v.elderId,
          visitorName: v.visitorName,
          relation: v.relation ?? undefined,
          visitorPhone: v.visitorPhone ?? undefined,
          visitTime: toDate(v.visitTime) ?? new Date(),
          leaveTime: toDate(v.leaveTime) ?? undefined,
          notes: v.notes ?? undefined,
          recordedBy: v.recordedBy ?? undefined
        }))
      );
      console.log('[DB Seed] Inserted visitRecords:', mockVisitRecords.length);
    }

    const existingIncidents = await db.query.incidents.findMany();
    if (existingIncidents.length === 0) {
      await db.insert(schema.incidents).values(
        mockIncidents.map((i) => ({
          id: i.id,
          elderId: i.elderId,
          type: i.type ?? undefined,
          status: i.status ?? undefined,
          reportedAt: toDate(i.reportedAt) ?? new Date(),
          reportedBy: i.reportedBy ?? undefined,
          location: i.location ?? undefined,
          description: i.description ?? undefined,
          closedAt: toDate(i.closedAt) ?? undefined,
          summary: i.summary ?? undefined,
          correctiveActions: (i.correctiveActions ?? []) as any
        }))
      );
      console.log('[DB Seed] Inserted incidents:', mockIncidents.length);
    }

    const existingParties = await db.query.incidentParties.findMany();
    if (existingParties.length === 0) {
      await db.insert(schema.incidentParties).values(
        mockIncidentParties.map((p) => ({
          id: p.id,
          incidentId: p.incidentId,
          roleType: p.roleType,
          userId: p.userId ?? undefined,
          personName: p.personName,
          description: p.description ?? undefined,
          supplementAt: toDate(p.supplementAt) ?? undefined,
          isResponsible: p.isResponsible ?? undefined,
          responsibilityType: p.responsibilityType ?? undefined
        }))
      );
      console.log('[DB Seed] Inserted incidentParties:', mockIncidentParties.length);
    }

    const existingAttachments = await db.query.flowAttachments.findMany();
    if (existingAttachments.length === 0) {
      await db.insert(schema.flowAttachments).values(
        mockFlowAttachments.map((a) => ({
          id: a.id,
          entityType: a.entityType,
          entityId: a.entityId,
          fileName: a.fileName,
          fileUrl: a.fileUrl,
          fileSize: a.fileSize ?? undefined,
          mimeType: a.mimeType ?? undefined,
          uploadedBy: a.uploadedBy ?? undefined,
          uploadedAt: toDate(a.uploadedAt) ?? new Date()
        }))
      );
      console.log('[DB Seed] Inserted flowAttachments:', mockFlowAttachments.length);
    }

    const existingRemarks = await db.query.flowRemarks.findMany();
    if (existingRemarks.length === 0) {
      await db.insert(schema.flowRemarks).values(
        mockFlowRemarks.map((r) => ({
          id: r.id,
          entityType: r.entityType,
          entityId: r.entityId,
          content: r.content,
          createdBy: r.createdBy ?? undefined,
          createdAt: toDate(r.createdAt) ?? new Date()
        }))
      );
      console.log('[DB Seed] Inserted flowRemarks:', mockFlowRemarks.length);
    }

    const existingHandlers = await db.query.flowHandlers.findMany();
    if (existingHandlers.length === 0) {
      await db.insert(schema.flowHandlers).values(
        mockFlowHandlers.map((h) => ({
          id: h.id,
          entityType: h.entityType,
          entityId: h.entityId,
          stepName: h.stepName,
          userId: h.userId ?? undefined,
          userName: h.userName,
          handledAt: toDate(h.handledAt) ?? undefined,
          action: h.action ?? undefined
        }))
      );
      console.log('[DB Seed] Inserted flowHandlers:', mockFlowHandlers.length);
    }

    console.log('[DB Seed] Database seed completed');
  } catch (e) {
    console.error('[DB Seed] Failed to seed database:', e instanceof Error ? e.message : e);
  }
}

async function createPostgresConnection(): Promise<Database | null> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.warn('[DB] DATABASE_URL not set, using mock mode');
    return null;
  }

  try {
    const client = postgres(databaseUrl, {
      max: 1,
      idle_timeout: 5,
      connect_timeout: 5
    });

    await client`SELECT 1`;

    const db = drizzle(client, { schema });
    console.log('[DB] PostgreSQL connection established');

    try {
      const _ = schema;
      await client`SELECT 1`;
    } catch (_) {
      // no-op, will attempt to create tables later
    }

    await seedDatabase(db);
    return db;
  } catch (error) {
    console.warn('[DB] Failed to connect to PostgreSQL, falling back to mock mode:', error instanceof Error ? error.message : error);
    return null;
  }
}

export async function getDb(): Promise<DbInstance> {
  if (dbInstance) {
    return dbInstance;
  }

  const postgresDb = await createPostgresConnection();

  if (postgresDb) {
    dbInstance = {
      db: postgresDb,
      isMock: false
    };
  } else {
    const mockDb = createMockDb();
    dbInstance = {
      db: mockDb,
      isMock: true
    };
    console.log('[DB] Running in mock mode with in-memory data');
  }

  return dbInstance;
}

export function resetDb(): void {
  dbInstance = null;
}

export type { MockDb } from './seed';
