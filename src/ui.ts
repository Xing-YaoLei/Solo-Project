import type {
  Homework,
  Chapter,
  GradeFeedback,
  ReminderRule,
  ChoiceResult,
  GameStats,
  FailureRecord,
  GameScreen
} from './types';
import { GRADE_LABELS, RULE_LABELS } from './models';

interface UIState {
  screen: GameScreen;
  currentHomework: Homework | null;
  selectedGrade: GradeFeedback | null;
  selectedRules: ReminderRule[];
  selectedChapterId: string | null;
  timeRemaining: number;
  totalTime: number;
  gradedCount: number;
  totalHomeworks: number;
  lastResult: ChoiceResult | null;
  stats: GameStats;
  reviewHomeworks: Homework[];
  reviewResults: ChoiceResult[];
}

type UIAction =
  | { type: 'SET_SCREEN'; screen: GameScreen }
  | { type: 'START_ROUND'; homework: Homework; timeLimit: number; total: number }
  | { type: 'SELECT_GRADE'; grade: GradeFeedback }
  | { type: 'TOGGLE_RULE'; rule: ReminderRule }
  | { type: 'SELECT_CHAPTER'; chapterId: string }
  | { type: 'TICK'; dt: number }
  | { type: 'SUBMIT_RESULT'; result: ChoiceResult; gradedCount: number }
  | { type: 'SET_STATS'; stats: GameStats }
  | { type: 'START_REVIEW'; homeworks: Homework[]; results: ChoiceResult[] }
  | { type: 'LOAD_FAILURE'; record: FailureRecord };

