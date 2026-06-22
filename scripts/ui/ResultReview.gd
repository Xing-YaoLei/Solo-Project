extends "res://scripts/ui/BaseUI.gd"

var tab_container: TabContainer

func _ready() -> void:
	_setup_background()
	_build_ui()

func _build_ui() -> void:
	var center_x = get_viewport_rect().size.x / 2

	var title = create_label("📊 训练记录与复盘分析", Vector2(0, 40), 30, STYLE_ACCENT)
	title.size = Vector2(get_viewport_rect().size.x, 50)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(title)

	var stats = TrainingRecordManager.get_statistics_summary()
	var summary_text = "总训练：%d 次 | 正式训练：%d 次 | 平均正确率：%.1f%% | 权限越权：%d 次" % [
		stats["total_training_count"],
		stats["formal_training_count"],
		stats["average_accuracy"] * 100,
		stats["permission_violation_count"]
	]
	var summary_label = create_label(summary_text, Vector2(0, 90), 15, STYLE_TEXT_SECONDARY)
	summary_label.size = Vector2(get_viewport_rect().size.x, 30)
	summary_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(summary_label)

	tab_container = TabContainer.new()
	tab_container.position = Vector2(40, 140)
	tab_container.size = Vector2(get_viewport_rect().size.x - 80, get_viewport_rect().size.y - 240)
	add_child(tab_container)

	var tab1 = _build_records_tab()
	tab1.name = "训练记录"
	tab_container.add_child(tab1)

	var tab2 = _build_mistakes_tab()
	tab2.name = "问题复发分析"
	tab_container.add_child(tab2)

	var tab3 = _build_last_result_tab()
	tab3.name = "本次训练详情"
	tab_container.add_child(tab3)

	var back_btn = create_button("← 返回主菜单", Vector2(60, get_viewport_rect().size.y - 80), Vector2(180, 44), Color(0.4, 0.45, 0.55, 1))
	back_btn.pressed.connect(_on_back_pressed)
	add_child(back_btn)

func _build_records_tab() -> VBoxContainer:
	var vbox = VBoxContainer.new()
	vbox.anchor_right = 1.0
	vbox.anchor_bottom = 1.0
	vbox.add_theme_constant_override("separation", 12)
	var mc = create_margin_container({"left": 8, "right": 8, "top": 8, "bottom": 8})
	mc.add_child(vbox)

	var header_hbox = HBoxContainer.new()
	header_hbox.add_theme_constant_override("separation", 12)
	vbox.add_child(header_hbox)

	var clear_btn = create_button("🗑 清空所有记录", Vector2.ZERO, Vector2(160, 36), STYLE_DANGER)
	clear_btn.add_theme_font_size_override("font_size", 13)
	clear_btn.pressed.connect(_on_clear_records)
	header_hbox.add_child(clear_btn)

	var spacer = Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header_hbox.add_child(spacer)

	var scroll = ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	vbox.add_child(scroll)

	var records_vbox = VBoxContainer.new()
	records_vbox.add_theme_constant_override("separation", 8)
	records_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(records_vbox)

	var records = TrainingRecordManager.get_recent_records(50)
	if records.is_empty():
		var empty_label = create_label("暂无训练记录，开始训练后将在此展示", Vector2.ZERO, 16, STYLE_TEXT_SECONDARY)
		empty_label.size = Vector2(0, 60)
		empty_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		empty_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		records_vbox.add_child(empty_label)
	else:
		for rec in records:
			var record_card = _build_record_card(rec)
			records_vbox.add_child(record_card)

	return mc

