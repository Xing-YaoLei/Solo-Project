extends Node

var levels: Array = []
var questions: Dictionary = {}
var materials: Dictionary = {}
var rewards: Array = []
var training_modes: Array = []
var availability: Dictionary = {}

const DATA_PATH := "user://game_data.json"
const DEFAULT_DATA := {
	"levels": [
		{
			"id": "level_1",
			"name": "初级归档训练",
			"description": "基础证据识别与模板选择",
			"difficulty": 1,
			"mode": "both",
			"game_types": ["evidence_identification", "template_selection"],
			"question_count": 4,
			"time_limit": 300,
			"unlocked": true
		},
		{
			"id": "level_2",
			"name": "中级归档训练",
			"description": "检查清单排序与抽样处理",
			"difficulty": 2,
			"mode": "both",
			"game_types": ["checklist_sorting", "sampling_processing"],
			"question_count": 4,
			"time_limit": 420,
			"unlocked": true
		},
		{
			"id": "level_3",
			"name": "高级综合训练",
			"description": "全流程综合归档训练",
			"difficulty": 3,
			"mode": "formal",
			"game_types": ["evidence_identification", "template_selection", "checklist_sorting", "sampling_processing"],
			"question_count": 8,
			"time_limit": 600,
			"unlocked": false
		}
	],
	"questions": {
		"evidence_identification": [
			{
				"id": "ei_001",
				"type": "evidence_identification",
				"title": "识别审计证据附件",
				"description": "以下哪些文件属于合规审计必须归档的证据附件？",
				"scenario": "某业务部门提交了2024年Q2合规自查材料，请识别必须归档的证据附件。",
				"options": [
					{"id": "opt1", "name": "合同扫描件.pdf", "is_evidence": true, "category": "合同文档", "description": "业务合同原件扫描件"},
					{"id": "opt2", "name": "会议纪要.docx", "is_evidence": true, "category": "会议记录", "description": "合规评审会议纪要"},
					{"id": "opt3", "name": "员工个人照片.jpg", "is_evidence": false, "category": "无关文件", "description": "员工个人证件照"},
					{"id": "opt4", "name": "审批流程截图.png", "is_evidence": true, "category": "审批记录", "description": "系统审批流程截图"},
					{"id": "opt5", "name": "出差报销单.xlsx", "is_evidence": false, "category": "财务文档", "description": "与本次审计无关的报销单"},
					{"id": "opt6", "name": "风险评估报告.pdf", "is_evidence": true, "category": "评估报告", "description": "季度风险评估报告"}
				],
				"required_permission": "evidence_review",
				"score": 25,
				"hint": "证据附件应与审计事项直接相关，并能证明合规状态"
			},
			{
				"id": "ei_002",
				"type": "evidence_identification",
				"title": "证据关联性判断",
				"description": "从给定文件中选出与数据安全审计相关的证据",
				"scenario": "数据安全专项审计，请筛选与个人信息保护相关的证据材料。",
				"options": [
					{"id": "opt1", "name": "隐私政策.docx", "is_evidence": true, "category": "政策文档", "description": "用户隐私政策文本"},
					{"id": "opt2", "name": "数据库审计日志.csv", "is_evidence": true, "category": "系统日志", "description": "数据库访问审计日志"},
					{"id": "opt3", "name": "产品宣传册.pdf", "is_evidence": false, "category": "市场物料", "description": "产品营销宣传材料"},
					{"id": "opt4", "name": "数据加密配置截图.png", "is_evidence": true, "category": "技术配置", "description": "数据加密方案配置截图"},
					{"id": "opt5", "name": "办公区域平面图.pdf", "is_evidence": false, "category": "行政文档", "description": "办公区布局图"}
				],
				"required_permission": "evidence_review",
				"score": 25,
				"hint": "关注数据处理、访问控制、加密保护等方面的文档"
			}
		],
		"template_selection": [
			{
				"id": "ts_001",
				"type": "template_selection",
				"title": "通报模板选择",
				"description": "根据违规类型选择合适的通报模板",
				"scenario": "发现某部门存在未按规定保存客户交易记录的情况，已造成一般合规风险。",
				"violation_level": "general",
				"violation_type": "record_keeping",
				"options": [
					{"id": "tpl1", "name": "严重违规通报模板", "description": "适用于重大合规风险、涉及监管处罚的情形", "appropriate": false, "reason": "该违规属于一般风险，不适用严重违规模板"},
					{"id": "tpl2", "name": "一般合规提醒模板", "description": "适用于一般性合规问题的提醒与整改通知", "appropriate": true, "reason": "与违规级别和类型匹配"},
					{"id": "tpl3", "name": "刑事移送通报模板", "description": "适用于涉嫌违法犯罪需移送司法机关的情形", "appropriate": false, "reason": "未达到刑事移送标准"},
					{"id": "tpl4", "name": "表扬表彰通报模板", "description": "适用于合规表现优秀的表彰情形", "appropriate": false, "reason": "属于违规情形，不适用表扬模板"}
				],
				"required_permission": "template_usage",
				"score": 25,
				"hint": "根据违规等级和类型匹配对应级别的通报模板"
			},
			{
				"id": "ts_002",
				"type": "template_selection",
				"title": "整改通知模板匹配",
				"description": "选择适合监管检查发现问题的整改通知模板",
				"scenario": "监管机构现场检查发现多项内部控制缺陷，要求限期整改并书面回复。",
				"violation_level": "serious",
				"violation_type": "regulatory_findings",
				"options": [
					{"id": "tpl1", "name": "监管检查整改通知书", "description": "专门用于监管检查发现问题的正式整改通知", "appropriate": true, "reason": "完全匹配监管检查整改场景"},
					{"id": "tpl2", "name": "日常合规提示函", "description": "用于日常合规管理中的轻微问题提示", "appropriate": false, "reason": "级别不够，不适用于监管检查整改"},
					{"id": "tpl3", "name": "内部审计报告模板", "description": "用于内部审计部门出具审计报告", "appropriate": false, "reason": "此为整改通知场景，不是出具审计报告"}
				],
				"required_permission": "template_usage",
				"score": 25,
				"hint": "监管检查发现的问题需要正式的整改通知模板"
			}
		],
		"checklist_sorting": [
			{
				"id": "cs_001",
				"type": "checklist_sorting",
				"title": "归档流程排序",
				"description": "请按正确顺序排列合规审计证据归档工作流程",
				"scenario": "审计项目已完成，需将证据材料按规范流程归档。",
				"items": [
					{"id": "step1", "text": "证据材料收集与完整性核对", "order": 1, "description": "确认所有证据材料齐全"},
					{"id": "step2", "text": "证据分类与编号", "order": 2, "description": "按证据类型分类并赋予唯一编号"},
					{"id": "step3", "text": "密级与保管期限判定", "order": 3, "description": "确定每份证据的保密级别和保存期限"},
					{"id": "step4", "text": "电子文件格式转换与病毒扫描", "order": 4, "description": "统一格式并进行安全检测"},
					{"id": "step5", "text": "归档目录编制", "order": 5, "description": "编制详细的归档目录和索引"},
					{"id": "step6", "text": "双签审批与归档移交", "order": 6, "description": "审计负责人与档案管理员双签确认后移交"}
				],
				"required_permission": "archive_management",
				"score": 25,
				"hint": "从收集到最终移交，逻辑上从准备到完成递进"
			},
			{
				"id": "cs_002",
				"type": "checklist_sorting",
				"title": "审计整改检查排序",
				"description": "按正确顺序排列审计整改跟踪检查流程",
				"scenario": "审计报告出具后，需对整改情况进行跟踪检查。",
				"items": [
					{"id": "step1", "text": "整改方案审核", "order": 1, "description": "审核被审计单位提交的整改方案"},
					{"id": "step2", "text": "整改证据收集", "order": 2, "description": "收集整改措施执行的相关证据"},
					{"id": "step3", "text": "整改证据验证", "order": 3, "description": "核实整改证据的真实性和充分性"},
					{"id": "step4", "text": "整改效果评估", "order": 4, "description": "评估整改措施是否有效消除风险"},
					{"id": "step5", "text": "整改结果确认与销号", "order": 5, "description": "确认整改完成并进行问题销号"}
				],
				"required_permission": "archive_management",
				"score": 25,
				"hint": "从方案审核开始，到最终确认销号结束"
			}
		],
		"sampling_processing": [
			{
				"id": "sp_001",
				"type": "sampling_processing",
				"title": "抽样记录异常处理",
				"description": "处理审计抽样中发现的异常记录",
				"scenario": "对2024年Q1销售合同进行合规抽样检查，样本量50份，发现以下异常情况。",
				"sample_size": 50,
				"population_size": 500,
				"records": [
					{"id": "rec1", "type": "missing_signature", "description": "合同缺少法定代表人签字", "severity": "high", "count": 3, "action_required": "expand_sample", "action_description": "扩大抽样范围并补充取证"},
					{"id": "rec2", "type": "date_anomaly", "description": "合同签订日期晚于履行日期", "severity": "medium", "count": 5, "action_required": "verify_explanation", "action_description": "核实业务部门解释并记录"},
					{"id": "rec3", "type": "incomplete_attachment", "description": "缺少必要的附件材料", "severity": "low", "count": 8, "action_required": "supplement_materials", "action_description": "要求补充缺失附件材料"},
					{"id": "rec4", "type": "normal", "description": "合同合规，无异常", "severity": "none", "count": 34, "action_required": "no_action", "action_description": "记录归档即可"}
				],
				"required_permission": "sampling_audit",
				"score": 25,
				"hint": "根据异常严重程度选择不同的处理方式，严重异常需扩大抽样"
			},
			{
				"id": "sp_002",
				"type": "sampling_processing",
				"title": "抽样方法选择与记录",
				"description": "为不同审计场景选择合适的抽样方法并处理记录",
				"scenario": "针对以下三个审计场景选择抽样方法：",
				"scenarios": [
					{
						"id": "sc1",
						"name": "大额现金交易核查",
						"description": "核查单笔金额超过100万的现金交易",
						"sampling_method": "judgmental",
						"method_name": "判断抽样",
						"reason": "金额重大，应选取所有大额交易进行检查",
						"options": [
							{"id": "m1", "method": "random", "name": "随机抽样", "correct": false, "feedback": "大额交易需要针对性检查，随机抽样可能遗漏"},
							{"id": "m2", "method": "judgmental", "name": "判断抽样", "correct": true, "feedback": "正确，根据重要性原则选取大额交易"},
							{"id": "m3", "method": "systematic", "name": "系统抽样", "correct": false, "feedback": "系统抽样不适用于重点项目核查"}
						]
					},
					{
						"id": "sc2",
						"name": "日常报销合规性检查",
						"description": "全年5000笔报销单据的合规性抽查",
						"sampling_method": "random",
						"method_name": "随机抽样",
						"reason": "总体规模大且同质性强，适合随机抽样",
						"options": [
							{"id": "m1", "method": "random", "name": "随机抽样", "correct": true, "feedback": "正确，大样本同质性场景适合随机抽样"},
							{"id": "m2", "method": "judgmental", "name": "判断抽样", "correct": false, "feedback": "判断抽样主观性强，大样本场景效率低"},
							{"id": "m3", "method": "block", "name": "整群抽样", "correct": false, "feedback": "整群抽样可能产生抽样偏差"}
						]
					}
				],
				"required_permission": "sampling_audit",
				"score": 25,
				"hint": "根据审计目标、总体特征和重要性水平选择抽样方法"
			}
		]
	},
	"materials": {
		"evidence_categories": [
			{"id": "contract", "name": "合同文档", "description": "各类业务合同、协议"},
			{"id": "meeting", "name": "会议记录", "description": "会议纪要、决策记录"},
			{"id": "approval", "name": "审批记录", "description": "审批流程、签字记录"},
			{"id": "report", "name": "评估报告", "description": "风险评估、审计报告"},
			{"id": "log", "name": "系统日志", "description": "操作日志、审计日志"},
			{"id": "policy", "name": "政策文档", "description": "规章制度、政策文件"}
		],
		"templates": [
			{"id": "serious_violation", "name": "严重违规通报模板", "description": "适用于重大合规风险"},
			{"id": "general_reminder", "name": "一般合规提醒模板", "description": "适用于一般性合规问题"},
			{"id": "criminal_transfer", "name": "刑事移送通报模板", "description": "涉法涉诉案件移送"},
			{"id": "regulatory_rectification", "name": "监管检查整改通知书", "description": "监管检查整改专用"}
		]
	},
	"rewards": [
		{"id": "badge_bronze", "name": "合规新手徽章", "description": "完成首次训练", "condition": "first_completion", "icon": "🥉"},
		{"id": "badge_silver", "name": "合规专员徽章", "description": "准确率达到80%", "condition": "accuracy_80", "icon": "🥈"},
		{"id": "badge_gold", "name": "合规专家徽章", "description": "准确率达到95%", "condition": "accuracy_95", "icon": "🥇"},
		{"id": "badge_perfect", "name": "完美归档徽章", "description": "单局零失误完成", "condition": "perfect_run", "icon": "💎"}
	],
	"training_modes": [
		{"id": "formal", "name": "正式训练", "description": "有时间限制，成绩计入正式记录", "has_time_limit": true, "record_score": true},
		{"id": "practice", "name": "自由练习", "description": "无时间限制，不计入正式成绩，可查看提示", "has_time_limit": false, "record_score": false}
	],
	"availability": {
		"start_time": "",
		"end_time": "",
		"enabled_modes": ["formal", "practice"],
		"maintenance_message": ""
	}
}

