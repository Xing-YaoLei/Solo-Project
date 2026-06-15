import { defineStore } from 'pinia'
import type { Progress, Grade, ChapterCompletion, Course, PaginatedResponse } from '~/types'

interface ProgressState {
  progressList: Progress[]
  loading: boolean
  courseFilter: number | null
  studentFilter: number | null
  courses: Course[]
}

export const useProgressStore = defineStore('progress', {
  state: (): ProgressState => ({
    progressList: [],
    loading: false,
    courseFilter: null,
    studentFilter: null,
    courses: [],
  }),
  getters: {
    filteredProgress(state): Progress[] {
      return state.progressList
    },
  },
  actions: {
    setCourseFilter(courseId: number | null) {
      this.courseFilter = courseId
    },
    setStudentFilter(studentId: number | null) {
      this.studentFilter = studentId
    },
    async fetchProgress() {
      const api = useApi()
      this.loading = true
      try {
        const params: Record<string, unknown> = {}
        const response = await api.get<PaginatedResponse<Progress>>('/progress/', params)
        this.progressList = response.results
      } finally {
        this.loading = false
      }
    },
    async fetchCourses() {
      const api = useApi()
      try {
        const response = await api.get<PaginatedResponse<Course>>('/courses/')
        this.courses = response.results
      } catch (e) {
        console.error('Failed to fetch courses', e)
      }
    },
    async updateProgress(id: number, percentage: number) {
      const api = useApi()
      try {
        const response = await api.patch<Progress>(`/progress/${id}/`, { percentage })
        const idx = this.progressList.findIndex((p) => p.id === id)
        if (idx !== -1) {
          this.progressList[idx] = response
        }
        return response
      } catch (e) {
        console.error('Failed to update progress', e)
        throw e
      }
    },
    async updateChapterCompletion(progressId: number, chapterId: number, completed: boolean) {
      const api = useApi()
      try {
        const progress = this.progressList.find((p) => p.id === progressId)
        if (!progress) return
        const completion = progress.chapter_completions.find((c) => c.chapter === chapterId)
        if (!completion) return
        await api.patch<ChapterCompletion>(`/progress/chapter-completions/${completion.id}/`, { completed })
        await this.fetchProgress()
      } catch (e) {
        console.error('Failed to update chapter completion', e)
        throw e
      }
    },
    async addGrade(progressId: number, chapterId: number, score: number, feedback: string) {
      const api = useApi()
      try {
        const response = await api.post<Grade>('/progress/grades/', {
          progress: progressId,
          chapter: chapterId,
          score,
          feedback,
        })
        const progress = this.progressList.find((p) => p.id === progressId)
        if (progress) {
          progress.grades.unshift(response)
        }
        return response
      } catch (e) {
        console.error('Failed to add grade', e)
        throw e
      }
    },
    async init() {
      await Promise.all([this.fetchProgress(), this.fetchCourses()])
    },
  },
})