func _build_record_card(rec: Dictionary) -> PanelContainer:
	var card = PanelContainer.new()
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.18, 0.22, 0.28, 1)
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_left = 8
	style.corner_radius_bottom_right = 8
	style.content_margin_left = 16
	style.content_margin_right = 16
	style.content_margin_top = 12
	style.content_margin_bottom = 12
	card.add_theme_stylebox_override("panel", style)
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL

	var hbox = HBoxContainer.new()
	hbox.anchor_right = 1.0
	hbox.anchor_bottom = 1.0
	hbox.add_theme_constant_override("separation", 20)
	card.add_child(hbox)

	var mode_icon = "📋" if rec.get("mode") == "formal" else "🎯"
	var mode_color = STYLE_ACCENT if rec.get("mode") == "formal" else STYLE_SUCCESS
	var mode_label = create_label(mode_icon + (" 正式" if rec.get("mode") == "formal" else " 练习"), Vector2.ZERO, 14, mode_color)
	mode_label.custom_minimum_size = Vector2(80, 0)
	mode_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	hbox.add_child(mode_label)

	var vbox_info = VBoxContainer.new()
	vbox_info.add_theme_constant_override("separation", 4)
	vbox_info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hbox.add_child(vbox_info)

	var level_name = create_label(rec.get("level_name", "未知关卡"), Vector2.ZERO, 16, STYLE_TEXT_PRIMARY)
	vbox_info.add_child(level_name)

	var info_text = ""
	var ts = rec.get("end_time", 0)
	if ts > 0:
		var datetime = Time.get_datetime_string_from_unix_time(ts).replace("T", " ")
		info_text += datetime
	var dur = rec.get("duration", 0)
	if dur > 0:
		info_text += " | 用时：" + format_time(int(dur))
	var info_label = create_label(info_text, Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
	vbox_info.add_child(info_label)

	var accuracy = rec.get("accuracy", 0.0)
	var acc_color = STYLE_SUCCESS if accuracy >= 0.8 else (STYLE_WARNING if accuracy >= 0.6 else STYLE_DANGER)
	var acc_label = create_label("正确率：%.0f%%" % (accuracy * 100), Vector2.ZERO, 18, acc_color)
	acc_label.custom_minimum_size = Vector2(120, 0)
	acc_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	acc_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	hbox.add_child(acc_label)

	var score_text = "%d / %d" % [rec.get("total_score", 0), rec.get("max_score", 0)]
	var score_label = create_label(score_text, Vector2.ZERO, 15, STYLE_TEXT_SECONDARY)
	score_label.custom_minimum_size = Vector2(100, 0)
	score_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	score_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	hbox.add_child(score_label)

	var vios = rec.get("permission_violations", [])
	if not vios.is_empty():
		var vio_label = create_label("⚠ %d次越权" % vios.size(), Vector2.ZERO, 13, STYLE_DANGER)
		vio_label.custom_minimum_size = Vector2(80, 0)
		vio_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		hbox.add_child(vio_label)

	return card

func _build_mistakes_tab() -> VBoxContainer:
	var vbox = VBoxContainer.new()
	vbox.anchor_right = 1.0
	vbox.anchor_bottom = 1.0
	vbox.add_theme_constant_override("separation", 12)
	var mc = create_margin_container({"left": 8, "right": 8, "top": 8, "bottom": 8})
	mc.add_child(vbox)

	var desc_label = create_label("以下展示正式训练中高频出现的错误类型，帮助识别复发问题进行针对性改进", Vector2.ZERO, 14, STYLE_TEXT_SECONDARY)
	desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vbox.add_child(desc_label)

	var scroll = ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	vbox.add_child(scroll)

	var mistakes_vbox = VBoxContainer.new()
	mistakes_vbox.add_theme_constant_override("separation", 10)
	mistakes_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(mistakes_vbox)

	var recurrences = TrainingRecordManager.get_mistake_recurrence()
	if recurrences.is_empty():
		var empty_label = create_label("暂无正式训练错误记录，完成正式训练后将展示问题复发分析", Vector2.ZERO, 16, STYLE_TEXT_SECONDARY)
		empty_label.size = Vector2(0, 60)
		empty_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		empty_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		mistakes_vbox.add_child(empty_label)
	else:
		for m in recurrences:
			var mtype = m.get("mistake_type", "unknown")
			var count = m.get("count", 0)
			var rate = m.get("recurrence_rate", 0.0)
			var type_name = _get_mistake_type_name(mtype)
			var card = PanelContainer.new()
			var style = StyleBoxFlat.new()
			var bg = Color(0.18, 0.22, 0.28, 1)
			if count >= 3:
				bg = Color(0.32, 0.18, 0.18, 1)
			elif count >= 2:
				bg = Color(0.30, 0.26, 0.16, 1)
			style.bg_color = bg
			style.corner_radius_top_left = 8
			style.corner_radius_top_right = 8
			style.corner_radius_bottom_left = 8
			style.corner_radius_bottom_right = 8
			style.content_margin_left = 16
			style.content_margin_right = 16
			style.content_margin_top = 12
			style.content_margin_bottom = 12
			card.add_theme_stylebox_override("panel", style)
			card.size_flags_horizontal = Control.SIZE_EXPAND_FILL

			var chbox = HBoxContainer.new()
			chbox.anchor_right = 1.0
			chbox.anchor_bottom = 1.0
			chbox.add_theme_constant_override("separation", 20)
			card.add_child(chbox)

			var warn_icon = "🔴" if count >= 3 else ("🟡" if count >= 2 else "🔵")
			var icon_lbl = create_label(warn_icon, Vector2.ZERO, 26, STYLE_WARNING)
			chbox.add_child(icon_lbl)

			var cvbox = VBoxContainer.new()
			cvbox.add_theme_constant_override("separation", 4)
			cvbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			chbox.add_child(cvbox)

			var tname_lbl = create_label(type_name, Vector2.ZERO, 17, STYLE_TEXT_PRIMARY)
			cvbox.add_child(tname_lbl)

			var recurrence_text = "复发提示：该错误类型反复出现，建议加强此模块的专项训练"
			if count >= 3:
				recurrence_text = "🚨 高频复发：此错误出现 %d 次，属于重点问题，需立即进行针对性复盘和强化训练" % count
			elif count >= 2:
				recurrence_text = "⚠ 注意复发：已出现 %d 次，建议回顾相关知识点" % count
			var rec_lbl = create_label(recurrence_text, Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
			rec_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
			cvbox.add_child(rec_lbl)

			var cnt_lbl = create_label("出现 %d 次" % count, Vector2.ZERO, 16, STYLE_WARNING)
			cnt_lbl.custom_minimum_size = Vector2(100, 0)
			cnt_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
			cnt_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
			chbox.add_child(cnt_lbl)

			mistakes_vbox.add_child(card)

	return mc

func _get_mistake_type_name(mtype: String) -> String:
	match mtype:
		"evidence_identification": return "证据附件识别错误"
		"template_selection": return "通报模板选择错误"
		"checklist_sorting": return "检查清单排序错误"
		"sampling_processing": return "抽样记录处理错误"
		_: return "其他错误：" + mtype

func _build_last_result_tab() -> VBoxContainer:
	var vbox = VBoxContainer.new()
	vbox.anchor_right = 1.0
	vbox.anchor_bottom = 1.0
	vbox.add_theme_constant_override("separation", 12)
	var mc = create_margin_container({"left": 8, "right": 8, "top": 8, "bottom": 8})
	mc.add_child(vbox)

	var records = TrainingRecordManager.get_recent_records(1)
	if records.is_empty():
		var empty_label = create_label("暂无训练结果，完成一次训练后将在此展示详细信息", Vector2.ZERO, 16, STYLE_TEXT_SECONDARY)
		empty_label.size = Vector2(0, 100)
		empty_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		empty_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		vbox.add_child(empty_label)
		return mc

	var rec = records[0]

	var result_banner = PanelContainer.new()
	var banner_style = StyleBoxFlat.new()
	var accuracy = rec.get("accuracy", 0.0)
	var banner_color = STYLE_SUCCESS if accuracy >= 0.8 else (STYLE_WARNING if accuracy >= 0.6 else STYLE_DANGER)
	banner_style.bg_color = banner_color.darkened(0.5)
	banner_style.corner_radius_top_left = 12
	banner_style.corner_radius_top_right = 12
	banner_style.corner_radius_bottom_left = 12
	banner_style.corner_radius_bottom_right = 12
	banner_style.content_margin_left = 24
	banner_style.content_margin_right = 24
	banner_style.content_margin_top = 20
	banner_style.content_margin_bottom = 20
	result_banner.add_theme_stylebox_override("panel", banner_style)
	result_banner.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vbox.add_child(result_banner)

	var banner_vbox = VBoxContainer.new()
	banner_vbox.anchor_right = 1.0
	banner_vbox.anchor_bottom = 1.0
	banner_vbox.add_theme_constant_override("separation", 8)
	result_banner.add_child(banner_vbox)

	var banner_title = create_label(_get_result_title(accuracy), Vector2.ZERO, 28, banner_color.lightened(0.3))
	banner_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	banner_vbox.add_child(banner_title)

	var banner_score = create_label("总得分：%d / %d （正确率：%.1f%%）" % [
		rec.get("total_score", 0), rec.get("max_score", 0), accuracy * 100
	], Vector2.ZERO, 20, STYLE_TEXT_PRIMARY)
	banner_score.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	banner_vbox.add_child(banner_score)

	var scroll = ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	vbox.add_child(scroll)

	var details_vbox = VBoxContainer.new()
	details_vbox.add_theme_constant_override("separation", 8)
	details_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(details_vbox)

	var questions_title = create_label("答题详情", Vector2.ZERO, 18, STYLE_ACCENT)
	details_vbox.add_child(questions_title)

	var questions = rec.get("questions", [])
	for i in range(questions.size()):
		var q = questions[i]
		var q_card = _build_question_detail_card(i + 1, q)
		details_vbox.add_child(q_card)

	var vios = rec.get("permission_violations", [])
	if not vios.is_empty():
		var vio_title = create_label("权限越权记录", Vector2.ZERO, 18, STYLE_DANGER)
		details_vbox.add_child(vio_title)
		for vio in vios:
			var vio_card = PanelContainer.new()
			var vs = StyleBoxFlat.new()
			vs.bg_color = Color(0.30, 0.15, 0.15, 1)
			vs.corner_radius_top_left = 6
			vs.corner_radius_top_right = 6
			vs.corner_radius_bottom_left = 6
			vs.corner_radius_bottom_right = 6
			vs.content_margin_left = 12
			vs.content_margin_right = 12
			vs.content_margin_top = 8
			vs.content_margin_bottom = 8
			vio_card.add_theme_stylebox_override("panel", vs)
			vio_card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			var vvbox = VBoxContainer.new()
			vvbox.add_theme_constant_override("separation", 4)
			vio_card.add_child(vvbox)
			var vlabel = create_label(vio.get("reason", ""), Vector2.ZERO, 13, STYLE_TEXT_PRIMARY)
			vlabel.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
			vvbox.add_child(vlabel)
			details_vbox.add_child(vio_card)

	return mc

func _get_result_title(accuracy: float) -> String:
	if accuracy >= 0.95:
		return "🏆 完美！你是合规审计专家！"
	elif accuracy >= 0.8:
		return "🎉 优秀！表现出色！"
	elif accuracy >= 0.6:
		return "👍 良好，继续保持！"
	elif accuracy >= 0.4:
		return "📚 需要加强练习"
	else:
		return "💪 请认真复习知识点后重试"

func _build_question_detail_card(idx: int, q: Dictionary) -> PanelContainer:
	var card = PanelContainer.new()
	var style = StyleBoxFlat.new()
	var correct = q.get("correct", false)
	style.bg_color = Color(0.15, 0.25, 0.18, 1) if correct else Color(0.28, 0.16, 0.16, 1)
	style.corner_radius_top_left = 6
	style.corner_radius_top_right = 6
	style.corner_radius_bottom_left = 6
	style.corner_radius_bottom_right = 6
	style.content_margin_left = 14
	style.content_margin_right = 14
	style.content_margin_top = 10
	style.content_margin_bottom = 10
	card.add_theme_stylebox_override("panel", style)
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL

	var vbox = VBoxContainer.new()
	vbox.anchor_right = 1.0
	vbox.anchor_bottom = 1.0
	vbox.add_theme_constant_override("separation", 4)
	card.add_child(vbox)

	var status_icon = "✅" if correct else "❌"
	var status_color = STYLE_SUCCESS if correct else STYLE_DANGER
	var title_text = "%s 第 %d 题 - %s" % [status_icon, idx, q.get("question_id", "")]
	var tlabel = create_label(title_text, Vector2.ZERO, 15, status_color)
	vbox.add_child(tlabel)

	var score_text = "得分：%d / %d" % [q.get("score", 0), q.get("max_score", 0)]
	var slabel = create_label(score_text, Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
	vbox.add_child(slabel)

	if not correct:
		var user_text = "你的答案：%s" % str(q.get("user_answer", ""))
		var ulabel = create_label(user_text, Vector2.ZERO, 13, STYLE_DANGER)
		ulabel.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		vbox.add_child(ulabel)
		var correct_text = "正确答案：%s" % str(q.get("correct_answer", ""))
		var clabel = create_label(correct_text, Vector2.ZERO, 13, STYLE_SUCCESS)
		clabel.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		vbox.add_child(clabel)

	return card

func _on_clear_records() -> void:
	var confirm_dialog = AcceptDialog.new()
	confirm_dialog.title = "确认清空"
	confirm_dialog.dialog_text = "确定要清空所有训练记录吗？此操作不可撤销。"
	confirm_dialog.confirmed.connect(func():
		TrainingRecordManager.clear_all_records()
		show_notification("训练记录已清空", "success", 2.0)
		get_tree().reload_current_scene()
	)
	add_child(confirm_dialog)
	confirm_dialog.popup_centered()

func _on_back_pressed() -> void:
	GameManager.change_scene("main_menu")