func _ready() -> void:
	load_all_data()

func load_all_data() -> void:
	var dir := DirAccess.open("user://")
	if dir.file_exists("game_data.json"):
		var file := FileAccess.open(DATA_PATH, FileAccess.READ)
		if file:
			var data := JSON.parse_string(file.get_as_text())
			file.close()
			if data and data is Dictionary:
				levels = data.get("levels", DEFAULT_DATA["levels"])
				questions = data.get("questions", DEFAULT_DATA["questions"])
				materials = data.get("materials", DEFAULT_DATA["materials"])
				rewards = data.get("rewards", DEFAULT_DATA["rewards"])
				training_modes = data.get("training_modes", DEFAULT_DATA["training_modes"])
				availability = data.get("availability", DEFAULT_DATA["availability"])
				return
	save_default_data()

func save_default_data() -> void:
	levels = DEFAULT_DATA["levels"].duplicate(true)
	questions = DEFAULT_DATA["questions"].duplicate(true)
	materials = DEFAULT_DATA["materials"].duplicate(true)
	rewards = DEFAULT_DATA["rewards"].duplicate(true)
	training_modes = DEFAULT_DATA["training_modes"].duplicate(true)
	availability = DEFAULT_DATA["availability"].duplicate(true)
	save_all_data()

func save_all_data() -> void:
	var data := {
		"levels": levels,
		"questions": questions,
		"materials": materials,
		"rewards": rewards,
		"training_modes": training_modes,
		"availability": availability
	}
	var file := FileAccess.open(DATA_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(data))
		file.close()

func get_questions_by_type(game_type: String) -> Array:
	return questions.get(game_type, [])

func get_level_by_id(level_id: String) -> Dictionary:
	for level in levels:
		if level.get("id") == level_id:
			return level
	return {}

func is_level_available(level_id: String, mode: String) -> bool:
	var level = get_level_by_id(level_id)
	if level.is_empty():
		return false
	if not level.get("unlocked", false):
		return false
	var level_mode = level.get("mode", "both")
	if level_mode != "both" and level_mode != mode:
		return false
	if availability.has("start_time") and availability["start_time"] != "":
		if Time.get_unix_time_from_system() < Time.datetimestring_to_unix_time(availability["start_time"]):
			return false
	if availability.has("end_time") and availability["end_time"] != "":
		if Time.get_unix_time_from_system() > Time.datetimestring_to_unix_time(availability["end_time"]):
			return false
	if availability.has("enabled_modes"):
		if not mode in availability["enabled_modes"]:
			return false
	return true

func get_available_levels(mode: String) -> Array:
	var result: Array = []
	for level in levels:
		if is_level_available(level["id"], mode):
			result.append(level)
	return result
