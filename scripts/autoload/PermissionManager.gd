extends Node

signal permission_granted(permission: String)
signal permission_denied(permission: String, reason: String)

const ROLES := {
	"auditor": {
		"name": "审计员",
		"permissions": ["evidence_review", "template_usage"]
	},
	"senior_auditor": {
		"name": "高级审计员",
		"permissions": ["evidence_review", "template_usage", "archive_management", "sampling_audit"]
	},
	"compliance_manager": {
		"name": "合规经理",
		"permissions": ["evidence_review", "template_usage", "archive_management", "sampling_audit", "config_management", "record_review"]
	}
}

const PERMISSION_DESCRIPTIONS := {
	"evidence_review": "查看与审核审计证据材料",
	"template_usage": "使用与选择通报模板",
	"archive_management": "管理归档流程与检查清单",
	"sampling_audit": "执行抽样审计与异常记录处理",
	"config_management": "维护系统配置与题库",
	"record_review": "查看训练记录与复盘分析"
}

var current_role: String = "senior_auditor"

func get_current_role() -> String:
	return current_role

func set_role(role: String) -> void:
	if role in ROLES:
		current_role = role

func get_role_name(role: String = "") -> String:
	var r = role if role != "" else current_role
	return ROLES.get(r, {}).get("name", "未知角色")

func has_permission(permission: String) -> bool:
	var role_data = ROLES.get(current_role, {})
	var perms = role_data.get("permissions", [])
	return permission in perms

func check_permission(permission: String) -> Dictionary:
	var result := {
		"granted": false,
		"permission": permission,
		"reason": ""
	}
	if has_permission(permission):
		result["granted"] = true
		emit_signal("permission_granted", permission)
	else:
		var required_role = find_role_with_permission(permission)
		result["reason"] = "当前角色[%s]无权限[%s]。该权限需要%s及以上角色。权限说明：%s" % [
			get_role_name(),
			permission,
			ROLES.get(required_role, {}).get("name", "特定"),
			PERMISSION_DESCRIPTIONS.get(permission, "无描述")
		]
		emit_signal("permission_denied", permission, result["reason"])
		if GameManager:
			GameManager.record_permission_violation(result["reason"])
	return result

func find_role_with_permission(permission: String) -> String:
	for role in ROLES.keys():
		if permission in ROLES[role].get("permissions", []):
			return role
	return ""

func get_available_roles() -> Array:
	var result: Array = []
	for role_id in ROLES.keys():
		result.append({
			"id": role_id,
			"name": ROLES[role_id]["name"],
			"permissions": ROLES[role_id]["permissions"]
		})
	return result
