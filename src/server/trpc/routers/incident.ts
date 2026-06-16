import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, createRoleMiddleware } from '../trpc';
import type {
  Incident,
  IncidentParty,
  PaginatedResult,
  PartyRoleType
} from '../../../shared/types';
import {
  mockIncidents,
  mockIncidentParties,
  mockElders,
  mockUsers,
  generateId
} from '../mockData';
import { getDb, type Database } from '../../db';
import * as schema from '../../db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';

function toDate(date: Date | string | null | undefined): Date | null {
  if (date === null || date === undefined) return null;
  return date instanceof Date ? date : new Date(date);
}

function deepCloneWithDates<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (Array.isArray(obj)) return obj.map(deepCloneWithDates) as unknown as T;
  if (typeof obj === 'object') {
    const cloned = {} as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      cloned[key] = deepCloneWithDates((obj as Record<string, unknown>)[key]);
    }
    return cloned as T;
  }
  return obj;
}

let incidentsData: Incident[] = deepCloneWithDates(mockIncidents);
let partiesData: IncidentParty[] = deepCloneWithDates(mockIncidentParties);

function getPartiesByIncidentMock(incidentId: string): IncidentParty[] {
  return partiesData.filter((p) => p.incidentId === incidentId);
}

function hydrateIncidentMock(incident: Incident): Incident {
  const elder = mockElders.find((e) => e.id === incident.elderId);
  const parties = getPartiesByIncidentMock(incident.id);
  return {
    ...incident,
    elder,
    parties: parties.length > 0 ? parties : incident.parties ?? []
  };
}

function dbIncidentToType(
  db: any,
  parties: any[],
  elder: any
): Incident {
  return {
    id: db.id,
    elderId: db.elderId,
    type: db.type as any,
    status: db.status as any,
    reportedAt: toDate(db.reportedAt) ?? new Date(),
    reportedBy: db.reportedBy ?? null,
    location: db.location ?? null,
    description: db.description ?? null,
    closedAt: toDate(db.closedAt),
    summary: db.summary ?? null,
    correctiveActions: (db.correctiveActions ?? []) as string[],
    elder: elder ?? undefined,
    parties: parties.map(p => ({
      id: p.id,
      incidentId: p.incidentId,
      roleType: p.roleType as any,
      userId: p.userId ?? null,
      personName: p.personName,
      description: p.description ?? null,
      supplementAt: toDate(p.supplementAt),
      isResponsible: p.isResponsible === undefined || p.isResponsible === null ? null : p.isResponsible,
      responsibilityType: p.responsibilityType ?? null
    })) as IncidentParty[]
  };
}

const staffRole = createRoleMiddleware('admin', 'supervisor', 'nurse', 'doctor');
const supervisorOrAdmin = createRoleMiddleware('supervisor', 'admin');

