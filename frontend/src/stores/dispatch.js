import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getDispatchBoard } from '../api/appointment'
import dayjs from 'dayjs'

export const useDispatchStore = defineStore('dispatch', () => {
  const dispatchList = ref([])
  const loading = ref(false)
  const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
  const selectedAppointment = ref(null)

  async function loadDispatch(date) {
    loading.value = true
    try {
      dispatchList.value = await getDispatchBoard(date || selectedDate.value)
    } catch (e) {
      console.error('加载分派台数据失败:', e)
      dispatchList.value = []
    } finally {
      loading.value = false
    }
  }

  function selectAppointment(item) {
    selectedAppointment.value = item
  }

  return { dispatchList, loading, selectedDate, selectedAppointment, loadDispatch, selectAppointment }
})
