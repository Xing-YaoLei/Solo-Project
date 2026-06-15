import { getDb, queryAll, queryOne } from './db';
import { getThresholdValue } from './thresholdService';

export interface TagAnalysis {
	tag: string;
	totalQuestions: number;
	correctRate: number;
	averageScore: number;
	studentCount: number;
	riskLevel: 'low' | 'medium' | 'high';
}

export interface ProgressData {
	date: string;
	completionRate: number;
	submittedCount: number;
	totalCount: number;
	averageScore: number;
}

export interface ScoreDistribution {
	range: string;
	count: number;
	percentage: number;
}

export interface RiskAlert {
	type: string;
	level: 'low' | 'medium' | 'high' | 'critical';
	message: string;
	detail: string;
	affectedStudents?: number;
	affectedAssignments?: number;
}

export interface ReviewMaterial {
	period: string;
	completionRate: number;
	averageScore: number;
	weakTags: string[];
	laggingStudents: {
		studentId: string;
		name: string;
		completionRate: number;
		averageScore: number;
		lagDays: number;
	}[];
	improvementSuggestions: string[];
	feedbackSummary: {
		total: number;
		positive: number;
		neutral: number;
		negative: number;
	};
}

export async function getTagAnalysis(course?: string): Promise<TagAnalysis[]> {
	const db = await getDb();
	const warningThreshold = parseFloat(await getThresholdValue('tag_mastery_warning', '0.6'));

	let sql = `
		SELECT 
			qt.tag,
			COUNT(*) as total_questions,
			AVG(qt.correct_rate) as avg_correct_rate,
			COUNT(DISTINCT s.student_id) as student_count,
			AVG(s.score) as avg_score
		FROM question_tags qt
		LEFT JOIN submissions s ON qt.assignment_id = s.assignment_id
	`;

	const params: string[] = [];
	if (course) {
		sql += ` LEFT JOIN assignments a ON qt.assignment_id = a.assignment_id `;
		sql += ` WHERE a.course = ? `;
		params.push(course);
	}

	sql += ` GROUP BY qt.tag ORDER BY avg_correct_rate ASC`;

	const rows = queryAll<{
		tag: string;
		total_questions: number;
		avg_correct_rate: number;
		student_count: number;
		avg_score: number;
	}>(db, sql, params);

	return rows.map((row) => {
		let riskLevel: 'low' | 'medium' | 'high' = 'low';
		const correctRate = row.avg_correct_rate || 0;
		if (correctRate < warningThreshold * 0.6) {
			riskLevel = 'high';
		} else if (correctRate < warningThreshold) {
			riskLevel = 'medium';
		}

		return {
			tag: row.tag,
			totalQuestions: row.total_questions,
			correctRate: correctRate,
			averageScore: row.avg_score || 0,
			studentCount: row.student_count,
			riskLevel
		};
	});
}

export async function getProgressTrend(days: number = 30, course?: string): Promise<ProgressData[]> {
	const db = await getDb();

	let sql = `
		SELECT 
			date(s.submit_date) as submit_date,
			COUNT(*) as submitted_count,
			(SELECT COUNT(DISTINCT student_id) FROM students) as total_students,
			AVG(s.score) as avg_score
		FROM submissions s
		WHERE s.submit_date IS NOT NULL
	`;

	const params: (string | number)[] = [];
	if (course) {
		sql += ` AND s.assignment_id IN (SELECT assignment_id FROM assignments WHERE course = ?) `;
		params.push(course);
	}

	sql += ` GROUP BY date(s.submit_date) ORDER BY submit_date DESC LIMIT ?`;
	params.push(days);

	const rows = queryAll<{
		submit_date: string;
		submitted_count: number;
		total_students: number;
		avg_score: number;
	}>(db, sql, params);

	const totalStudents = rows[0]?.total_students || 1;

	return rows
		.map((row) => ({
			date: row.submit_date,
			completionRate: row.submitted_count / totalStudents,
			submittedCount: row.submitted_count,
			totalCount: totalStudents,
			averageScore: row.avg_score || 0
		}))
		.reverse();
}

export async function getScoreDistribution(course?: string): Promise<ScoreDistribution[]> {
	const db = await getDb();

	let sql = `SELECT score FROM submissions WHERE score IS NOT NULL`;
	const params: string[] = [];

	if (course) {
		sql += ` AND assignment_id IN (SELECT assignment_id FROM assignments WHERE course = ?)`;
		params.push(course);
	}

	const rows = queryAll<{ score: number }>(db, sql, params);

	const ranges = [
		{ label: '0-59', min: 0, max: 60 },
		{ label: '60-69', min: 60, max: 70 },
		{ label: '70-79', min: 70, max: 80 },
		{ label: '80-89', min: 80, max: 90 },
		{ label: '90-100', min: 90, max: 101 }
	];

	const total = rows.length || 1;

	return ranges.map((range) => {
		const count = rows.filter((r) => r.score >= range.min && r.score < range.max).length;
		return {
			range: range.label,
			count,
			percentage: count / total
		};
	});
}

