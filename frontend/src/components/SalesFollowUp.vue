<template>
  <el-card class="sales-follow-up-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <el-icon><User /></el-icon>
        <span>销售跟进</span>
      </div>
    </template>
    <div v-if="data" class="follow-up-info">
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item label="客户姓名">{{ data.customerName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ data.customerPhone }}</el-descriptions-item>
        <el-descriptions-item label="线索来源">
          <el-tag size="small" type="info">{{ data.leadSource || '未标记' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="线索状态">
          <el-tag :type="leadStatusType(data.leadStatus)" size="small">
            {{ data.leadStatus || '待跟进' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="销售顾问">{{ data.salesPerson }}</el-descriptions-item>
        <el-descriptions-item label="跟进备注">{{ data.followUpNote || '暂无' }}</el-descriptions-item>
      </el-descriptions>
    </div>
    <el-empty v-else description="暂无跟进信息" :image-size="60" />
  </el-card>
</template>

<script setup>
const props = defineProps({
  data: { type: Object, default: null }
})

function leadStatusType(status) {
  const map = { 'NEW': 'info', 'FOLLOWING': 'warning', 'CONVERTED': 'success', 'LOST': 'danger' }
  return map[status] || 'info'
}
</script>

<style scoped>
.sales-follow-up-card { height: 100%; }
.card-header { display: flex; align-items: center; gap: 8px; font-weight: 600; }
</style>
