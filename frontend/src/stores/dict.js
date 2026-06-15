import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDictStore = defineStore('dict', () => {
  const statusOptions = ref([
    { label: '待确认', value: 'PENDING', color: '#3182CE', type: 'primary' },
    { label: '已确认', value: 'CONFIRMED', color: '#38A169', type: 'success' },
    { label: '冲突', value: 'CONFLICT', color: '#E53E3E', type: 'danger' },
    { label: '已改约', value: 'RESCHEDULED', color: '#ED8936', type: 'warning' },
    { label: '已取消', value: 'CANCELLED', color: '#A0AEC0', type: 'info' },
    { label: '已完成', value: 'COMPLETED', color: '#00B5D8', type: '' },
    { label: '未到场', value: 'NO_SHOW', color: '#E53E3E', type: 'danger' }
  ])

  const subjectOptions = ref([
    { label: '钢琴', value: '钢琴' },
    { label: '小提琴', value: '小提琴' },
    { label: '舞蹈', value: '舞蹈' },
    { label: '美术', value: '美术' },
    { label: '书法', value: '书法' },
    { label: '声乐', value: '声乐' },
    { label: '编程', value: '编程' }
  ])

  const campusOptions = ref([
    { label: '总部校区', value: '总部校区' },
    { label: '城南校区', value: '城南校区' },
    { label: '城北校区', value: '城北校区' },
    { label: '城东校区', value: '城东校区' }
  ])

  const attendanceStatusOptions = ref([
    { label: '已签到', value: 'CHECKED_IN', color: '#38A169' },
    { label: '迟到', value: 'LATE', color: '#ED8936' },
    { label: '未到', value: 'NO_SHOW', color: '#E53E3E' }
  ])

  const roleOptions = ref([
    { label: '管理员', value: 'ADMIN' },
    { label: '前台', value: 'RECEPTIONIST' },
    { label: '教师', value: 'TEACHER' },
    { label: '校长', value: 'PRINCIPAL' }
  ])

  function getStatusLabel(value) {
    return statusOptions.value.find(s => s.value === value)?.label || value
  }

  function getStatusType(value) {
    return statusOptions.value.find(s => s.value === value)?.type || 'info'
  }

  return {
    statusOptions, subjectOptions, campusOptions,
    attendanceStatusOptions, roleOptions,
    getStatusLabel, getStatusType
  }
})