export const incidentRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(['reported', 'supplementing', 'confirming', 'closed']).optional(),
        type: z.enum(['fall', 'other']).optional(),
        elderId: z.string().min(1).optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10)
      })
    )
    .query(async ({ input }): Promise<PaginatedResult<Incident>> => {
      const dbInstance = await getDb();

      if (!dbInstance.isMock) {
        const db = dbInstance.db as Database;

        let where: any[] = [];
        if (input.status) where.push(eq(schema.incidents.status, input.status as any));
        if (input.type) where.push(eq(schema.incidents.type, input.type as any));
        if (input.elderId) where.push(eq(schema.incidents.elderId, input.elderId));

        const dbIncidents = await db.query.incidents.findMany({
          where: where.length ? and(...where) : undefined,
          orderBy: [desc(schema.incidents.reportedAt)]
        });

        const total = dbIncidents.length;
        const start = (input.page - 1) * input.pageSize;
        const pageIncidents = dbIncidents.slice(start, start + input.pageSize);

        const items: Incident[] = [];
        for (const dbInc of pageIncidents) {
          const dbParties = await db.query.incidentParties.findMany({
            where: eq(schema.incidentParties.incidentId, dbInc.id)
          });
          const dbElder = await db.query.elders.findFirst({
            where: eq(schema.elders.id, dbInc.elderId)
          });
          items.push(dbIncidentToType(dbInc, dbParties, dbElder));
        }

        return { items, total, page: input.page, pageSize: input.pageSize };
      }

      let filtered = [...incidentsData];

      if (input.status) {
        filtered = filtered.filter((i) => i.status === input.status);
      }
      if (input.type) {
        filtered = filtered.filter((i) => i.type === input.type);
      }
      if (input.elderId) {
        filtered = filtered.filter((i) => i.elderId === input.elderId);
      }

      filtered.sort((a, b) => (toDate(b.reportedAt)?.getTime() ?? 0) - (toDate(a.reportedAt)?.getTime() ?? 0));

      const total = filtered.length;
      const start = (input.page - 1) * input.pageSize;
      const items = filtered.slice(start, start + input.pageSize).map(hydrateIncidentMock);

      return { items, total, page: input.page, pageSize: input.pageSize };
    }),

  getById: protectedProcedure
    .input(z.string().min(1))
    .query(async ({ input }): Promise<Incident> => {
      const dbInstance = await getDb();

      if (!dbInstance.isMock) {
        const db = dbInstance.db as Database;
        const dbInc = await db.query.incidents.findFirst({
          where: eq(schema.incidents.id, input)
        });
        if (!dbInc) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '事件不存在' });
        }
        const dbParties = await db.query.incidentParties.findMany({
          where: eq(schema.incidentParties.incidentId, input),
          orderBy: [asc(schema.incidentParties.roleType)]
        });
        const dbElder = await db.query.elders.findFirst({
          where: eq(schema.elders.id, dbInc.elderId)
        });
        return dbIncidentToType(dbInc, dbParties, dbElder);
      }

      const incident = incidentsData.find((i) => i.id === input);
      if (!incident) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '事件不存在' });
      }
      return hydrateIncidentMock(incident);
    }),

  report: protectedProcedure
    .use(staffRole)
    .input(
      z.object({
        elderId: z.string().min(1),
        type: z.enum(['fall', 'other']).default('fall'),
        location: z.string().max(200).optional(),
        description: z.string().optional()
      })
    )
    .mutation(async ({ input, ctx }): Promise<Incident> => {
      const dbInstance = await getDb();
      const now = new Date();
      const incidentId = generateId();

      const parties: IncidentParty[] = [];

      if (!dbInstance.isMock) {
        const db = dbInstance.db as Database;

        const dbElder = await db.query.elders.findFirst({
          where: eq(schema.elders.id, input.elderId)
        });
        if (!dbElder) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '老人不存在' });
        }

        parties.push({
          id: generateId(),
          incidentId,
          roleType: 'elder',
          userId: null,
          personName: dbElder.name,
          description: null,
          supplementAt: null,
          isResponsible: null,
          responsibilityType: null
        });

        const dbNurse = await db.query.users.findFirst({
          where: eq(schema.users.role, 'nurse')
        });
        if (dbNurse) {
          parties.push({
            id: generateId(),
            incidentId,
            roleType: 'nurse',
            userId: dbNurse.id,
            personName: dbNurse.name,
            description: null,
            supplementAt: null,
            isResponsible: null,
            responsibilityType: null
          });
        }

        const dbSupervisor = await db.query.users.findFirst({
          where: eq(schema.users.role, 'supervisor')
        });
        if (dbSupervisor) {
          parties.push({
            id: generateId(),
            incidentId,
            roleType: 'supervisor',
            userId: dbSupervisor.id,
            personName: dbSupervisor.name,
            description: null,
            supplementAt: null,
            isResponsible: null,
            responsibilityType: null
          });
        }

        await db.transaction(async (tx) => {
          await tx.insert(schema.incidents).values({
            id: incidentId,
            elderId: input.elderId,
            type: input.type as any,
            status: 'supplementing' as any,
            reportedAt: now,
            reportedBy: ctx.user?.name,
            location: input.location ?? '',
            description: input.description ?? '',
            correctiveActions: [] as any
          });
          for (const p of parties) {
            await tx.insert(schema.incidentParties).values({
              id: p.id,
              incidentId,
              roleType: p.roleType as any,
              userId: p.userId ?? undefined,
              personName: p.personName,
              isResponsible: undefined,
              responsibilityType: undefined
            });
          }

          if (ctx.user) {
            const reportHandlerId = `handler-report-${incidentId}`;
            await tx.insert(schema.flowHandlers).values({
              id: reportHandlerId,
              entityType: 'incident' as any,
              entityId: incidentId,
              stepName: '事件上报',
              userId: ctx.user.id,
              userName: ctx.user.name,
              handledAt: now,
              action: 'report'
            }).onConflictDoNothing();
          }
        });

        const refreshed = await db.query.incidents.findFirst({ where: eq(schema.incidents.id, incidentId) });
        const refreshedParties = await db.query.incidentParties.findMany({ where: eq(schema.incidentParties.incidentId, incidentId) });
        if (!refreshed) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '创建失败' });
        return dbIncidentToType(refreshed, refreshedParties, dbElder);
      }

      const elder = mockElders.find((e) => e.id === input.elderId);
      if (!elder) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '老人不存在' });
      }

      parties.push({
        id: generateId(),
        incidentId,
        roleType: 'elder',
        userId: null,
        personName: elder.name,
        description: null,
        supplementAt: null,
        isResponsible: null,
        responsibilityType: null
      });

      const nurse = mockUsers.find((u) => u.role === 'nurse');
      if (nurse) {
        parties.push({
          id: generateId(),
          incidentId,
          roleType: 'nurse',
          userId: nurse.id,
          personName: nurse.name,
          description: null,
          supplementAt: null,
          isResponsible: null,
          responsibilityType: null
        });
      }

      const supervisor = mockUsers.find((u) => u.role === 'supervisor');
      if (supervisor) {
        parties.push({
          id: generateId(),
          incidentId,
          roleType: 'supervisor',
          userId: supervisor.id,
          personName: supervisor.name,
          description: null,
          supplementAt: null,
          isResponsible: null,
          responsibilityType: null
        });
      }

      const newIncident: Incident = {
        id: incidentId,
        elderId: input.elderId,
        type: input.type,
        status: 'supplementing',
        reportedAt: now,
        reportedBy: ctx.user?.name,
        location: input.location ?? '',
        description: input.description ?? '',
        closedAt: null,
        summary: null,
        correctiveActions: [],
        elder,
        parties: []
      };
      incidentsData.unshift(newIncident);
      for (const p of parties) {
        partiesData.push(p);
      }
      return hydrateIncidentMock(newIncident);
    }),

  supplementParty: protectedProcedure
    .use(staffRole)
    .input(
      z.object({
        partyId: z.string().min(1),
        description: z.string().min(1, '补充说明不能为空')
      })
    )
    .mutation(async ({ input }): Promise<IncidentParty> => {
      const dbInstance = await getDb();
      const now = new Date();

      if (!dbInstance.isMock) {
        const db = dbInstance.db as Database;
        const existing = await db.query.incidentParties.findFirst({
          where: eq(schema.incidentParties.id, input.partyId)
        });
        if (!existing) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '影响对象不存在' });
        }
        await db.update(schema.incidentParties)
          .set({ description: input.description, supplementAt: now })
          .where(eq(schema.incidentParties.id, input.partyId));
        const refreshed = await db.query.incidentParties.findFirst({
          where: eq(schema.incidentParties.id, input.partyId)
        });
        if (!refreshed) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        return {
          id: refreshed.id,
          incidentId: refreshed.incidentId,
          roleType: refreshed.roleType as any,
          userId: refreshed.userId ?? null,
          personName: refreshed.personName,
          description: refreshed.description ?? null,
          supplementAt: toDate(refreshed.supplementAt),
          isResponsible: refreshed.isResponsible === undefined || refreshed.isResponsible === null ? null : refreshed.isResponsible,
          responsibilityType: refreshed.responsibilityType ?? null
        };
      }

      const partyIndex = partiesData.findIndex((p) => p.id === input.partyId);
      if (partyIndex === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '影响对象不存在' });
      }
      partiesData[partyIndex] = {
        ...partiesData[partyIndex],
        description: input.description,
        supplementAt: now
      };
      return partiesData[partyIndex];
    }),

  addWitness: protectedProcedure
    .use(staffRole)
    .input(
      z.object({
        incidentId: z.string().min(1),
        personName: z.string().min(1, '姓名不能为空').max(100),
        roleType: z.enum(['elder', 'nurse', 'supervisor', 'witness', 'doctor']).default('witness'),
        userId: z.string().min(1).optional()
      })
    )
    .mutation(async ({ input }): Promise<Incident> => {
      const dbInstance = await getDb();

      if (!dbInstance.isMock) {
        const db = dbInstance.db as Database;
        const incident = await db.query.incidents.findFirst({
          where: eq(schema.incidents.id, input.incidentId)
        });
        if (!incident) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '事件不存在' });
        }
        const partyId = generateId();
        await db.insert(schema.incidentParties).values({
          id: partyId,
          incidentId: input.incidentId,
          roleType: input.roleType as any,
          userId: input.userId,
          personName: input.personName
        });
        const dbParties = await db.query.incidentParties.findMany({
          where: eq(schema.incidentParties.incidentId, input.incidentId)
        });
        const dbElder = await db.query.elders.findFirst({
          where: eq(schema.elders.id, incident.elderId)
        });
        return dbIncidentToType(incident, dbParties, dbElder);
      }

      const index = incidentsData.findIndex((i) => i.id === input.incidentId);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '事件不存在' });
      }

      const newParty: IncidentParty = {
        id: generateId(),
        incidentId: input.incidentId,
        roleType: input.roleType as PartyRoleType,
        userId: input.userId ?? null,
        personName: input.personName,
        description: null,
        supplementAt: null,
        isResponsible: null,
        responsibilityType: null
      };

      partiesData.push(newParty);
      return hydrateIncidentMock(incidentsData[index]);
    }),

  confirmResponsibility: protectedProcedure
    .use(supervisorOrAdmin)
    .input(
      z.object({
        incidentId: z.string().min(1),
        responsibilities: z.array(
          z.object({
            partyId: z.string().min(1),
            isResponsible: z.boolean(),
            responsibilityType: z.enum(['direct', 'indirect']).optional()
          })
        )
      })
    )
    .mutation(async ({ input }): Promise<Incident> => {
      const dbInstance = await getDb();

      if (!dbInstance.isMock) {
        const db = dbInstance.db as Database;
        const incident = await db.query.incidents.findFirst({
          where: eq(schema.incidents.id, input.incidentId)
        });
        if (!incident) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '事件不存在' });
        }

        await db.transaction(async (tx) => {
          for (const resp of input.responsibilities) {
            await tx.update(schema.incidentParties)
              .set({
                isResponsible: resp.isResponsible,
                responsibilityType: resp.isResponsible
                  ? (resp.responsibilityType ?? 'indirect') as any
                  : null
              })
              .where(eq(schema.incidentParties.id, resp.partyId));
          }
          await tx.update(schema.incidents)
            .set({ status: 'confirming' as any })
            .where(eq(schema.incidents.id, input.incidentId));
        });

        const dbParties = await db.query.incidentParties.findMany({
          where: eq(schema.incidentParties.incidentId, input.incidentId)
        });
        const dbElder = await db.query.elders.findFirst({
          where: eq(schema.elders.id, incident.elderId)
        });
        const refreshedIncident = await db.query.incidents.findFirst({
          where: eq(schema.incidents.id, input.incidentId)
        });
        if (!refreshedIncident) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        return dbIncidentToType(refreshedIncident, dbParties, dbElder);
      }

      const index = incidentsData.findIndex((i) => i.id === input.incidentId);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '事件不存在' });
      }

      for (const resp of input.responsibilities) {
        const partyIndex = partiesData.findIndex((p) => p.id === resp.partyId);
        if (partyIndex !== -1) {
          partiesData[partyIndex] = {
            ...partiesData[partyIndex],
            isResponsible: resp.isResponsible,
            responsibilityType: resp.isResponsible ? (resp.responsibilityType ?? 'indirect') : null
          };
        }
      }

      incidentsData[index] = {
        ...incidentsData[index],
        status: 'confirming'
      };
      return hydrateIncidentMock(incidentsData[index]);
    }),

  close: protectedProcedure
    .use(supervisorOrAdmin)
    .input(
      z.object({
        incidentId: z.string().min(1),
        summary: z.string().min(1, '事件总结不能为空'),
        correctiveActions: z.array(z.string()).default([])
      })
    )
    .mutation(async ({ input, ctx }): Promise<Incident> => {
      const dbInstance = await getDb();
      const now = new Date();

      if (!dbInstance.isMock) {
        const db = dbInstance.db as Database;
        const incident = await db.query.incidents.findFirst({
          where: eq(schema.incidents.id, input.incidentId)
        });
        if (!incident) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '事件不存在' });
        }

        await db.transaction(async (tx) => {
          await tx.update(schema.incidents)
            .set({
              status: 'closed' as any,
              closedAt: now,
              summary: input.summary,
              correctiveActions: input.correctiveActions as any
            })
            .where(eq(schema.incidents.id, input.incidentId));

          const handlerUserName = ctx.user?.name ?? '系统';
          const handlerUserId = ctx.user?.id;
          const handlerCloseId = `handler-close-${input.incidentId}`;
          const existingHandler = await tx.query.flowHandlers.findFirst({
            where: eq(schema.flowHandlers.id, handlerCloseId)
          });
          if (!existingHandler) {
            await tx.insert(schema.flowHandlers).values({
              id: handlerCloseId,
              entityType: 'incident' as any,
              entityId: input.incidentId,
              stepName: '关闭归档',
              userId: handlerUserId,
              userName: handlerUserName,
              handledAt: now,
              action: 'close'
            });
          }
        });

        const dbParties = await db.query.incidentParties.findMany({
          where: eq(schema.incidentParties.incidentId, input.incidentId)
        });
        const dbElder = await db.query.elders.findFirst({
          where: eq(schema.elders.id, incident.elderId)
        });
        const closedIncident = await db.query.incidents.findFirst({
          where: eq(schema.incidents.id, input.incidentId)
        });
        if (!closedIncident) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        console.log(`[Incident] Event ${input.incidentId} closed and persisted to PostgreSQL`);
        return dbIncidentToType(closedIncident, dbParties, dbElder);
      }

      const index = incidentsData.findIndex((i) => i.id === input.incidentId);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '事件不存在' });
      }

      const closedIncident: Incident = {
        ...incidentsData[index],
        status: 'closed',
        closedAt: now,
        summary: input.summary,
        correctiveActions: input.correctiveActions
      };
      incidentsData[index] = closedIncident;
      return hydrateIncidentMock(closedIncident);
    })
});
