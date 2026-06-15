import { tableFromArrays, tableFromJSON, type Table } from 'apache-arrow';

export interface RawStudent {
	student_id?: string;
	学号?: string;
	name?: string;
	姓名?: string;
	grade?: string;
	年级?: string;
	course?: string;
	课程?: string;
	enroll_date?: string;
	报名日期?: string;
	parent_contact?: string;
	家长联系方式?: string;
}

export interface RawAssignment {
	assignment_id?: string;
	作业ID?: string;
	title?: string;
	标题?: string;
	course?: string;
	课程?: string;
	tag?: string;
	标签?: string;
	difficulty?: string;
	难度?: string;
	due_date?: string;
	截止日期?: string;
	total_score?: number;
	满分?: number;
}

export interface RawSubmission {
	student_id?: string;
	学号?: string;
	assignment_id?: string;
	作业ID?: string;
	submit_date?: string;
	提交日期?: string;
	score?: number;
	分数?: number;
	status?: string;
	状态?: string;
	correct_count?: number;
	正确题数?: number;
	total_questions?: number;
	总题数?: number;
	feedback?: string;
	评语?: string;
}

export interface RawFeedback {
	student_id?: string;
	学号?: string;
	feedback_date?: string;
	反馈日期?: string;
	feedback_type?: string;
	反馈类型?: string;
	content?: string;
	内容?: string;
	source?: string;
	来源?: string;
}

export function normalizeField<T extends Record<string, unknown>>(
	raw: T,
	fieldMap: Record<string, string[]>
): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const [targetKey, sourceKeys] of Object.entries(fieldMap)) {
		for (const sourceKey of sourceKeys) {
			if (raw[sourceKey] !== undefined && raw[sourceKey] !== null && raw[sourceKey] !== '') {
				result[targetKey] = raw[sourceKey];
				break;
			}
		}
	}
	return result;
}

export function cleanStudents(rawData: RawStudent[]): Table {
	const studentFieldMap: Record<string, string[]> = {
		student_id: ['student_id', '学号'],
		name: ['name', '姓名'],
		grade: ['grade', '年级'],
		course: ['course', '课程'],
		enroll_date: ['enroll_date', '报名日期'],
		parent_contact: ['parent_contact', '家长联系方式']
	};

	const cleaned = rawData
		.map((raw) => normalizeField(raw, studentFieldMap))
		.filter((s) => s.student_id && s.name)
		.map((s) => ({
			...s,
			student_id: String(s.student_id).trim(),
			name: String(s.name).trim(),
			grade: s.grade ? String(s.grade).trim() : null,
			course: s.course ? String(s.course).trim() : null,
			enroll_date: s.enroll_date ? String(s.enroll_date).trim() : null,
			parent_contact: s.parent_contact ? String(s.parent_contact).trim() : null
		}));

	const unique = deduplicateByKey(cleaned, 'student_id');
	return tableFromJSON(unique);
}

export function cleanAssignments(rawData: RawAssignment[]): Table {
	const assignmentFieldMap: Record<string, string[]> = {
		assignment_id: ['assignment_id', '作业ID'],
		title: ['title', '标题'],
		course: ['course', '课程'],
		tag: ['tag', '标签'],
		difficulty: ['difficulty', '难度'],
		due_date: ['due_date', '截止日期'],
		total_score: ['total_score', '满分']
	};

	const cleaned = rawData
		.map((raw) => normalizeField(raw, assignmentFieldMap))
		.filter((a) => a.assignment_id && a.title)
		.map((a) => ({
			...a,
			assignment_id: String(a.assignment_id).trim(),
			title: String(a.title).trim(),
			course: a.course ? String(a.course).trim() : null,
			tag: a.tag ? String(a.tag).trim() : null,
			difficulty: a.difficulty ? String(a.difficulty).trim() : 'medium',
			due_date: a.due_date ? String(a.due_date).trim() : null,
			total_score: a.total_score !== undefined ? Number(a.total_score) : 100
		}));

	const unique = deduplicateByKey(cleaned, 'assignment_id');
	return tableFromJSON(unique);
}

