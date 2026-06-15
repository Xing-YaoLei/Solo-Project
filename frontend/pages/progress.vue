<template>
  <div class="page-container">
    <div class="card-section">
      <div class="filter-bar">
        <n-select
          v-model:value="courseFilter"
          placeholder="筛选课程"
          clearable
          :options="courseOptions"
          style="width: 200px;"
        />
      </div>
    </div>

    <div v-for="progress in progressStore.progressList" :key="progress.id" class="card-section">
      <div class="progress-header">
        <div class="student-info">
          <n-avatar :size="36" round style="background-color: #1B3A5C;">
            {{ progress.student_name.charAt(0) }}
          </n-avatar>
          <div>
            <div class="student-name">{{ progress.student_name }}</div>
            <div class="course-name">{{ progress.material_title }}</div>
          </div>
        </div>
        <div class="progress-overall">
          <span class="progress-label">总体进度</span>
          <n-progress
            type="circle"
            :percentage="progress.percentage"
            :color="getProgressColor(progress.percentage)"
            :rail-color="'#E4E7ED'"
            :stroke-width="8"
            style="width: 60px;"
          />
        </div>
      </div>

      <div class="chapter-steps">
        <div class="chapters-grid">
          <div
            v-for="chapter in progress.chapter_completions"
            :key="chapter.id"
            class="chapter-item"
            :class="{ completed: chapter.completed }"
          >
            <div class="chapter-checkbox">
              <n-checkbox
                :checked="chapter.completed"
                @update:checked="(val) => toggleChapter(progress.id, chapter.chapter, val)"
              />
            </div>
            <div class="chapter-info">
              <div class="chapter-name">{{ chapter.chapter_name }}</div>
              <div class="chapter-date" v-if="chapter.completed_at">
                完成于 {{ chapter.completed_at.split('T')[0] }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grade-section">
        <div class="grade-header">
          <div class="grade-title">成绩反馈</div>
          <n-button size="small" type="primary" @click="openGradeModal(progress)">录入成绩</n-button>
        </div>
        <div class="grade-list">
          <div v-for="grade in progress.grades" :key="grade.id" class="grade-item">
            <span class="grade-chapter">{{ grade.chapter_name }}</span>
            <n-progress
              type="line"
              :percentage="Math.round((grade.score / 100) * 100)"
              :color="getScoreColor(grade.score)"
              :show-indicator="false"
              style="flex: 1;"
            />
            <span class="grade-score">{{ grade.score }}分</span>
          </div>
          <div v-if="progress.grades.length === 0" class="no-grades">
            暂无成绩记录
          </div>
        </div>
      </div>
    </div>

    <n-empty v-if="progressStore.progressList.length === 0 && !progressStore.loading" description="暂无学习进度数据" style="margin-top: 60px;" />
    <n-spin v-if="progressStore.loading" style="display:flex;justify-content:center;padding:60px;" />

    <n-modal
      v-model:show="showGradeModal"
      preset="card"
      title="录入成绩"
      style="width: 480px;"
    >
      <n-form :model="gradeForm" label-placement="left" label-width="80">
        <n-form-item label="章节">
          <n-select
            v-model:value="gradeForm.chapterId"
            :options="chapterOptions"
            placeholder="选择章节"
          />
        </n-form-item>
        <n-form-item label="成绩">
          <n-input-number
            v-model:value="gradeForm.score"
            :min="0"
            :max="100"
            placeholder="输入分数"
            style="width: 100%;"
          />
        </n-form-item>
        <n-form-item label="反馈">
          <n-input v-model:value="gradeForm.feedback" type="textarea" :rows="3" placeholder="输入评语反馈" />
        </n-form-item>
      </n-form>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <n-button @click="showGradeModal = false">取消</n-button>
          <n-button type="primary" :loading="submittingGrade" @click="submitGrade">提交</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import type { Progress } from '~/types'

const progressStore = useProgressStore()

onMounted(async () => {
  await progressStore.init()
})

const courseFilter = ref<number | null>(null)
const showGradeModal = ref(false)
const submittingGrade = ref(false)
const currentProgress = ref<Progress | null>(null)

const gradeForm = reactive({
  chapterId: null as number | null,
  score: null as number | null,
  feedback: '',
})

const courseOptions = computed(() =>
  progressStore.courses.map((c) => ({
    label: c.name,
    value: c.id,
  }))
)

const chapterOptions = computed(() => {
  if (!currentProgress.value) return []
  return currentProgress.value.chapter_completions.map((cc) => ({
    label: cc.chapter_name,
    value: cc.chapter,
  }))
})

function getProgressColor(percentage: number): string {
  if (percentage >= 80) return '#27AE60'
  if (percentage >= 50) return '#F28C28'
  return '#E74C3C'
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#27AE60'
  if (score >= 70) return '#3498DB'
  if (score >= 60) return '#F39C12'
  return '#E74C3C'
}

async function toggleChapter(progressId: number, chapterId: number, completed: boolean) {
  try {
    await progressStore.updateChapterCompletion(progressId, chapterId, completed)
    window.$message?.success('章节状态已更新')
  } catch (e) {
    window.$message?.error('更新失败')
  }
}

function openGradeModal(progress: Progress) {
  currentProgress.value = progress
  gradeForm.chapterId = null
  gradeForm.score = null
  gradeForm.feedback = ''
  showGradeModal.value = true
}

async function submitGrade() {
  if (!currentProgress.value || !gradeForm.chapterId || gradeForm.score === null) {
    window.$message?.warning('请填写完整信息')
    return
  }
  submittingGrade.value = true
  try {
    await progressStore.addGrade(
      currentProgress.value.id,
      gradeForm.chapterId!,
      gradeForm.score!,
      gradeForm.feedback
    )
    window.$message?.success('成绩已录入')
    showGradeModal.value = false
  } catch (e) {
    window.$message?.error('录入失败')
  } finally {
    submittingGrade.value = false
  }
}
</script>

<style scoped>
.progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.student-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.course-name {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.progress-overall {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.chapters-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px 0;
}

.chapter-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: var(--color-bg);
  border-radius: 6px;
  border: 1px solid var(--color-border);
  transition: all 0.2s;
}

.chapter-item.completed {
  border-color: var(--color-success);
  background: rgba(39, 174, 96, 0.05);
}

.chapter-checkbox {
  padding-top: 2px;
}

.chapter-info {
  flex: 1;
}

.chapter-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}

.chapter-date {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.grade-section {
  border-top: 1px solid var(--color-border);
  padding-top: 16px;
}

.grade-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.grade-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
}

.grade-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.grade-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.grade-chapter {
  width: 140px;
  font-size: 13px;
  color: var(--color-text);
  flex-shrink: 0;
}

.grade-score {
  width: 60px;
  text-align: right;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  flex-shrink: 0;
}

.no-grades {
  font-size: 13px;
  color: var(--color-text-secondary);
  text-align: center;
  padding: 12px;
}
</style>
