extends Control

signal evidence_loaded
signal all_evidence_viewed

var _evidence_list: Array[Dictionary] = []
var _viewed_indices: Dictionary = {}
var _current_index: int = -1
var _loading := false

@onready var _title_label: Label = $VBoxContainer/TitleBar/TitleLabel
@onready var _content_label: Label = $VBoxContainer/ContentBox/ContentLabel
@onready var _type_icon: Label = $VBoxContainer/TitleBar/TypeIcon
@onready var _progress_label: Label = $VBoxContainer/TitleBar/ProgressLabel
@onready var _loading_indicator: PanelContainer = $VBoxContainer/ContentBox/LoadingIndicator
@onready var _prev_btn: Button = $VBoxContainer/NavButtons/PrevButton
@onready var _next_btn: Button = $VBoxContainer/NavButtons/NextButton

func setup(evidence: Array[Dictionary]) -> void:
	_evidence_list = evidence
	_viewed_indices.clear()
	_current_index = -1
	if evidence.size() > 0:
		_show_evidence(0)

func _show_evidence(index: int) -> void:
	if index < 0 or index >= _evidence_list.size():
		return
	_current_index = index
	var item: Dictionary = _evidence_list[index]
	_title_label.text = item.get("title", "")
	_type_icon.text = _type_icon_text(item.get("type", "document"))
	_progress_label.text = "%d / %d" % [index + 1, _evidence_list.size()]
	_loading = true
	_loading_indicator.visible = true
	_content_label.text = ""
	await get_tree().create_timer(0.3).timeout
	_content_label.text = item.get("description", "")
	_loading_indicator.visible = false
	_loading = false
	_viewed_indices[index] = true
	evidence_loaded.emit()
	if _viewed_indices.size() == _evidence_list.size():
		all_evidence_viewed.emit()
	_update_nav()

func _type_icon_text(type: String) -> String:
	match type:
		"photo": return "[IMG]"
		"audio": return "[AUD]"
		"document": return "[DOC]"
		_: return "[?]"

func _update_nav() -> void:
	_prev_btn.disabled = _current_index <= 0
	_next_btn.disabled = _current_index >= _evidence_list.size() - 1

func _on_prev_button_pressed() -> void:
	if _current_index > 0:
		_show_evidence(_current_index - 1)

func _on_next_button_pressed() -> void:
	if _current_index < _evidence_list.size() - 1:
		_show_evidence(_current_index + 1)

func all_viewed() -> bool:
	return _viewed_indices.size() >= _evidence_list.size()
