import type { TutorialStep } from '../game/types'

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: '欢迎来到康复中心！',
    description: '这是一款康复中心医保结算经营模拟游戏。你将学习如何管理康复中心、安排治疗、处理医保结算。让我们从治疗日历开始吧！',
    targetElement: 'calendar',
    action: 'next'
  },
  {
    id: 'calendar_intro',
    title: '治疗日历',
    description: '治疗日历是你安排每日工作的核心工具。每个格子代表一个时间段，你可以在这里安排患者的治疗项目。点击日历查看今日安排。',
    targetElement: 'calendar_grid',
    highlightArea: { x: 640, y: 100, width: 600, height: 400 },
    action: 'observe'
  },
  {
    id: 'task_list',
    title: '任务列表',
    description: '左侧显示今日待处理的患者任务。每个任务包含患者信息、所需治疗和线索。点击任务可以查看详情。',
    targetElement: 'task_list',
    highlightArea: { x: 40, y: 100, width: 560, height: 400 },
    action: 'observe'
  },
  {
    id: 'accept_task',
    title: '接受任务',
    description: '查看任务详情后，点击"接受任务"按钮开始处理。接受后你需要为患者安排合适的治疗。',
    targetElement: 'accept_btn',
    action: 'next'
  },
  {
    id: 'check_clues',
    title: '观察线索',
    description: '每个患者都有隐藏的线索，包括症状、病史、医保信息等。仔细观察线索有助于做出正确的治疗决策，避免医保拒付。',
    targetElement: 'clue_panel',
    action: 'next'
  },
  {
    id: 'schedule_treatment',
    title: '安排治疗',
    description: '根据患者需要，选择合适的治疗项目和时间段。注意：治疗需要使用对应的器械，且要遵守医保规定。',
    targetElement: 'treatment_selector',
    action: 'next'
  },
  {
    id: 'insurance_check',
    title: '医保结算',
    description: '治疗完成后会进行医保结算。部分项目不在医保范围内，或者报销比例不同。错误的选择可能导致医保拒付，影响你的收益和声誉。',
    targetElement: 'insurance_panel',
    action: 'next'
  },
  {
    id: 'instrument_status',
    title: '器械管理',
    description: '右下角显示器械状态。频繁使用会降低器械耐久度，需要定期维护。损坏的器械无法使用。',
    targetElement: 'instrument_panel',
    action: 'next'
  },
  {
    id: 'complete',
    title: '准备好了！',
    description: '你已经了解了基本操作。记住：合理安排治疗、仔细核对医保政策、维护好器械，你的康复中心就能蒸蒸日上！开始游戏吧！',
    targetElement: 'start_btn',
    action: 'click'
  }
]
