import { getDb, initDb } from './db';

const studentNames = [
	'张小明', '李小红', '王小刚', '赵小芳', '刘小伟',
	'陈小丽', '杨小强', '黄小美', '周小军', '吴小燕',
	'徐小亮', '孙小娟', '胡小鹏', '朱小琳', '郭小峰'
];

const courses = ['数学', '英语', '物理', '化学'];

const assignments = [
	{ id: 'HW001', title: '第一章课后练习', course: '数学', tag: '代数基础', difficulty: 'easy' },
	{ id: 'HW002', title: '方程求解专项', course: '数学', tag: '一元一次方程', difficulty: 'medium' },
	{ id: 'HW003', title: '函数入门练习', course: '数学', tag: '函数概念', difficulty: 'medium' },
	{ id: 'HW004', title: '几何图形计算', course: '数学', tag: '平面几何', difficulty: 'hard' },
	{ id: 'HW005', title: 'Unit 1 词汇测试', course: '英语', tag: '词汇', difficulty: 'easy' },
	{ id: 'HW006', title: 'Unit 2 语法练习', course: '英语', tag: '时态', difficulty: 'medium' },
	{ id: 'HW007', title: '阅读理解训练', course: '英语', tag: '阅读理解', difficulty: 'hard' },
	{ id: 'HW008', title: '力学基础练习', course: '物理', tag: '牛顿定律', difficulty: 'medium' },
	{ id: 'HW009', title: '电学入门', course: '物理', tag: '电路基础', difficulty: 'hard' },
	{ id: 'HW010', title: '元素周期表', course: '化学', tag: '元素性质', difficulty: 'easy' }
];

const questionTags = [
	'代数基础', '一元一次方程', '函数概念', '平面几何',
	'词汇', '时态', '阅读理解',
	'牛顿定律', '电路基础',
	'元素性质', '化学反应', '化学方程式'
];

const feedbackContents = {
	positive: [
		'孩子最近进步很大，感谢老师的耐心教导',
		'作业批改很仔细，孩子学到了很多',
		'课程安排很合理，孩子很喜欢上',
		'老师讲解很清晰，孩子理解得很快',
		'孩子学习积极性提高了很多'
	],
	neutral: [
		'孩子作业完成情况一般',
		'希望能多布置一些练习题',
		'课程进度还可以',
		'孩子基本能跟上进度',
		'作业难度适中'
	],
	negative: [
		'孩子说听不懂，跟不上进度',
		'作业太难了，孩子做不完',
		'最近成绩下降明显，很担心',
		'希望老师能多关注一下孩子',
		'作业批改不及时，反馈太慢'
	]
};

function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): string {
	const date = new Date();
	date.setDate(date.getDate() - randomInt(0, daysAgo));
	return date.toISOString().split('T')[0];
}

function randomFromArray<T>(arr: T[]): T {
	return arr[randomInt(0, arr.length - 1)];
}

export async function generateMockData(): Promise<boolean> {
	const db = await getDb();
	await initDb();

	const existingResult = db.exec('SELECT COUNT(*) as count FROM students');
	const existingCount = existingResult.length > 0 ? (existingResult[0].values[0][0] as number) : 0;
	if (existingCount > 0) {
		return false;
	}

	const studentIds: string[] = [];

	studentNames.forEach((name, index) => {
		const studentId = `S${String(index + 1).padStart(4, '0')}`;
		studentIds.push(studentId);
		const course = randomFromArray(courses);
		db.run(
			'INSERT INTO students (student_id, name, grade, course, enroll_date, parent_contact) VALUES (?, ?, ?, ?, ?, ?)',
			[
				studentId,
				name,
				`${randomInt(7, 9)}年级`,
				course,
				randomDate(90),
				`138${String(randomInt(10000000, 99999999))}`
			]
		);
	});

	assignments.forEach((hw) => {
		db.run(
			'INSERT INTO assignments (assignment_id, title, course, tag, difficulty, due_date, total_score) VALUES (?, ?, ?, ?, ?, ?, ?)',
			[hw.id, hw.title, hw.course, hw.tag, hw.difficulty, randomDate(30), 100]
		);
	});

	studentIds.forEach((studentId) => {
		assignments.forEach((hw) => {
			const submitted = Math.random() > 0.15;
			if (!submitted) {
				db.run(
					'INSERT INTO submissions (student_id, assignment_id, status, total_questions) VALUES (?, ?, ?, ?)',
					[studentId, hw.id, 'pending', randomInt(8, 15)]
				);
				return;
			}

			let baseScore = randomInt(50, 95);
			if (hw.difficulty === 'hard') baseScore -= 10;
			if (hw.difficulty === 'easy') baseScore += 5;
			baseScore = Math.max(20, Math.min(100, baseScore));

			const totalQuestions = randomInt(8, 15);
			const correctCount = Math.floor((baseScore / 100) * totalQuestions);

			db.run(
				`INSERT INTO submissions 
				(student_id, assignment_id, submit_date, score, status, correct_count, total_questions, feedback, graded_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					studentId,
					hw.id,
					randomDate(14),
					baseScore,
					'graded',
					correctCount,
					totalQuestions,
					baseScore >= 80 ? '完成得很好，继续保持！' : baseScore >= 60 ? '还需努力，注意基础知识点' : '基础薄弱，建议加强练习',
					randomDate(10)
				]
			);
		});
	});

	studentIds.forEach((studentId) => {
		const feedbackCount = randomInt(0, 3);
		for (let i = 0; i < feedbackCount; i++) {
			const sentimentRand = Math.random();
			let sentiment: 'positive' | 'neutral' | 'negative';
			if (sentimentRand > 0.7) sentiment = 'positive';
			else if (sentimentRand > 0.3) sentiment = 'neutral';
			else sentiment = 'negative';

			const contents = feedbackContents[sentiment];
			const content = randomFromArray(contents);

			db.run(
				'INSERT INTO parent_feedback (student_id, feedback_date, feedback_type, content, sentiment, source) VALUES (?, ?, ?, ?, ?, ?)',
				[
					studentId,
					randomDate(30),
					randomFromArray(['作业', '课程', '考试', '其他']),
					content,
					sentiment,
					randomFromArray(['wechat', 'phone', 'meeting'])
				]
			);
		}
	});

	assignments.forEach((hw) => {
		const totalQuestions = randomInt(8, 15);
		for (let i = 0; i < totalQuestions; i++) {
			const tag = randomFromArray(questionTags);
			const correctRate = Math.random() * 0.5 + 0.35;
			db.run(
				'INSERT INTO question_tags (assignment_id, question_index, tag, correct_rate, average_time) VALUES (?, ?, ?, ?, ?)',
				[hw.id, i + 1, tag, Math.round(correctRate * 100) / 100, randomInt(60, 300)]
			);
		}
	});

	return true;
}
