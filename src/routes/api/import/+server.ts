import { json } from '@sveltejs/kit';
import { getDb, queryAll } from '$lib/server/db';
import {
	cleanStudents,
	cleanAssignments,
	cleanSubmissions,
	cleanFeedback,
	tableToRecords,
	type RawStudent,
	type RawAssignment,
	type RawSubmission,
	type RawFeedback
} from '$lib/server/dataPipeline';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { sourceType, data } = body;

		if (!sourceType || !data || !Array.isArray(data)) {
			return json({ success: false, message: '参数不完整' }, { status: 400 });
		}

		const db = await getDb();
		let importedCount = 0;

		switch (sourceType) {
			case 'students': {
				const table = cleanStudents(data as RawStudent[]);
				const records = tableToRecords(table);

				for (const item of records) {
					db.run(
						'INSERT OR REPLACE INTO students (student_id, name, grade, course, enroll_date, parent_contact) VALUES (?, ?, ?, ?, ?, ?)',
						[
							item.student_id as string,
							item.name as string,
							(item.grade as string) || null,
							(item.course as string) || null,
							(item.enroll_date as string) || null,
							(item.parent_contact as string) || null
						]
					);
				}
				importedCount = records.length;
				break;
			}

			case 'assignments': {
				const table = cleanAssignments(data as RawAssignment[]);
				const records = tableToRecords(table);

				for (const item of records) {
					db.run(
						'INSERT OR REPLACE INTO assignments (assignment_id, title, course, tag, difficulty, due_date, total_score) VALUES (?, ?, ?, ?, ?, ?, ?)',
						[
							item.assignment_id as string,
							item.title as string,
							(item.course as string) || null,
							(item.tag as string) || null,
							(item.difficulty as string) || 'medium',
							(item.due_date as string) || null,
							(item.total_score as number) || 100
						]
					);
				}
				importedCount = records.length;
				break;
			}

			case 'submissions': {
				const table = cleanSubmissions(data as RawSubmission[]);
				const records = tableToRecords(table);

				for (const item of records) {
					db.run(
						'INSERT OR REPLACE INTO submissions (student_id, assignment_id, submit_date, score, status, correct_count, total_questions, feedback) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
						[
							item.student_id as string,
							item.assignment_id as string,
							(item.submit_date as string) || null,
							item.score !== null ? (item.score as number) : null,
							(item.status as string) || 'submitted',
							(item.correct_count as number) || 0,
							(item.total_questions as number) || 0,
							(item.feedback as string) || null
						]
					);
				}
				importedCount = records.length;
				break;
			}

			case 'feedback': {
				const table = cleanFeedback(data as RawFeedback[]);
				const records = tableToRecords(table);

				for (const item of records) {
					db.run(
						'INSERT INTO parent_feedback (student_id, feedback_date, feedback_type, content, sentiment, source) VALUES (?, ?, ?, ?, ?, ?)',
						[
							item.student_id as string,
							item.feedback_date as string,
							(item.feedback_type as string) || 'general',
							item.content as string,
							item.sentiment as string,
							(item.source as string) || 'wechat'
						]
					);
				}
				importedCount = records.length;
				break;
			}

			default:
				return json({ success: false, message: `不支持的数据源类型: ${sourceType}` }, { status: 400 });
		}

		db.run(
			'INSERT OR REPLACE INTO data_sources (source_name, source_type, last_import, status) VALUES (?, ?, datetime("now"), "active")',
			[sourceType, sourceType]
		);

		return json({
			success: true,
			message: `成功导入 ${importedCount} 条记录`,
			data: { importedCount }
		});
	} catch (error) {
		return json(
			{ success: false, message: error instanceof Error ? error.message : '导入失败' },
			{ status: 500 }
		);
	}
};
