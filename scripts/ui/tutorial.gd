extends Control

@onready var title_label: Label = $Panel/MarginContainer/VBoxContainer/ContentContainer/TitleLabel
@onready var description_label: Label = $Panel/MarginContainer/VBoxContainer/ContentContainer/DescriptionLabel
@onready var illustration_label: Label = $Panel/MarginContainer/VBoxContainer/ContentContainer/IllustrationContainer/IllustrationLabel
@onready var prev_button: Button = $Panel/MarginContainer/VBoxContainer/ButtonRow/PrevButton
@onready var next_button: Button = $Panel/MarginContainer/VBoxContainer/ButtonRow/NextButton
@onready var skip_button: Button = $Panel/MarginContainer/VBoxContainer/ButtonRow/SkipButton
@onready var progress_container: HBoxContainer = $Panel/MarginContainer/VBoxContainer/ProgressContainer

var current_step: int = 0
var tutorial_steps: Array = []

func _ready():
	AudioManager.play_sfx("click")
	_initialize_steps()
	_update_progress()
	_show_step(current_step)
	
	prev_button.pressed.connect(_on_prev_pressed)
	next_button.pressed.connect(_on_next_pressed)
	skip_button.pressed.connect(_on_skip_pressed)

func _initialize_steps():
	tutorial_steps = [
		{
			"title": "欢迎来到价格训练营！",
			"description": "在这个游戏中，你将扮演一名酒店前台员工，需要根据各种价格规则快速准确地计算房价。\n\n正确的计算可以提升你的转化率排名，让我们开始学习吧！",
			"illustration": "🏨📊\n\n价格训练营\n\n学习价格规则，成为定价高手！"
		},
		{
			"title": "基础价格计算",
			"description": "每个套餐都有一个基础价格。\n\n例如：\n- 标准间：¥298/晚\n- 豪华间：¥598/晚\n- 家庭套房：¥888/晚\n\n总价 = 基础价格 × 入住天数",
			"illustration": "💰\n\n基础价格 × 天数 = 总价\n\n标准间 ¥298 × 2晚 = ¥596"
		},
		{
			"title": "周末加价规则",
			"description": "周五（周五）和周六（周六）入住需要加价20%。\n\n计算方式：\n价格 = 基础价格 × 1.2\n\n提示：注意查看入住日期是星期几！",
			"illustration": "📅\n\n周末加价 20%\n\n周六入住豪华间：\n¥598 × 1.2 = ¥717.6"
		},
		{
			"title": "长住优惠规则",
			"description": "连续入住3天及以上可以享受8折优惠。\n\n计算方式：\n价格 = 基础价格 × 0.8\n\n优惠可以与其他规则叠加使用！",
			"illustration": "✨\n\n长住3天以上 8折\n\n入住3天标准间：\n¥298 × 3 × 0.8 = ¥715.2"
		},
		{
			"title": "季节与节假日",
			"description": "不同时间段有不同的价格调整：\n\n- 旺季（7-8月）：加价50%\n- 节假日（国庆等）：加价100%\n- 淡季（1-2月）：7折优惠\n\n这些规则会和其他规则叠加！",
			"illustration": "🌞❄️🎊\n\n旺季 +50%\n节假日 +100%\n淡季 7折"
		},
		{
			"title": "特殊套餐优惠",
			"description": "某些套餐有专属优惠：\n\n- 家庭套房：立减¥100\n- 浪漫套餐（周日-周四）：立减¥200\n\n注意优惠条件，不要错过！",
			"illustration": "🎁\n\n家庭套房 -¥100\n浪漫套餐（平日）-¥200"
		},
		{
			"title": "规则叠加顺序",
			"description": "当多个规则同时适用时，按照优先级依次计算：\n\n1. 节假日加价（最高优先级）\n2. 旺季加价\n3. 淡季优惠\n4. 浪漫套餐平日特惠\n5. 周末加价\n6. 家庭套餐优惠\n7. 长住优惠（最低优先级）",
			"illustration": "🔢\n\n按优先级依次计算\n\n优先级越高，越早计算"
		},
		{
			"title": "操作说明",
			"description": "游戏操作：\n1. 仔细阅读顾客订单\n2. 选择正确的套餐类型\n3. 选择入住日期\n4. 设置入住天数和人数\n5. 提交你的计算结果\n\n正确率和速度都会影响你的得分！",
			"illustration": "🎮\n\n选择套餐 → 选择日期\n→ 设置天数 → 提交"
		},
		{
			"title": "准备开始！",
			"description": "你已经掌握了所有价格规则！\n\n现在进入第一个训练关卡，尝试完成订单吧。\n\n记住：仔细计算，准确率比速度更重要！",
			"illustration": "🚀\n\n准备好接受挑战了吗？\n\n点击'开始'进入训练！"
		}
	]

func _update_progress():
	_clear_children(progress_container)
	
	var total = len(tutorial_steps)
	for i in range(total):
		var dot = ColorRect.new()
		dot.custom_minimum_size = Vector2(12, 12)
		if i == current_step:
			dot.color = Color(0.2, 0.6, 0.86, 1)
		elif i < current_step:
			dot.color = Color(0.18, 0.8, 0.44, 1)
		else:
			dot.color = Color(0.4, 0.4, 0.4, 1)
		
		dot.corner_radius_top_left = 6
		dot.corner_radius_top_right = 6
		dot.corner_radius_bottom_right = 6
		dot.corner_radius_bottom_left = 6
		
		progress_container.add_child(dot)

func _show_step(step_index: int):
	if step_index < 0 or step_index >= len(tutorial_steps):
		return
	
	var step = tutorial_steps[step_index]
	title_label.text = step["title"]
	description_label.text = step["description"]
	illustration_label.text = step["illustration"]
	
	prev_button.disabled = (step_index == 0)
	
	if step_index == len(tutorial_steps) - 1:
		next_button.text = "开始训练"
	else:
		next_button.text = "下一步"

func _clear_children(container: Node):
	for child in container.get_children():
		container.remove_child(child)
		child.queue_free()

func _on_prev_pressed():
	AudioManager.play_sfx("click")
	if current_step > 0:
		current_step -= 1
		_show_step(current_step)
		_update_progress()

func _on_next_pressed():
	AudioManager.play_sfx("click")
	if current_step < len(tutorial_steps) - 1:
		current_step += 1
		_show_step(current_step)
		_update_progress()
	else:
		_complete_tutorial()

func _on_skip_pressed():
	AudioManager.play_sfx("click")
	_complete_tutorial()

func _complete_tutorial():
	SettingsManager.set_show_tutorial(false)
	SettingsManager.save_settings()
	
	var training_levels = GameData.get_training_levels()
	if not training_levels.is_empty():
		var first_level = training_levels[0]
		_start_level(first_level.id)
		return
	
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")

func _start_level(level_id: String):
	if GameManager.start_game(level_id):
		get_tree().change_scene_to_file("res://scenes/game_main.tscn")
		return
	
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
