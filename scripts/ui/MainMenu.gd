extends "res://scripts/ui/BaseUI.gd"

var role_label_ref: Label
var role_switch_menu: OptionButton
var role_hbox: HBoxContainer

func _ready() -> void:
	super._ready()
	_build_menu()

func _build_menu() -> void:
	var center_x = get_viewport_rect().size.x / 2
	var center_y = get_viewport_rect().size.y / 2

	var title = create_label("合规审计证据归档训练系统", Vector2(0, 80), 38, STYLE_TEXT_PRIMARY)
	title.size = Vector2(get_viewport_rect().size.x, 60)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(title)

	var subtitle = create_label("Compliance Audit Evidence Archiving Training", Vector2(0, 140), 18, STYLE_TEXT_SECONDARY)
	subtitle.size = Vector2(get_viewport_rect().size.x, 30)
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(subtitle)

	role_hbox = HBoxContainer.new()
	role_hbox.position = Vector2(center_x - 200, 195)
	role_hbox.size = Vector2(400, 35)
	role_hbox.add_theme_constant_override("separation", 10)
	role_hbox.alignment = BoxContainer.ALIGNMENT_CENTER
	add_child(role_hbox)

	role_label_ref = create_label("当前角色：", Vector2.ZERO, 15, STYLE_TEXT_SECONDARY)
	role_label_ref.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	role_hbox.add_child(role_label_ref)

	role_switch_menu = OptionButton.new()
	role_switch_menu.custom_minimum_size = Vector2(180, 34)
	role_switch_menu.add_theme_font_size_override("font_size", 15)
	var roles = PermissionManager.get_available_roles()
	var cur_role = PermissionManager.get_current_role()
	for ri in range(roles.size()):
		role_switch_menu.add_item(roles[ri]["name"])
		if roles[ri]["id"] == cur_role:
			role_switch_menu.select(ri)
	var menu_style = StyleBoxFlat.new()
	menu_style.bg_color = Color(0.25, 0.30, 0.40, 1)
	menu_style.corner_radius_top_left = 6
	menu_style.corner_radius_top_right = 6
	menu_style.corner_radius_bottom_left = 6
	menu_style.corner_radius_bottom_right = 6
	menu_style.content_margin_left = 10
	menu_style.content_margin_right = 10
	menu_style.content_margin_top = 5
	menu_style.content_margin_bottom = 5
	role_switch_menu.add_theme_stylebox_override("normal", menu_style)
	role_switch_menu.add_theme_color_override("font_color", STYLE_TEXT_PRIMARY)
	role_switch_menu.item_selected.connect(func(idx):
		if idx >= 0 and idx < roles.size():
			PermissionManager.set_role(roles[idx]["id"])
			show_notification("已切换角色：" + roles[idx]["name"], "info", 2.0)
	)
	role_hbox.add_child(role_switch_menu)

	var tip_label = create_label("（点击切换角色，合规经理可进入配置管理）", Vector2.ZERO, 12, Color(0.5, 0.55, 0.65, 1))
	tip_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	role_hbox.add_child(tip_label)

	var formal_btn = create_button("📋 正式训练", Vector2(center_x - 110, center_y - 100), Vector2(220, 56), Color(0.2, 0.5, 0.85, 1))
	formal_btn.add_theme_font_size_override("font_size", 20)
	formal_btn.pressed.connect(_on_formal_training_pressed)
	add_child(formal_btn)

	var formal_desc = create_label("有时间限制，成绩计入正式训练记录", Vector2(center_x - 200, center_y - 35), 14, STYLE_TEXT_SECONDARY)
	formal_desc.size = Vector2(400, 25)
	formal_desc.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(formal_desc)

	var practice_btn = create_button("🎯 自由练习", Vector2(center_x - 110, center_y + 10), Vector2(220, 56), Color(0.2, 0.65, 0.4, 1))
	practice_btn.add_theme_font_size_override("font_size", 20)
	practice_btn.pressed.connect(_on_free_practice_pressed)
	add_child(practice_btn)

	var practice_desc = create_label("无时间限制，可使用提示，不计入正式成绩", Vector2(center_x - 200, center_y + 75), 14, STYLE_TEXT_SECONDARY)
	practice_desc.size = Vector2(400, 25)
	practice_desc.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(practice_desc)

	var review_btn = create_button("📊 训练记录与复盘", Vector2(center_x - 200, center_y + 130), Vector2(190, 48), Color(0.45, 0.35, 0.75, 1))
	review_btn.add_theme_font_size_override("font_size", 16)
	review_btn.pressed.connect(_on_review_pressed)
	add_child(review_btn)

	var config_btn = create_button("⚙️ 配置管理", Vector2(center_x + 10, center_y + 130), Vector2(190, 48), Color(0.75, 0.55, 0.2, 1))
	config_btn.add_theme_font_size_override("font_size", 16)
	config_btn.pressed.connect(_on_config_pressed)
	add_child(config_btn)

	var stats = TrainingRecordManager.get_statistics_summary()
	var stats_text = "已完成训练：%d 次 | 正式训练：%d 次 | 平均正确率：%.1f%%" % [
		stats["total_training_count"],
		stats["formal_training_count"],
		stats["average_accuracy"] * 100
	]
	var stats_label = create_label(stats_text, Vector2(0, get_viewport_rect().size.y - 60), 14, STYLE_TEXT_SECONDARY)
	stats_label.size = Vector2(get_viewport_rect().size.x, 30)
	stats_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(stats_label)

	var version_label = create_label("v1.0.0 | Godot 4 | Web Export Ready", Vector2(0, get_viewport_rect().size.y - 35), 12, Color(0.45, 0.5, 0.58, 1))
	version_label.size = Vector2(get_viewport_rect().size.x, 25)
	version_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(version_label)

func _on_formal_training_pressed() -> void:
	GameManager.current_mode = "formal"
	GameManager.change_scene("formal_training")

func _on_free_practice_pressed() -> void:
	GameManager.current_mode = "practice"
	GameManager.change_scene("free_practice")

func _on_review_pressed() -> void:
	var perm_check = PermissionManager.check_permission("record_review")
	if not perm_check["granted"]:
		show_permission_error(perm_check["reason"])
		_prompt_switch_role("record_review")
		return
	GameManager.change_scene("result_review")

func _on_config_pressed() -> void:
	var perm_check = PermissionManager.check_permission("config_management")
	if not perm_check["granted"]:
		show_permission_error(perm_check["reason"])
		_prompt_switch_role("config_management")
		return
	GameManager.change_scene("config_management")

func _prompt_switch_role(required_permission: String) -> void:
	var needed_role = PermissionManager.find_role_with_permission(required_permission)
	if needed_role == "":
		return
	var roles = PermissionManager.get_available_roles()
	var target_idx = -1
	for ri in range(roles.size()):
		if roles[ri]["id"] == needed_role:
			target_idx = ri
			break
	if target_idx < 0:
		return
	var confirm = AcceptDialog.new()
	confirm.title = "需要切换角色"
	confirm.dialog_text = "该功能需要【%s】角色，是否立即切换？" % PermissionManager.get_role_name(needed_role)
	confirm.confirmed.connect(func():
		PermissionManager.set_role(needed_role)
		role_switch_menu.select(target_idx)
		show_notification("已切换角色，可继续操作", "success", 2.0)
	)
	add_child(confirm)
	confirm.popup_centered()