export async function getRiskAlerts(course?: string): Promise<RiskAlert[]> {
	const db = await getDb();
	const alerts: RiskAlert[] = [];

	const completionWarning = parseFloat(await getThresholdValue('completion_rate_warning', '0.7'));
	const completionCritical = parseFloat(await getThresholdValue('completion_rate_critical', '0.5'));
	const scoreWarning = parseFloat(await getThresholdValue('average_score_warning', '60'));
	const scoreCritical = parseFloat(await getThresholdValue('average_score_critical', '40'));
	const feedbackThreshold = parseInt(await getThresholdValue('negative_feedback_threshold', '3'));
	const progressLagDays = parseInt(await getThresholdValue('progress_lag_days', '3'));

	let courseFilter = '';
	let assignmentCountFilter = '';
	const params: (string | number)[] = [];
	if (course) {
		courseFilter = ' AND a.course = ? ';
		assignmentCountFilter = ' AND course = ? ';
		params.push(course);
	}

	const totalAssignmentsResult = queryOne<{ count: number }>(
		db,
		`SELECT COUNT(*) as count FROM assignments WHERE 1=1 ${assignmentCountFilter}`,
		course ? [course] : []
	);
	const totalAssignments = totalAssignmentsResult?.count || 0;
	const totalStudentsResult = queryOne<{ count: number }>(db, 'SELECT COUNT(*) as count FROM students');
	const totalStudents = totalStudentsResult?.count || 0;

	const completionSql = `
		SELECT COUNT(*) as completed
		FROM submissions s
		LEFT JOIN assignments a ON s.assignment_id = a.assignment_id
		WHERE s.status != 'pending'
		${courseFilter}
	`;
	const compResult = queryOne<{ completed: number }>(db, completionSql, params);
	const expected = totalStudents * totalAssignments;
	const completionRate = expected > 0 ? (compResult?.completed || 0) / expected : 1;

	if (completionRate < completionCritical) {
		alerts.push({
			type: 'completion',
			level: 'critical',
			message: '作业完成率危急',
			detail: `当前完成率仅为 ${(completionRate * 100).toFixed(1)}%（${compResult?.completed || 0}/${expected}），已低于危急阈值`,
			affectedStudents: expected - (compResult?.completed || 0)
		});
	} else if (completionRate < completionWarning) {
		alerts.push({
			type: 'completion',
			level: 'high',
			message: '作业完成率预警',
			detail: `当前完成率为 ${(completionRate * 100).toFixed(1)}%（${compResult?.completed || 0}/${expected}），已低于预警阈值`,
			affectedStudents: expected - (compResult?.completed || 0)
		});
	}

	const scoreSql = `
		SELECT AVG(s.score) as avg_score
		FROM submissions s
		LEFT JOIN assignments a ON s.assignment_id = a.assignment_id
		WHERE s.score IS NOT NULL
		${courseFilter}
	`;
	const scoreResult = queryOne<{ avg_score: number }>(db, scoreSql, params);
	const avgScore = scoreResult?.avg_score || 0;

	if (avgScore < scoreCritical) {
		alerts.push({
			type: 'score',
			level: 'critical',
			message: '平均成绩危急',
			detail: `当前平均分为 ${avgScore.toFixed(1)} 分，已低于危急阈值`
		});
	} else if (avgScore < scoreWarning) {
		alerts.push({
			type: 'score',
			level: 'high',
			message: '平均成绩预警',
			detail: `当前平均分为 ${avgScore.toFixed(1)} 分，已低于预警阈值`
		});
	}

	const feedbackSql = `
		SELECT COUNT(*) as count
		FROM parent_feedback pf
		WHERE pf.sentiment = 'negative'
	`;
	const feedbackResult = queryOne<{ count: number }>(db, feedbackSql);
	const negativeCount = feedbackResult?.count || 0;

	if (negativeCount >= feedbackThreshold) {
		alerts.push({
			type: 'feedback',
			level: 'medium',
			message: '负面反馈较多',
			detail: `收到 ${negativeCount} 条负面反馈，请关注`
		});
	}

	const lagSql = `
		SELECT COUNT(DISTINCT student_id) as lag_count
		FROM (
			SELECT student_id, MAX(submit_date) as last_submit
			FROM submissions
			WHERE submit_date IS NOT NULL
			GROUP BY student_id
		)
		WHERE date(last_submit) < date('now', ?)
	`;
	const lagResult = queryOne<{ lag_count: number }>(db, lagSql, [`-${progressLagDays} days`]);
	const lagCount = lagResult?.lag_count || 0;

	if (lagCount > 0) {
		alerts.push({
			type: 'progress',
			level: 'high',
			message: '学生进度落后',
			detail: `有 ${lagCount} 名学生进度落后超过 ${progressLagDays} 天`,
			affectedStudents: lagCount
		});
	}

	const tagAnalysis = await getTagAnalysis(course);
	const weakTags = tagAnalysis.filter((t) => t.riskLevel !== 'low');
	if (weakTags.length > 0) {
		alerts.push({
			type: 'tags',
			level: 'medium',
			message: '薄弱知识点预警',
			detail: `发现 ${weakTags.length} 个薄弱知识点，需加强练习：${weakTags.map((t) => t.tag).join('、')}`,
			affectedAssignments: weakTags.length
		});
	}

	return alerts.sort((a, b) => {
		const levelOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
		return levelOrder[b.level] - levelOrder[a.level];
	});
}

