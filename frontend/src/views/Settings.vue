<template>
  <div class="page-container">
    <h3 class="page-title">系统设置</h3>

    <div class="table-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本设置" name="basic">
          <el-form :model="settingsForm" label-width="120px" style="max-width: 500px">
            <el-form-item label="系统名称">
              <el-input v-model="settingsForm.systemName" />
            </el-form-item>
            <el-form-item label="默认校区">
              <el-select v-model="settingsForm.defaultCampus" style="width: 100%">
                <el-option v-for="c in dictStore.campusOptions" :key="c.value" :label="c.label" :value="c.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="提醒提前时间">
              <el-input-number v-model="settingsForm.reminderHours" :min="1" :max="72" />
              <span style="margin-left: 8px">小时</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSave">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="账号管理" name="accounts">
          <el-empty description="账号管理功能开发中" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useDictStore } from '@/stores/dict'

const dictStore = useDictStore()
const activeTab = ref('basic')
const settingsForm = ref({
  systemName: '试听预约任务分派台',
  defaultCampus: '总部校区',
  reminderHours: 2
})

function handleSave() {
  ElMessage.success('设置已保存')
}
</script>

<style scoped>
.page-title {
  margin-bottom: 20px;
  font-size: 18px;
}
</style>
