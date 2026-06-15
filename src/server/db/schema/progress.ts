import { pgTable, text, timestamp, integer, boolean, json } from 'drizzle-orm/pg-core';
import { users } from './users';
import { courses, chapters } from './courses';

export const learningProgress = pgTable('learning_progress', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	courseId: text('course_id')
		.notNull()
		.references(() => courses.id, { onDelete: 'cascade' }),
	chapterId: text('chapter_id').references(() => chapters.id, { onDelete: 'set null' }),
	progressPercent: integer('progress_percent').notNull().default(0),
	lastPosition: integer('last_position').default(0),
	totalQuestions: integer('total_questions').default(0),
	completedQuestions: integer('completed_questions').default(0),
	correctQuestions: integer('correct_questions').default(0),
	studyTimeSeconds: integer('study_time_seconds').default(0),
	isCompleted: boolean('is_completed').notNull().default(false),
	lastStudiedAt: timestamp('last_studied_at'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const examScores = pgTable('exam_scores', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	courseId: text('course_id')
		.notNull()
		.references(() => courses.id, { onDelete: 'cascade' }),
	examName: text('exam_name').notNull(),
	totalScore: integer('total_score').notNull().default(100),
	score: integer('score').notNull().default(0),
	isPassed: boolean('is_passed').notNull().default(false),
	passScore: integer('pass_score').default(60),
	answers: json('answers'),
	durationSeconds: integer('duration_seconds').default(0),
	startedAt: timestamp('started_at'),
	finishedAt: timestamp('finished_at'),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export type LearningProgress = typeof learningProgress.$inferSelect;
export type NewLearningProgress = typeof learningProgress.$inferInsert;
export type ExamScore = typeof examScores.$inferSelect;
export type NewExamScore = typeof examScores.$inferInsert;
