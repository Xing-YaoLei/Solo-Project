<template>
  <el-card class="vehicle-archive-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <el-icon><Car /></el-icon>
        <span>车辆档案</span>
      </div>
    </template>
    <div v-if="vehicle" class="vehicle-info">
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="VIN">{{ vehicle.vin }}</el-descriptions-item>
        <el-descriptions-item label="品牌">{{ vehicle.brand }}</el-descriptions-item>
        <el-descriptions-item label="车型">{{ vehicle.model }}</el-descriptions-item>
        <el-descriptions-item label="年份">{{ vehicle.year }}</el-descriptions-item>
        <el-descriptions-item label="颜色">{{ vehicle.color }}</el-descriptions-item>
        <el-descriptions-item label="价格">
          <span class="price">¥{{ vehicle.price }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="里程">{{ vehicle.mileage }} km</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType(vehicle.vehicleStatus)" size="small">
            {{ vehicle.vehicleStatus }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </div>
    <el-empty v-else description="暂无车辆信息" :image-size="60" />
  </el-card>
</template>

<script setup>
const props = defineProps({
  vehicle: { type: Object, default: null }
})

function statusType(status) {
  const map = { 'AVAILABLE': 'success', 'RESERVED': 'warning', 'SOLD': 'danger', 'MAINTENANCE': 'info' }
  return map[status] || 'info'
}
</script>

<style scoped>
.vehicle-archive-card { height: 100%; }
.card-header { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.price { color: #e6a23c; font-weight: 600; font-size: 16px; }
</style>
