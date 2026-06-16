import { z } from 'zod';
import { router, caregiverProcedure, managerProcedure } from '../trpc';
import { db } from '../../db';
import { elderlyProfiles, type CareLevel, type Gender } from '../../db/schema';
import { eq, and, like, asc, desc } from 'drizzle-orm';
import { generateId, calculateAge } from '../../utils';

export const elderlyRouter = router({
	list: caregiverProcedure
		.input(
			z.object({
				search: z.string().optional(),
				careLevel: z.enum(['independent', 'semi_dependent', 'dependent', 'total_care']).optional(),
				caregiverId: z.string().optional()
			})
		)
		.query(async ({ input, ctx }) => {
			const conditions = [];
			if (input.search) {
				conditions.push(like(elderlyProfiles.name, `%${input.search}%`));
			}
			if (input.careLevel) {
				conditions.push(eq(elderlyProfiles.careLevel, input.careLevel));
			}
			if (input.caregiverId) {
				conditions.push(eq(elderlyProfiles.caregiverId, input.caregiverId));
			}
			if (ctx.user.role === 'caregiver') {
				conditions.push(eq(elderlyProfiles.caregiverId, ctx.user.id));
			}

			return db
				.select()
				.from(elderlyProfiles)
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(asc(elderlyProfiles.roomNumber));
		}),

	getById: caregiverProcedure.input(z.string()).query(async ({ input }) => {
		const result = await db.select().from(elderlyProfiles).where(eq(elderlyProfiles.id, input));
		return result[0];
	}),

	create: managerProcedure
		.input(
			z.object({
				name: z.string().min(1),
				gender: z.enum(['male', 'female', 'other']),
				birthDate: z.number().optional().nullable(),
				idNumber: z.string().optional(),
				roomNumber: z.string().optional(),
				bedNumber: z.string().optional(),
				careLevel: z.enum(['independent', 'semi_dependent', 'dependent', 'total_care']),
				primaryDisease: z.string().optional(),
				allergyInfo: z.string().optional(),
				emergencyContact: z.string().optional(),
				emergencyPhone: z.string().optional(),
				notes: z.string().optional(),
				admissionDate: z.number().optional().nullable(),
				caregiverId: z.string().optional().nullable()
			})
		)
		.mutation(async ({ input }) => {
			const id = generateId();
			const age = input.birthDate ? calculateAge(input.birthDate) : null;

			await db.insert(elderlyProfiles).values({
				id,
				name: input.name,
				gender: input.gender as Gender,
				birthDate: input.birthDate ?? null,
				age: age,
				idNumber: input.idNumber,
				roomNumber: input.roomNumber,
				bedNumber: input.bedNumber,
				careLevel: input.careLevel as CareLevel,
				primaryDisease: input.primaryDisease,
				allergyInfo: input.allergyInfo,
				emergencyContact: input.emergencyContact,
				emergencyPhone: input.emergencyPhone,
				notes: input.notes,
				admissionDate: input.admissionDate ?? null,
				caregiverId: input.caregiverId ?? null
			});

			return id;
		}),

	update: managerProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1).optional(),
				gender: z.enum(['male', 'female', 'other']).optional(),
				birthDate: z.number().optional().nullable(),
				idNumber: z.string().optional(),
				roomNumber: z.string().optional(),
				bedNumber: z.string().optional(),
				careLevel: z.enum(['independent', 'semi_dependent', 'dependent', 'total_care']).optional(),
				primaryDisease: z.string().optional(),
				allergyInfo: z.string().optional(),
				emergencyContact: z.string().optional(),
				emergencyPhone: z.string().optional(),
				notes: z.string().optional(),
				admissionDate: z.number().optional().nullable(),
				caregiverId: z.string().optional().nullable()
			})
		)
		.mutation(async ({ input }) => {
			const { id, ...data } = input;
			const updateData: Record<string, unknown> = {};

			if (data.name !== undefined) updateData.name = data.name;
			if (data.gender !== undefined) updateData.gender = data.gender;
			if (data.birthDate !== undefined) {
				updateData.birthDate = data.birthDate;
				updateData.age = data.birthDate ? calculateAge(data.birthDate) : null;
			}
			if (data.idNumber !== undefined) updateData.idNumber = data.idNumber;
			if (data.roomNumber !== undefined) updateData.roomNumber = data.roomNumber;
			if (data.bedNumber !== undefined) updateData.bedNumber = data.bedNumber;
			if (data.careLevel !== undefined) updateData.careLevel = data.careLevel;
			if (data.primaryDisease !== undefined) updateData.primaryDisease = data.primaryDisease;
			if (data.allergyInfo !== undefined) updateData.allergyInfo = data.allergyInfo;
			if (data.emergencyContact !== undefined) updateData.emergencyContact = data.emergencyContact;
			if (data.emergencyPhone !== undefined) updateData.emergencyPhone = data.emergencyPhone;
			if (data.notes !== undefined) updateData.notes = data.notes;
			if (data.admissionDate !== undefined) updateData.admissionDate = data.admissionDate;
			if (data.caregiverId !== undefined) updateData.caregiverId = data.caregiverId;

			await db.update(elderlyProfiles).set(updateData).where(eq(elderlyProfiles.id, id));
			return true;
		}),

	delete: managerProcedure.input(z.string()).mutation(async ({ input }) => {
		await db.delete(elderlyProfiles).where(eq(elderlyProfiles.id, input));
		return true;
	})
});
