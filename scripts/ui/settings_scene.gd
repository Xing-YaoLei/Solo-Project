extends Control

@onready var back_button: Button = $TopBar/BackButton
@onready var reset_button: Button = $TopBar/ResetButton
@onready var sfx_slider: HSlider = $Content/AudioSection/SFXSlider
@onready var music_slider: HSlider = $Content/AudioSection/MusicSlider
@onready var vibration_checkbox: CheckBox = $Content/AudioSection/VibrationCheckbox
@onready var sfx_value_label: Label = $Content/AudioSection/SFXValueLabel
@onready var music_value_label: Label = $Content/AudioSection/MusicValueLabel
@onready var inventory_sound_checkbox: CheckBox = $Content/AudioSection/InventorySoundCheckbox
@onready var low_stock_warning_checkbox: CheckBox = $Content/AudioSection/LowStockWarningCheckbox
@onready var animation_option: OptionButton = $Content/VisualSection/AnimationOption
@onready var particle_effect_checkbox: CheckBox = $Content/VisualSection/ParticleEffectCheckbox
@onready var screen_shake_checkbox: CheckBox = $Content/VisualSection/ScreenShakeCheckbox
@onready var auto_save_checkbox: CheckBox = $Content/GameplaySection/AutoSaveCheckbox
@onready var show_hints_checkbox: CheckBox = $Content/GameplaySection/ShowHintsCheckbox
@onready var language_option: OptionButton = $Content/GameplaySection/LanguageOption
@onready var player_name_lineedit: LineEdit = $Content/GameplaySection/PlayerNameLineEdit

func _ready():
	_setup_connections()
	_load_settings()

func _setup_connections() -> void:
	back_button.pressed.connect(_on_back_pressed)
	reset_button.pressed.connect(_on_reset_pressed)
	sfx_slider.value_changed.connect(_on_sfx_volume_changed)
	music_slider.value_changed.connect(_on_music_volume_changed)
	vibration_checkbox.toggled.connect(_on_vibration_toggled)
	inventory_sound_checkbox.toggled.connect(_on_inventory_sound_toggled)
	low_stock_warning_checkbox.toggled.connect(_on_low_stock_warning_toggled)
	animation_option.item_selected.connect(_on_animation_changed)
	particle_effect_checkbox.toggled.connect(_on_particle_effect_toggled)
	screen_shake_checkbox.toggled.connect(_on_screen_shake_toggled)
	auto_save_checkbox.toggled.connect(_on_auto_save_toggled)
	show_hints_checkbox.toggled.connect(_on_show_hints_toggled)
	language_option.item_selected.connect(_on_language_changed)
	player_name_lineedit.text_changed.connect(_on_player_name_changed)

func _load_settings() -> void:
	sfx_slider.value = SettingsManager.sfx_volume * 100
	music_slider.value = SettingsManager.music_volume * 100
	_update_volume_labels()

	vibration_checkbox.button_pressed = SettingsManager.vibration_enabled
	inventory_sound_checkbox.button_pressed = SettingsManager.inventory_sound_enabled
	low_stock_warning_checkbox.button_pressed = SettingsManager.low_stock_warning_enabled

	animation_option.clear()
	animation_option.add_item("关闭")
	animation_option.add_item("低")
	animation_option.add_item("中等")
	animation_option.add_item("高")
	animation_option.select(SettingsManager.animation_intensity)

	particle_effect_checkbox.button_pressed = SettingsManager.particle_effects_enabled
	screen_shake_checkbox.button_pressed = SettingsManager.screen_shake_enabled

	auto_save_checkbox.button_pressed = SettingsManager.auto_save_enabled
	show_hints_checkbox.button_pressed = SettingsManager.show_hints_enabled

	language_option.clear()
	language_option.add_item("简体中文")
	language_option.add_item("English")
	language_option.select(SettingsManager.language)

	player_name_lineedit.text = GameManager.player_data.player_name if GameManager.player_data else "玩家"

func _update_volume_labels() -> void:
	sfx_value_label.text = "%d%%" % int(sfx_slider.value)
	music_value_label.text = "%d%%" % int(music_slider.value)

func _on_sfx_volume_changed(p_value: float) -> void:
	SettingsManager.sfx_volume = p_value / 100.0
	_update_volume_labels()
	AudioManager.update_mix()
	SettingsManager.save_settings()

func _on_music_volume_changed(p_value: float) -> void:
	SettingsManager.music_volume = p_value / 100.0
	_update_volume_labels()
	AudioManager.update_mix()
	SettingsManager.save_settings()

func _on_vibration_toggled(p_enabled: bool) -> void:
	SettingsManager.vibration_enabled = p_enabled
	SettingsManager.save_settings()
	AudioManager.play_click()

func _on_inventory_sound_toggled(p_enabled: bool) -> void:
	SettingsManager.inventory_sound_enabled = p_enabled
	SettingsManager.save_settings()
	AudioManager.play_click()

func _on_low_stock_warning_toggled(p_enabled: bool) -> void:
	SettingsManager.low_stock_warning_enabled = p_enabled
	SettingsManager.save_settings()
	AudioManager.play_click()

func _on_animation_changed(p_index: int) -> void:
	SettingsManager.animation_intensity = p_index
	SettingsManager.save_settings()
	AudioManager.play_click()

func _on_particle_effect_toggled(p_enabled: bool) -> void:
	SettingsManager.particle_effects_enabled = p_enabled
	SettingsManager.save_settings()
	AudioManager.play_click()

func _on_screen_shake_toggled(p_enabled: bool) -> void:
	SettingsManager.screen_shake_enabled = p_enabled
	SettingsManager.save_settings()
	AudioManager.play_click()

func _on_auto_save_toggled(p_enabled: bool) -> void:
	SettingsManager.auto_save_enabled = p_enabled
	SettingsManager.save_settings()
	AudioManager.play_click()

func _on_show_hints_toggled(p_enabled: bool) -> void:
	SettingsManager.show_hints_enabled = p_enabled
	SettingsManager.save_settings()
	AudioManager.play_click()

func _on_language_changed(p_index: int) -> void:
	SettingsManager.language = p_index
	SettingsManager.save_settings()
	AudioManager.play_click()

func _on_player_name_changed(p_text: String) -> void:
	if GameManager.player_data:
		GameManager.player_data.player_name = p_text.strip_edges()
		GameManager.save_player_data()

func _on_reset_pressed() -> void:
	AudioManager.play_click()
	SettingsManager.reset_to_default()
	_load_settings()
	AudioManager.play_sfx(AudioManager.SFXType.SUCCESS)

func _on_back_pressed() -> void:
	AudioManager.play_click()
	GameManager.save_player_data()
	GameManager.go_to_main_menu()