export async function generateReviewMaterial(periodDays: number = 7, course?: string): Promise<ReviewMaterial> {
	const db = await getDb();

	let courseFilter = '';
	let assignmentCourseFilter = '';
	const params: (string | number)[] = [];
	if (course) {
		courseFilter = ' AND a.course = ? ';
		assignmentCourseFilter = ' AND course = ? ';
		params.push(course);
	}

	const totalStudentsResult = queryOne<{ count: number }>(db, 'SELECT COUNT(*) as count FROM students');
	const totalStudents = totalStudentsResult?.count || 0;

	const totalAssignmentsResult = queryOne<{ count: number }>(
		db,
		`SELECT COUNT(*) as count FROM assignments WHERE 1=1 ${assignmentCourseFilter}`,
		params
	);
	const totalAssignments = totalAssignmentsResult?.count || 0;

	const completionSql = `
		SELECT COUNT(*) as completed
		FROM submissions s
		LEFT JOIN assignments a ON s.assignment_id = a.assignment_id
		WHERE date(s.submit_date) >= date('now', ?)
		AND s.status != 'pending'
		${courseFilter}
	`;
	const compResult = queryOne<{ completed: number }>(db, completionSql, [`-${periodDays} days`, ...params]);
	const expectedSubmissions = totalStudents * totalAssignments;
	const completionRate = expectedSubmissions > 0 ? (compResult?.completed || 0) / expectedSubmissions : 0;

	const scoreSql = `
		SELECT AVG(s.score) as avg_score
		FROM submissions s
		LEFT JOIN assignments a ON s.assignment_id = a.assignment_id
		WHERE date(s.submit_date) >= date('now', ?)
		AND s.score IS NOT NULL
		${courseFilter}
	`;
	const scoreResult = queryOne<{ avg_score: number }>(db, scoreSql, [`-${periodDays} days`, ...params]);
	const averageScore = scoreResult?.avg_score || 0;

	const tagAnalysis = await getTagAnalysis(course);
	const weakTags = tagAnalysis.filter((t) => t.riskLevel !== 'low').map((t) => t.tag);

	const progressLagDays = parseInt(await getThresholdValue('progress_lag_days', '3'));
	const laggingStudentsSql = `
		SELECT 
			st.student_id,
			st.name,
			COALESCE(sub.completed_count, 0) as completed_count,
			? as total_assignments,
			COALESCE(sub.avg_score, 0) as avg_score,
			COALESCE(sub.days_since_last, 999) as days_since_last
		FROM students st
		LEFT JOIN (
			SELECT 
				s.student_id,
				COUNT(DISTINCT s.assignment_id) as completed_count,
				AVG(s.score) as avg_score,
				CAST(julianday('now') - julianday(MAX(s.submit_date)) as INTEGER) as days_since_last
			FROM submissions s
			WHERE s.submit_date IS NOT NULL
			AND s.status != 'pending'
			GROUP BY s.student_id
		) sub ON st.student_id = sub.student_id
		WHERE COALESCE(sub.days_since_last, 999) > ?
		OR COALESCE(sub.completed_count, 0) < ? * 0.5
		ORDER BY days_since_last DESC, completed_count ASC
		LIMIT 10
	`;
	const laggingStudentsRows = queryAll<{
		student_id: string;
		name: string;
		completed_count: number;
		total_assignments: number;
		avg_score: number;
		days_since_last: number;
	}>(db, laggingStudentsSql, [totalAssignments, progressLagDays, totalAssignments]);

	const laggingStudents = laggingStudentsRows.map((row) => ({
		studentId: row.student_id,
		name: row.name,
		completionRate: totalAssignments > 0 ? row.completed_count / totalAssignments : 0,
		averageScore: row.avg_score || 0,
		lagDays: row.days_since_last
	}));

	const feedbackSql = `
		SELECT sentiment, COUNT(*) as count
		FROM parent_feedback
		WHERE date(feedback_date) >= date('now', ?)
		GROUP BY sentiment
	`;
	const feedbackRows = queryAll<{
		sentiment: string;
		count: number;
	}>(db, feedbackSql, [`-${periodDays} days`]);

	const feedbackSummary = {
		total: feedbackRows.reduce((sum, r) => sum + r.count, 0),
		positive: feedbackRows.find((r) => r.sentiment === 'positive')?.count || 0,
		neutral: feedbackRows.find((r) => r.sentiment === 'neutral')?.count || 0,
		negative: feedbackRows.find((r) => r.sentiment === 'negative')?.count || 0
	};

	const suggestions: string[] = [];
	if (completionRate < 0.7) {
		suggestions.push(`作业完成率仅 ${(completionRate * 100).toFixed(1)}%（${compResult?.completed || 0}/${expectedSubmissions}），建议加强家校沟通，督促学生按时完成作业`);
	}
	if (averageScore < 60) {
		suggestions.push('整体成绩不理想，建议回顾核心知识点，安排专项复习');
	}
	if (weakTags.length > 0) {
		suggestions.push(`以下知识点掌握薄弱：${weakTags.join('、')}，建议针对性加强练习`);
	}
	if (laggingStudents.length > 0) {
		suggestions.push(`${laggingStudents.length} 名学生进度落后或完成率不足 50%，建议一对一辅导跟进`);
	}
	if (feedbackSummary.negative > 2) {
		suggestions.push('家长负面反馈较多，建议主动与家长沟通，了解具体问题');
	}
	if (suggestions.length === 0) {
		suggestions.push('整体表现良好，继续保持现有教学节奏');
	}

	return {
		period: `近${periodDays}天`,
		completionRate,
		averageScore,
		weakTags,
		laggingStudents,
		improvementSuggestions: suggestions,
		feedbackSummary
	};
}

