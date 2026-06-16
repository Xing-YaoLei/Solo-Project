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

function hydrateIncident(incident: Incident): Incident {
  const elder = mockElders.find((e) => e.id === incident.elderId);
  const parties = mockIncidentParties.filter((p) => p.incidentId === incident.id);
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
        parties
      };
      incidentsData.unshift(newIncident);
      return newIncident;
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
      let targetParty: IncidentParty | null = null;

      for (const incident of incidentsData) {
        if (incident.parties) {
          const partyIndex = incident.parties.findIndex((p) => p.id === input.partyId);
          if (partyIndex !== -1) {
            incident.parties[partyIndex] = {
              ...incident.parties[partyIndex],
              description: input.description,
              supplementAt: new Date()
            };
            targetParty = incident.parties[partyIndex];
            break;
          }
        }
      }

      if (!targetParty) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '影响对象不存在' });
      }
      return targetParty;
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

      if (!incidentsData[index].parties) {
        incidentsData[index].parties = [];
      }
      incidentsData[index].parties!.push(newParty);

      return incidentsData[index];
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

      const incident = incidentsData[index];
      if (incident.parties) {
        for (const resp of input.responsibilities) {
          const partyIndex = incident.parties.findIndex((p) => p.id === resp.partyId);
          if (partyIndex !== -1) {
            incident.parties[partyIndex] = {
              ...incident.parties[partyIndex],
              isResponsible: resp.isResponsible,
              responsibilityType: resp.isResponsible ? (resp.responsibilityType ?? 'indirect') : null
            };
          }
        }
      }

      incident.status = 'confirming';
      return incident;
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
    .mutation(({ input }): Incident => {
      const index = incidentsData.findIndex((i) => i.id === input.incidentId);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '事件不存在' });
      }

      incidentsData[index] = {
        ...incidentsData[index],
        status: 'closed',
        closedAt: new Date(),
        summary: input.summary,
        correctiveActions: input.correctiveActions
      };
      return incidentsData[index];
    })
});
