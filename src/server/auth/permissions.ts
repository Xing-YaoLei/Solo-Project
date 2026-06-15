import type { UserRoleCode } from '../db/schema/roles';

export interface PermissionConfig {
	[key: string]: boolean;
}

const rolePermissions: Record<UserRoleCode, PermissionConfig> = {
	student: {
		'course.view': true,
		'course.study': true,
		'progress.view.self': true,
		'exam.take': true,
		'exam.view.self': true,
		'todo.view.self': true,
		'todo.create': true,
		'filter.manage.self': true
	},
	assistant: {
		'course.view': true,
		'course.manage': false,
		'progress.view.all': true,
		'progress.update': true,
		'exam.view.all': true,
		'exam.grade': true,
		'todo.view.assigned': true,
		'todo.process': true,
		'todo.transfer': true,
		'todo.material.upload': true,
		'student.view': true,
		'report.view': true,
		'filter.manage.self': true,
		'reminderRule.view': true,
		'chapterTrace.view': true
	},
	lecturer: {
		'course.view': true,
		'course.manage': true,
		'question.manage': true,
		'progress.view.all': true,
		'progress.update': true,
		'exam.view.all': true,
		'exam.manage': true,
		'exam.grade': true,
		'todo.view.all': true,
		'todo.process': true,
		'todo.transfer': true,
		'todo.material.upload': true,
		'todo.create': true,
		'student.view': true,
		'student.manage': false,
		'report.view': true,
		'report.export': true,
		'filter.manage.self': true,
		'reminderRule.manage': true,
		'chapterTrace.view': true
	},
	admin: {
		'course.view': true,
		'course.manage': true,
		'question.manage': true,
		'progress.view.all': true,
		'progress.update': true,
		'exam.view.all': true,
		'exam.manage': true,
		'exam.grade': true,
		'todo.view.all': true,
		'todo.process': true,
		'todo.transfer': true,
		'todo.material.upload': true,
		'todo.create': true,
		'todo.reject': true,
		'student.view': true,
		'student.manage': true,
		'user.manage': true,
		'role.manage': true,
		'report.view': true,
		'report.export': true,
		'filter.manage.self': true,
		'reminderRule.manage': true,
		'chapterTrace.view': true,
		'system.settings': true,
		'export.data': true
	}
};

export function getPermissionsByRoles(roles: UserRoleCode[]): PermissionConfig {
	const permissions: PermissionConfig = {};

	for (const role of roles) {
		const rolePerms = rolePermissions[role];
		if (rolePerms) {
			Object.assign(permissions, rolePerms);
		}
	}

	return permissions;
}

export function hasPermission(
	userPermissions: PermissionConfig,
	permission: string
): boolean {
	return userPermissions[permission] === true;
}