export interface FeedbackRecord {
	id: number;
	student_id: string;
	feedback_date: string;
	feedback_type: string;
	content: string;
	sentiment: string;
	source: string;
}

export interface FeedbackSummary {
	total: number;
	positive: number;
	neutral: number;
	negative: number;
}

export async function getParentFeedback(days: number = 30, course?: string): Promise<{ list: FeedbackRecord[]; summary: FeedbackSummary }> {
	const db = await getDb();

	let courseFilter = '';
	const params: (string | number)[] = [`-${days} days`];
	if (course) {
		courseFilter = ` AND pf.student_id IN (SELECT student_id FROM students WHERE course = ?) `;
		params.push(course);
	}

	const listSql = `
		SELECT pf.id, pf.student_id, pf.feedback_date, pf.feedback_type, pf.content, pf.sentiment, pf.source
		FROM parent_feedback pf
		WHERE date(pf.feedback_date) >= date('now', ?)
		${courseFilter}
		ORDER BY pf.feedback_date DESC
		LIMIT 50
	`;
	const list = queryAll<FeedbackRecord>(db, listSql, params);

	const summarySql = `
		SELECT sentiment, COUNT(*) as count
		FROM parent_feedback
		WHERE date(feedback_date) >= date('now', ?)
		${courseFilter}
		GROUP BY sentiment
	`;
	const summaryRows = queryAll<{ sentiment: string; count: number }>(db, summarySql, params);

	const summary: FeedbackSummary = {
		total: summaryRows.reduce((sum, r) => sum + r.count, 0),
		positive: summaryRows.find((r) => r.sentiment === 'positive')?.count || 0,
		neutral: summaryRows.find((r) => r.sentiment === 'neutral')?.count || 0,
		negative: summaryRows.find((r) => r.sentiment === 'negative')?.count || 0
	};

	return { list, summary };
}

export async function getCourses(): Promise<string[]> {
	const db = await getDb();
	const rows = queryAll<{ course: string }>(
		db,
		'SELECT DISTINCT course FROM students WHERE course IS NOT NULL'
	);
	return rows.map((r) => r.course);
}
