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
import { eq } from 'drizzle-orm';

function toDate(date: Date | string): Date {
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

function getPartiesByIncident(incidentId: string): IncidentParty[] {
  return partiesData.filter((p) => p.incidentId === incidentId);
}

function hydrateIncident(incident: Incident): Incident {
  const elder = mockElders.find((e) => e.id === incident.elderId);
  const parties = getPartiesByIncident(incident.id);
  return {
    ...incident,
    elder,
    parties: parties.length > 0 ? parties : incident.parties ?? []
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
    .query(({ input }): PaginatedResult<Incident> => {
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

      filtered.sort((a, b) => toDate(b.reportedAt).getTime() - toDate(a.reportedAt).getTime());

      const total = filtered.length;
      const start = (input.page - 1) * input.pageSize;
      const items = filtered.slice(start, start + input.pageSize).map(hydrateIncident);

      return {
        items,
        total,
        page: input.page,
        pageSize: input.pageSize
      };
    }),

  getById: protectedProcedure
    .input(z.string().min(1))
    .query(({ input }): Incident => {
      const incident = incidentsData.find((i) => i.id === input);
      if (!incident) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '事件不存在' });
      }
      return hydrateIncident(incident);
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
    .mutation(({ input, ctx }): Incident => {
      const elder = mockElders.find((e) => e.id === input.elderId);
      if (!elder) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '老人不存在' });
      }

      const now = new Date();
      const incidentId = generateId();

      const parties: IncidentParty[] = [];

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
      return hydrateIncident(newIncident);
    }),

  supplementParty: protectedProcedure
    .use(staffRole)
    .input(
      z.object({
        partyId: z.string().min(1),
        description: z.string().min(1, '补充说明不能为空')
      })
    )
    .mutation(({ input }): IncidentParty => {
      const partyIndex = partiesData.findIndex((p) => p.id === input.partyId);
      if (partyIndex === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '影响对象不存在' });
      }
      partiesData[partyIndex] = {
        ...partiesData[partyIndex],
        description: input.description,
        supplementAt: new Date()
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
    .mutation(({ input }): Incident => {
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
      return hydrateIncident(incidentsData[index]);
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
    .mutation(({ input }): Incident => {
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
      return hydrateIncident(incidentsData[index]);
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
      const index = incidentsData.findIndex((i) => i.id === input.incidentId);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '事件不存在' });
      }

      const now = new Date();
      const closedIncident: Incident = {
        ...incidentsData[index],
        status: 'closed',
        closedAt: now,
        summary: input.summary,
        correctiveActions: input.correctiveActions
      };
      incidentsData[index] = closedIncident;

      const allParties = getPartiesByIncident(input.incidentId);

      try {
        const dbInstance = await getDb();
        if (!dbInstance.isMock) {
          const db = dbInstance.db as Database;
          await db.transaction(async (tx) => {
            const existingIncident = await tx.query.incidents.findFirst({
              where: eq(schema.incidents.id, input.incidentId)
            });

            if (existingIncident) {
              await tx.update(schema.incidents)
                .set({
                  status: 'closed',
                  closedAt: now,
                  summary: input.summary,
                  correctiveActions: input.correctiveActions
                })
                .where(eq(schema.incidents.id, input.incidentId));
            } else {
              await tx.insert(schema.incidents).values({
                id: closedIncident.id,
                elderId: closedIncident.elderId,
                type: closedIncident.type,
                status: 'closed',
                reportedAt: toDate(closedIncident.reportedAt),
                reportedBy: closedIncident.reportedBy,
                location: closedIncident.location,
                description: closedIncident.description,
                closedAt: now,
                summary: input.summary,
                correctiveActions: input.correctiveActions
              });
            }

            for (const party of allParties) {
              const existingParty = await tx.query.incidentParties.findFirst({
                where: eq(schema.incidentParties.id, party.id)
              });

              const partyRecord = {
                id: party.id,
                incidentId: party.incidentId,
                roleType: party.roleType,
                userId: party.userId,
                personName: party.personName,
                description: party.description,
                supplementAt: party.supplementAt ? toDate(party.supplementAt) : null,
                isResponsible: party.isResponsible,
                responsibilityType: party.responsibilityType
              };

              if (existingParty) {
                await tx.update(schema.incidentParties)
                  .set(partyRecord)
                  .where(eq(schema.incidentParties.id, party.id));
              } else {
                await tx.insert(schema.incidentParties).values(partyRecord);
              }
            }

            const handlerUserName = ctx.user?.name ?? '系统';
            const handlerUserId = ctx.user?.id ?? null;
            const existingHandler = await tx.query.flowHandlers.findFirst({
              where: eq(schema.flowHandlers.id, `handler-close-${input.incidentId}`)
            });
            if (!existingHandler) {
              await tx.insert(schema.flowHandlers).values({
                id: `handler-close-${input.incidentId}`,
                entityType: 'incident',
                entityId: input.incidentId,
                stepName: '关闭归档',
                userId: handlerUserId,
                userName: handlerUserName,
                handledAt: now,
                action: 'close'
              });
            }
          });
          console.log(`[Incident] Event ${input.incidentId} closed and persisted to PostgreSQL`);
        }
      } catch (persistError) {
        console.error('[Incident] Failed to persist closed incident:', persistError instanceof Error ? persistError.message : persistError);
      }

      return hydrateIncident(closedIncident);
    })
});