export class UIManager {
  private root: HTMLElement;
  private state: UIState;
  private onSubmitCallback: ((grade: GradeFeedback | null, rules: ReminderRule[], chapterId: string | null) => void) | null = null;
  private onTimeoutCallback: (() => void) | null = null;
  private onStartChapterCallback: ((chapterId: string) => void) | null = null;
  private onReviewCallback: (() => void) | null = null;
  private onBackCallback: (() => void) | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.state = {
      screen: 'menu',
      currentHomework: null,
      selectedGrade: null,
      selectedRules: [],
      selectedChapterId: null,
      timeRemaining: 0,
      totalTime: 30,
      gradedCount: 0,
      totalHomeworks: 0,
      lastResult: null,
      stats: {
        totalAttempts: 0,
        correctCount: 0,
        completionRate: 0,
        averageTimePerHomework: 0,
        chapterStats: new Map(),
        recentFailures: [],
        errorBreakdown: { gradeErrors: 0, ruleErrors: 0, chapterErrors: 0 }
      },
      reviewHomeworks: [],
      reviewResults: []
    };
    this.render();
  }

  private dispatch(action: UIAction): void {
    this.state = this.reduce(this.state, action);
    this.render();

    if (action.type === 'TICK' && this.state.timeRemaining <= 0 && this.onTimeoutCallback) {
      this.onTimeoutCallback();
    }
  }

  private reduce(state: UIState, action: UIAction): UIState {
    switch (action.type) {
      case 'SET_SCREEN':
        return { ...state, screen: action.screen };
      case 'START_ROUND':
        return {
          ...state,
          screen: 'playing',
          currentHomework: action.homework,
          selectedGrade: null,
          selectedRules: [],
          selectedChapterId: null,
          timeRemaining: action.timeLimit,
          totalTime: action.timeLimit,
          totalHomeworks: action.total,
          lastResult: null
        };
      case 'SELECT_GRADE':
        return { ...state, selectedGrade: action.grade };
      case 'TOGGLE_RULE': {
        const has = state.selectedRules.includes(action.rule);
        return {
          ...state,
          selectedRules: has
            ? state.selectedRules.filter(r => r !== action.rule)
            : [...state.selectedRules, action.rule]
        };
      }
      case 'SELECT_CHAPTER':
        return { ...state, selectedChapterId: action.chapterId };
      case 'TICK':
        return { ...state, timeRemaining: Math.max(0, state.timeRemaining - action.dt) };
      case 'SUBMIT_RESULT':
        return {
          ...state,
          lastResult: action.result,
          gradedCount: action.gradedCount,
          screen: action.gradedCount >= state.totalHomeworks ? 'result' : state.screen
        };
      case 'SET_STATS':
        return { ...state, stats: action.stats };
      case 'START_REVIEW':
        return {
          ...state,
          screen: 'review',
          reviewHomeworks: action.homeworks,
          reviewResults: action.results
        };
      case 'LOAD_FAILURE': {
        const snap = action.record.replaySnapshot;
        return {
          ...state,
          screen: 'replay',
          reviewHomeworks: snap.homeworks,
          reviewResults: snap.playerChoices
        };
      }
      default:
        return state;
    }
  }

  setOnSubmit(cb: (grade: GradeFeedback | null, rules: ReminderRule[], chapterId: string | null) => void): void {
    this.onSubmitCallback = cb;
  }
  setOnTimeout(cb: () => void): void { this.onTimeoutCallback = cb; }
  setOnStartChapter(cb: (chapterId: string) => void): void { this.onStartChapterCallback = cb; }
  setOnReview(cb: () => void): void { this.onReviewCallback = cb; }
  setOnBack(cb: () => void): void { this.onBackCallback = cb; }

  startRound(hw: Homework, _chapterId: string, timeLimit: number, total: number): void {
    this.dispatch({ type: 'START_ROUND', homework: hw, timeLimit, total });
  }
  submitResult(result: ChoiceResult, gradedCount: number): void {
    this.dispatch({ type: 'SUBMIT_RESULT', result, gradedCount });
  }
  tick(dt: number): void { this.dispatch({ type: 'TICK', dt }); }
  setStats(stats: GameStats): void { this.dispatch({ type: 'SET_STATS', stats }); }
  startReview(hws: Homework[], results: ChoiceResult[]): void {
    this.dispatch({ type: 'START_REVIEW', homeworks: hws, results });
  }
  loadFailure(record: FailureRecord): void { this.dispatch({ type: 'LOAD_FAILURE', record }); }

  private render(): void {
    this.root.innerHTML = '';
    this.root.style.pointerEvents = 'none';

    const container = document.createElement('div');
    container.style.cssText = 'position:absolute;inset:0;pointer-events:auto;';

    switch (this.state.screen) {
      case 'menu': container.appendChild(this.renderMenu()); break;
      case 'playing': container.appendChild(this.renderPlaying()); break;
      case 'result': container.appendChild(this.renderResult()); break;
      case 'stats': container.appendChild(this.renderStats()); break;
      case 'review': container.appendChild(this.renderReview()); break;
      case 'replay': container.appendChild(this.renderReplay()); break;
    }
    this.root.appendChild(container);
  }

  private styleBtn = (el: HTMLElement, primary = false): void => {
    el.style.cssText = `
      padding: 12px 24px; font-size: 16px; font-weight: 600; border: none; border-radius: 10px;
      cursor: pointer; transition: all 0.2s;
      background: ${primary ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)'};
      color: white; backdrop-filter: blur(10px);
      box-shadow: ${primary ? '0 4px 20px rgba(102, 126, 234, 0.4)' : 'none'};
    `;
    el.onmouseenter = () => { el.style.transform = 'translateY(-2px)'; };
    el.onmouseleave = () => { el.style.transform = 'translateY(0)'; };
  };

  private renderMenu(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(5,10,25,0.7);backdrop-filter:blur(8px);padding:40px;';

    const title = document.createElement('h1');
    title.textContent = '📝 作业批改调度训练';
    title.style.cssText = 'color:white;font-size:48px;margin-bottom:12px;text-shadow:0 2px 20px rgba(102,126,234,0.5);';

    const sub = document.createElement('p');
    sub.textContent = '压力下分辨成绩反馈、提醒规则和课程章节';
    sub.style.cssText = 'color:#a0aec0;font-size:20px;margin-bottom:40px;';

    wrap.appendChild(title);
    wrap.appendChild(sub);

    const startBtn = document.createElement('button');
    startBtn.textContent = '🚀 开始训练';
    this.styleBtn(startBtn, true);
    startBtn.style.marginBottom = '16px';
    startBtn.style.fontSize = '20px';
    startBtn.style.padding = '16px 48px';
    startBtn.onclick = () => {
      this.dispatch({ type: 'SET_SCREEN', screen: 'playing' });
      if (this.onStartChapterCallback) this.onStartChapterCallback('ch1');
    };

    const statsBtn = document.createElement('button');
    statsBtn.textContent = '📊 查看统计';
    this.styleBtn(statsBtn);
    statsBtn.onclick = () => this.dispatch({ type: 'SET_SCREEN', screen: 'stats' });

    wrap.appendChild(startBtn);
    wrap.appendChild(statsBtn);

    const tips = document.createElement('div');
    tips.style.cssText = 'margin-top:60px;max-width:600px;text-align:center;color:#718096;font-size:14px;line-height:1.8;';
    tips.innerHTML = `
      <p>🎯 目标：限时内正确批改作业，选择合适的成绩、提醒规则和对应章节</p>
      <p>⚠️ 进度落后会有视觉提示，错误可以在结算后回看</p>
      <p>🔁 最近三次失败过程可在统计页复盘</p>
    `;
    wrap.appendChild(tips);
    return wrap;
  }

  private renderPlaying(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;pointer-events:none;';

    const topBar = document.createElement('div');
    topBar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:20px 32px;background:linear-gradient(180deg,rgba(5,10,25,0.9),transparent);';

    const progress = document.createElement('div');
    progress.style.cssText = 'color:white;font-size:18px;font-weight:600;';
    progress.textContent = `批改进度: ${this.state.gradedCount} / ${this.state.totalHomeworks}`;

    const timerWrap = document.createElement('div');
    timerWrap.style.cssText = 'position:relative;width:200px;height:8px;background:rgba(255,255,255,0.15);border-radius:4px;overflow:hidden;';
    const timerFill = document.createElement('div');
    const pct = (this.state.timeRemaining / this.state.totalTime) * 100;
    const warnColor = pct < 30 ? '#ff6b6b' : pct < 50 ? '#ffd93d' : '#6bcb77';
    timerFill.style.cssText = `height:100%;width:${pct}%;background:${warnColor};transition:all 0.3s;border-radius:4px;`;
    timerWrap.appendChild(timerFill);

    const timerText = document.createElement('div');
    timerText.style.cssText = `color:${warnColor};font-size:22px;font-weight:700;text-align:center;margin-top:6px;font-variant-numeric:tabular-nums;`;
    timerText.textContent = `${Math.ceil(this.state.timeRemaining)}s`;

    topBar.appendChild(progress);
    topBar.appendChild(timerWrap);
    topBar.appendChild(timerText);
    wrap.appendChild(topBar);

    if (this.state.currentHomework) {
      const panel = this.renderGradingPanel(this.state.currentHomework);
      panel.style.cssText += 'margin-top:auto;margin-bottom:0;';
      wrap.appendChild(panel);
    }

    return wrap;
  }

  private renderGradingPanel(hw: Homework): HTMLElement {
    const panel = document.createElement('div');
    panel.style.cssText = `
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(20px);
      border-top: 1px solid rgba(255,255,255,0.1);
      padding: 28px 32px;
      pointer-events: auto;
      max-height: 60vh;
      overflow-y: auto;
    `;

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;';
    const hwTitle = document.createElement('h2');
    hwTitle.textContent = `📝 批改: ${hw.studentName} 的作业`;
    hwTitle.style.cssText = 'color:white;font-size:24px;margin:0;';
    header.appendChild(hwTitle);
    panel.appendChild(header);

    const section = (label: string) => {
      const s = document.createElement('div');
      s.style.marginBottom = '20px';
      const t = document.createElement('div');
      t.textContent = label;
      t.style.cssText = 'color:#a0aec0;font-size:14px;font-weight:600;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;';
      s.appendChild(t);
      return s;
    };

    const gradeSec = section('① 成绩反馈');
    const gradeRow = document.createElement('div');
    gradeRow.style.cssText = 'display:flex;gap:12px;flex-wrap:wrap;';
    const grades: GradeFeedback[] = ['excellent', 'good', 'pass', 'fail'];
    grades.forEach(g => {
      const b = document.createElement('button');
      b.textContent = GRADE_LABELS[g];
      const isSel = this.state.selectedGrade === g;
      const colors: Record<GradeFeedback, string> = {
        excellent: '#4CAF50', good: '#2196F3', pass: '#FF9800', fail: '#F44336'
      };
      b.style.cssText = `
        padding: 12px 28px; border-radius: 10px; border: 2px solid ${isSel ? colors[g] : 'rgba(255,255,255,0.15)'};
        background: ${isSel ? colors[g] : 'rgba(255,255,255,0.05)'};
        color: white; font-size: 16px; font-weight: 600; cursor: pointer;
        transition: all 0.15s;
      `;
      b.onclick = () => this.dispatch({ type: 'SELECT_GRADE', grade: g });
      gradeRow.appendChild(b);
    });
    gradeSec.appendChild(gradeRow);
    panel.appendChild(gradeSec);

    const ruleSec = section('② 提醒规则 (可多选)');
    const ruleRow = document.createElement('div');
    ruleRow.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;';
    const rules: ReminderRule[] = ['deadline', 'retry', 'plagiarism', 'late'];
    const ruleColors: Record<ReminderRule, string> = {
      deadline: '#9C27B0', retry: '#FF5722', plagiarism: '#795548', late: '#607D8B'
    };
    rules.forEach(r => {
      const b = document.createElement('button');
      b.textContent = RULE_LABELS[r];
      const isSel = this.state.selectedRules.includes(r);
      b.style.cssText = `
        padding: 10px 18px; border-radius: 8px;
        border: 2px solid ${isSel ? ruleColors[r] : 'rgba(255,255,255,0.15)'};
        background: ${isSel ? ruleColors[r] : 'rgba(255,255,255,0.05)'};
        color: white; font-size: 14px; font-weight: 500; cursor: pointer;
        transition: all 0.15s;
      `;
      b.onclick = () => this.dispatch({ type: 'TOGGLE_RULE', rule: r });
      ruleRow.appendChild(b);
    });
    ruleSec.appendChild(ruleRow);
    panel.appendChild(ruleSec);

    const chSec = section('③ 课程章节');
    const chRow = document.createElement('div');
    chRow.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;';
    const chapters: Chapter[] = [
      { id: 'ch1', name: '第一章：代数基础', description: '', order: 1 },
      { id: 'ch2', name: '第二章：几何入门', description: '', order: 2 },
      { id: 'ch3', name: '第三章：函数初步', description: '', order: 3 },
      { id: 'ch4', name: '第四章：概率统计', description: '', order: 4 }
    ];
    chapters.forEach(ch => {
      const b = document.createElement('button');
      b.textContent = ch.name;
      const isSel = this.state.selectedChapterId === ch.id;
      b.style.cssText = `
        padding: 10px 18px; border-radius: 8px;
        border: 2px solid ${isSel ? '#667eea' : 'rgba(255,255,255,0.15)'};
        background: ${isSel ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.05)'};
        color: white; font-size: 14px; font-weight: 500; cursor: pointer;
        transition: all 0.15s;
      `;
      b.onclick = () => this.dispatch({ type: 'SELECT_CHAPTER', chapterId: ch.id });
      chRow.appendChild(b);
    });
    chSec.appendChild(chRow);
    panel.appendChild(chSec);

    const submitRow = document.createElement('div');
    submitRow.style.cssText = 'display:flex;gap:16px;justify-content:flex-end;margin-top:8px;';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    this.styleBtn(cancelBtn);
    cancelBtn.onclick = () => {
      this.state.currentHomework = null;
      this.state.selectedGrade = null;
      this.state.selectedRules = [];
      this.state.selectedChapterId = null;
      this.render();
    };

    const submitBtn = document.createElement('button');
    submitBtn.textContent = '✓ 提交批改';
    this.styleBtn(submitBtn, true);
    submitBtn.onclick = () => {
      if (this.onSubmitCallback) {
        this.onSubmitCallback(
          this.state.selectedGrade,
          [...this.state.selectedRules],
          this.state.selectedChapterId
        );
      }
    };
    submitRow.appendChild(cancelBtn);
    submitRow.appendChild(submitBtn);
    panel.appendChild(submitRow);

    return panel;
  }

  private renderResult(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(5,10,25,0.85);backdrop-filter:blur(10px);padding:40px;';

    const s = this.state.stats;
    const rate = Math.round(s.completionRate * 100);

    const emoji = rate >= 80 ? '🏆' : rate >= 60 ? '👍' : '💪';
    const title = document.createElement('h1');
    title.textContent = `${emoji} 本轮结束`;
    title.style.cssText = 'color:white;font-size:42px;margin-bottom:10px;';

    const rateEl = document.createElement('div');
    rateEl.textContent = `完成率: ${rate}%`;
    rateEl.style.cssText = `font-size:64px;font-weight:800;margin:20px 0;background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;`;

    const detail = document.createElement('div');
    detail.style.cssText = 'color:#a0aec0;font-size:18px;margin-bottom:30px;text-align:center;line-height:1.8;';
    detail.innerHTML = `
      正确: <span style="color:#6bcb77;font-weight:700;">${s.correctCount}</span> / 总计: ${s.totalAttempts}<br/>
      平均耗时: ${s.averageTimePerHomework.toFixed(1)}s
    `;

    wrap.appendChild(title);
    wrap.appendChild(rateEl);
    wrap.appendChild(detail);

    const errSection = document.createElement('div');
    errSection.style.cssText = 'background:rgba(255,255,255,0.05);padding:20px 32px;border-radius:12px;margin-bottom:30px;min-width:400px;';
    errSection.innerHTML = `
      <div style="color:#a0aec0;font-size:14px;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;">错因分布</div>
      <div style="display:flex;gap:24px;justify-content:center;">
        <div style="text-align:center;"><div style="color:#F44336;font-size:28px;font-weight:700;">${s.errorBreakdown.gradeErrors}</div><div style="color:#718096;font-size:12px;">成绩错误</div></div>
        <div style="text-align:center;"><div style="color:#FF9800;font-size:28px;font-weight:700;">${s.errorBreakdown.ruleErrors}</div><div style="color:#718096;font-size:12px;">规则错误</div></div>
        <div style="text-align:center;"><div style="color:#2196F3;font-size:28px;font-weight:700;">${s.errorBreakdown.chapterErrors}</div><div style="color:#718096;font-size:12px;">章节错误</div></div>
      </div>
    `;
    wrap.appendChild(errSection);

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:16px;flex-wrap:wrap;justify-content:center;';

    const revBtn = document.createElement('button');
    revBtn.textContent = '🔍 复盘错误';
    this.styleBtn(revBtn, true);
    revBtn.onclick = () => { if (this.onReviewCallback) this.onReviewCallback(); };

    const againBtn = document.createElement('button');
    againBtn.textContent = '🔄 再来一轮';
    this.styleBtn(againBtn);
    againBtn.onclick = () => { if (this.onStartChapterCallback) this.onStartChapterCallback('ch1'); };

    const menuBtn = document.createElement('button');
    menuBtn.textContent = '🏠 返回菜单';
    this.styleBtn(menuBtn);
    menuBtn.onclick = () => this.dispatch({ type: 'SET_SCREEN', screen: 'menu' });

    btnRow.appendChild(revBtn);
    btnRow.appendChild(againBtn);
    btnRow.appendChild(menuBtn);
    wrap.appendChild(btnRow);

    return wrap;
  }

  private renderStats(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;background:rgba(5,10,25,0.92);backdrop-filter:blur(10px);padding:40px;overflow-y:auto;';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;';
    const t = document.createElement('h1');
    t.textContent = '📊 训练统计';
    t.style.cssText = 'color:white;font-size:36px;margin:0;';
    const back = document.createElement('button');
    back.textContent = '← 返回';
    this.styleBtn(back);
    back.onclick = () => { if (this.onBackCallback) this.onBackCallback(); else this.dispatch({ type: 'SET_SCREEN', screen: 'menu' }); };
    header.appendChild(t); header.appendChild(back);
    wrap.appendChild(header);

    const s = this.state.stats;
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;margin-bottom:40px;';

    const statCard = (label: string, value: string, color: string) => {
      const c = document.createElement('div');
      c.style.cssText = 'background:rgba(255,255,255,0.05);padding:24px;border-radius:16px;';
      c.innerHTML = `<div style="color:#718096;font-size:14px;margin-bottom:8px;">${label}</div><div style="color:${color};font-size:36px;font-weight:800;">${value}</div>`;
      return c;
    };
    grid.appendChild(statCard('总批改次数', String(s.totalAttempts), '#fff'));
    grid.appendChild(statCard('完成率', `${Math.round(s.completionRate * 100)}%`, '#6bcb77'));
    grid.appendChild(statCard('平均耗时', `${s.averageTimePerHomework.toFixed(1)}s`, '#667eea'));
    wrap.appendChild(grid);

    const fTitle = document.createElement('h2');
    fTitle.textContent = '🔁 最近失败回放 (保留最近3次)';
    fTitle.style.cssText = 'color:white;font-size:22px;margin:0 0 16px;';
    wrap.appendChild(fTitle);

    if (s.recentFailures.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = '暂无失败记录，继续加油！';
      empty.style.cssText = 'color:#718096;padding:40px;text-align:center;background:rgba(255,255,255,0.03);border-radius:12px;';
      wrap.appendChild(empty);
    } else {
      const fList = document.createElement('div');
      fList.style.cssText = 'display:flex;flex-direction:column;gap:12px;';
      s.recentFailures.forEach((rec, idx) => {
        const chMap: Record<string, string> = { ch1: '代数基础', ch2: '几何入门', ch3: '函数初步', ch4: '概率统计' };
        const card = document.createElement('div');
        card.style.cssText = 'background:rgba(255,255,255,0.05);padding:20px;border-radius:12px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;transition:all 0.2s;';
        card.onmouseenter = () => { card.style.background = 'rgba(255,255,255,0.1)'; };
        card.onmouseleave = () => { card.style.background = 'rgba(255,255,255,0.05)'; };
        card.onclick = () => this.dispatch({ type: 'LOAD_FAILURE', record: rec });
        card.innerHTML = `
          <div>
            <div style="color:white;font-size:16px;font-weight:600;">失败 #${idx + 1} - ${chMap[rec.chapterId] || rec.chapterId}</div>
            <div style="color:#718096;font-size:13px;margin-top:4px;">${new Date(rec.timestamp).toLocaleString()} · ${rec.errors.length} 个错误</div>
          </div>
          <div style="color:#667eea;font-size:14px;">▶ 回放 →</div>
        `;
        fList.appendChild(card);
      });
      wrap.appendChild(fList);
    }

    return wrap;
  }

  private renderReview(): HTMLElement {
    return this.renderReviewCommon(false);
  }

  private renderReplay(): HTMLElement {
    return this.renderReviewCommon(true);
  }

  private renderReviewCommon(isReplay: boolean): HTMLElement {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;background:rgba(5,10,25,0.95);backdrop-filter:blur(10px);padding:40px;overflow-y:auto;';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;';
    const t = document.createElement('h1');
    t.textContent = isReplay ? '🎬 失败回放' : '🔍 错误复盘';
    t.style.cssText = 'color:white;font-size:28px;margin:0;';
    const back = document.createElement('button');
    back.textContent = '← 返回';
    this.styleBtn(back);
    back.onclick = () => this.dispatch({ type: 'SET_SCREEN', screen: isReplay ? 'stats' : 'result' });
    header.appendChild(t); header.appendChild(back);
    wrap.appendChild(header);

    const hws = this.state.reviewHomeworks;
    const ress = this.state.reviewResults;
    const errors = ress.filter(r => !r.isCorrect);

    const prog = document.createElement('div');
    prog.style.cssText = 'color:#a0aec0;font-size:14px;margin-bottom:16px;';
    prog.textContent = `共 ${hws.length} 份作业，${errors.length} 个错误`;
    wrap.appendChild(prog);

    if (errors.length === 0) {
      const e = document.createElement('div');
      e.style.cssText = 'color:#6bcb77;padding:40px;text-align:center;font-size:20px;';
      e.textContent = '🎉 全部正确，没有需要复盘的错误！';
      wrap.appendChild(e);
      return wrap;
    }

    const errList = document.createElement('div');
    errList.style.cssText = 'display:flex;flex-direction:column;gap:16px;';
    errors.forEach((res, i) => {
      const hw = hws.find(h => h.id === res.homeworkId);
      if (!hw) return;
      const card = document.createElement('div');
      card.style.cssText = 'background:rgba(244,67,54,0.08);border:1px solid rgba(244,67,54,0.3);padding:20px;border-radius:12px;';
      const errTypeLabel = res.errorType === 'grade' ? '成绩选择错误' : res.errorType === 'rule' ? '规则选择错误' : '章节选择错误';
      const chMap: Record<string, string> = { ch1: '第一章', ch2: '第二章', ch3: '第三章', ch4: '第四章' };
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
          <div>
            <div style="color:white;font-size:18px;font-weight:700;">错误 #${i + 1}: ${hw.studentName} 的作业</div>
            <div style="color:#ff6b6b;font-size:13px;margin-top:4px;">❌ ${errTypeLabel}</div>
          </div>
          <div style="color:#718096;font-size:12px;">${chMap[hw.chapterId] || hw.chapterId}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px;">
          <div style="background:rgba(255,255,255,0.04);padding:12px;border-radius:8px;">
            <div style="color:#718096;font-size:12px;margin-bottom:6px;">你的选择</div>
            <div style="color:#ff6b6b;">成绩: ${res.selectedGrade ? GRADE_LABELS[res.selectedGrade] : '-'}</div>
            <div style="color:#ff6b6b;">规则: ${res.selectedRules.map(r => RULE_LABELS[r]).join('、') || '-'}</div>
            <div style="color:#ff6b6b;">章节: ${res.selectedChapterId ? chMap[res.selectedChapterId] : '-'}</div>
          </div>
          <div style="background:rgba(107,203,119,0.08);padding:12px;border-radius:8px;">
            <div style="color:#718096;font-size:12px;margin-bottom:6px;">正确答案</div>
            <div style="color:#6bcb77;">成绩: ${GRADE_LABELS[hw.correctGrade]}</div>
            <div style="color:#6bcb77;">规则: ${hw.correctRules.map(r => RULE_LABELS[r]).join('、') || '-'}</div>
            <div style="color:#6bcb77;">章节: ${chMap[hw.chapterId]}</div>
          </div>
        </div>
      `;
      errList.appendChild(card);
    });
    wrap.appendChild(errList);

    return wrap;
  }
}