export function cleanSubmissions(rawData: RawSubmission[]): Table {
	const submissionFieldMap: Record<string, string[]> = {
		student_id: ['student_id', '学号'],
		assignment_id: ['assignment_id', '作业ID'],
		submit_date: ['submit_date', '提交日期'],
		score: ['score', '分数'],
		status: ['status', '状态'],
		correct_count: ['correct_count', '正确题数'],
		total_questions: ['total_questions', '总题数'],
		feedback: ['feedback', '评语']
	};

	const cleaned = rawData
		.map((raw) => normalizeField(raw, submissionFieldMap))
		.filter((s) => s.student_id && s.assignment_id)
		.map((s) => ({
			...s,
			student_id: String(s.student_id).trim(),
			assignment_id: String(s.assignment_id).trim(),
			submit_date: s.submit_date ? String(s.submit_date).trim() : null,
			score: s.score !== undefined ? Number(s.score) : null,
			status: s.status ? String(s.status).trim() : 'submitted',
			correct_count: s.correct_count !== undefined ? Number(s.correct_count) : 0,
			total_questions: s.total_questions !== undefined ? Number(s.total_questions) : 0,
			feedback: s.feedback ? String(s.feedback).trim() : null
		}));

	const unique = deduplicateByCompositeKey(cleaned, ['student_id', 'assignment_id']);
	return tableFromJSON(unique);
}

export function cleanFeedback(rawData: RawFeedback[]): Table {
	const feedbackFieldMap: Record<string, string[]> = {
		student_id: ['student_id', '学号'],
		feedback_date: ['feedback_date', '反馈日期'],
		feedback_type: ['feedback_type', '反馈类型'],
		content: ['content', '内容'],
		source: ['source', '来源']
	};

	const cleaned = rawData
		.map((raw) => normalizeField(raw, feedbackFieldMap))
		.filter((f) => f.student_id && f.content)
		.map((f) => ({
			...f,
			student_id: String(f.student_id).trim(),
			feedback_date: f.feedback_date ? String(f.feedback_date).trim() : new Date().toISOString().split('T')[0],
			feedback_type: f.feedback_type ? String(f.feedback_type).trim() : 'general',
			content: String(f.content).trim(),
			source: f.source ? String(f.source).trim() : 'wechat',
			sentiment: analyzeSentiment(String(f.content))
		}));

	return tableFromJSON(cleaned);
}

function analyzeSentiment(content: string): 'positive' | 'negative' | 'neutral' {
	const positiveWords = ['棒', '好', '优秀', '进步', '满意', '感谢', '赞', '不错', '喜欢', '努力'];
	const negativeWords = ['差', '糟糕', '不满', '投诉', '慢', '落后', '跟不上', '难', '不会', '退步'];

	let positiveScore = 0;
	let negativeScore = 0;

	for (const word of positiveWords) {
		if (content.includes(word)) positiveScore++;
	}
	for (const word of negativeWords) {
		if (content.includes(word)) negativeScore++;
	}

	if (positiveScore > negativeScore) return 'positive';
	if (negativeScore > positiveScore) return 'negative';
	return 'neutral';
}

function deduplicateByKey<T extends Record<string, unknown>>(arr: T[], key: string): T[] {
	const seen = new Set<unknown>();
	return arr.filter((item) => {
		const value = item[key];
		if (seen.has(value)) return false;
		seen.add(value);
		return true;
	});
}

function deduplicateByCompositeKey<T extends Record<string, unknown>>(arr: T[], keys: string[]): T[] {
	const seen = new Set<string>();
	return arr.filter((item) => {
		const composite = keys.map((k) => item[k]).join('|');
		if (seen.has(composite)) return false;
		seen.add(composite);
		return true;
	});
}

export function tableToRecords<T = Record<string, unknown>>(table: Table): T[] {
	const records: T[] = [];
	for (let i = 0; i < table.numRows; i++) {
		const row: Record<string, unknown> = {};
		for (const field of table.schema.fields) {
			row[field.name] = table.getChild(field.name)?.get(i);
		}
		records.push(row as T);
	}
	return records;
}
