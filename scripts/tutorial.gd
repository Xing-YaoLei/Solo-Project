extends Control

@onready var title_label: Label = $CenterContainer/VBox/TitleLabel
@onready var slide_title: Label = $CenterContainer/VBox/SlidePanel/SlideVBox/SlideTitle
@onready var slide_content: RichTextLabel = $CenterContainer/VBox/SlidePanel/SlideVBox/SlideContent
@onready var highlight_label: Label = $CenterContainer/VBox/SlidePanel/SlideVBox/HighlightLabel
@onready var slide_indicator: Label = $CenterContainer/VBox/SlideIndicator
@onready var prev_btn: Button = $CenterContainer/VBox/ButtonRow/PrevButton
@onready var next_btn: Button = $CenterContainer/VBox/ButtonRow/NextButton
@onready var back_btn: Button = $CenterContainer/VBox/ButtonRow/BackButton
@onready var tutorial_selector: OptionButton = $CenterContainer/VBox/TopRow/TutorialSelector

var current_tutorial: Dictionary = {}
var current_slide_index: int = 0

func _ready() -> void:
	prev_btn.pressed.connect(_on_prev)
	next_btn.pressed.connect(_on_next)
	back_btn.pressed.connect(_on_back)
	tutorial_selector.item_selected.connect(_on_tutorial_selected)

	for t in DataLoader.tutorials:
		tutorial_selector.add_item(t.get("title", "教程"), t.get("id", ""))

	var start_id: String = ScoreManager.current_tutorial_id
	var found_idx: int = -1
	for i in range(DataLoader.tutorials.size()):
		if DataLoader.tutorials[i].get("id", "") == start_id:
			found_idx = i
			break
	if found_idx >= 0:
		tutorial_selector.select(found_idx)
		_on_tutorial_selected(found_idx)
	elif DataLoader.tutorials.size() > 0:
		tutorial_selector.select(0)
		_on_tutorial_selected(0)

func _on_tutorial_selected(index: int) -> void:
	if index >= 0 and index < DataLoader.tutorials.size():
		current_tutorial = DataLoader.tutorials[index]
		current_slide_index = 0
		_show_current_slide()

func _show_current_slide() -> void:
	title_label.text = "📖 %s" % current_tutorial.get("title", "")
	var slides: Array = current_tutorial.get("slides", [])
	if current_slide_index < 0 or current_slide_index >= slides.size():
		return

	var slide: Dictionary = slides[current_slide_index]
	slide_title.text = slide.get("title", "")
	slide_content.text = slide.get("content", "")
	var hl: String = slide.get("highlight", "")
	highlight_label.text = hl
	highlight_label.visible = (hl != "")

	slide_indicator.text = "- %d / %d -" % [current_slide_index + 1, slides.size()]

	prev_btn.disabled = (current_slide_index <= 0)
	if current_slide_index >= slides.size() - 1:
		next_btn.text = "✓ 完成学习"
	else:
		next_btn.text = "下一页 →"

func _on_prev() -> void:
	if current_slide_index > 0:
		current_slide_index -= 1
		_show_current_slide()

func _on_next() -> void:
	var slides: Array = current_tutorial.get("slides", [])
	if current_slide_index < slides.size() - 1:
		current_slide_index += 1
		_show_current_slide()
	else:
		GameManager.go_to_main_menu()

func _on_back() -> void:
	GameManager.go_to_main_menu()
