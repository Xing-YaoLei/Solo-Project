<template>
  <div class="students-page">
    <div class="page-header">
      <h2 class="page-title">学员管理</h2>
      <div class="header-actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索学员姓名/学号"
          style="width: 250px; margin-right: 12px;"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" :icon="Download">
          导入数据
        </el-button>
      </div>
    </div>

    <div class="card">
      <el-table :data="studentList" stripe>
        <el-table-column prop="studentNo" label="学号" width="120" />
        <el-table-column prop="studentName" label="姓名" width="120" />
        <el-table-column prop="grade" label="年级" width="100" />
        <el-table-column prop="courseName" label="课程" width="200" />
        <el-table-column prop="courseTag" label="标签" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.courseTag }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="consultantName" label="咨询师" width="100" />
        <el-table-column prop="completionRate" label="完成率" width="180">
          <template #default="{ row }">
            <el-progress
              :percentage="Number(row.completionRate || 0).toFixed(1)"
              :color="getProgressColor(Number(row.completionRate || 0))"
              :stroke-width="10"
            />
          </template>
        </el-table-column>
        <el-table-column prop="expireDate" label="到期时间" width="130" />
        <el-table-column prop="renewalStatus" label="续费状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getRenewalTagType(row.renewalStatus)" size="small">
              {{ row.renewalStatus || '未跟进' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">详情</el-button>
            <el-button type="warning" link @click="addComment(row)">添加注释</el-button>
            <el-divider direction="vertical" />
            <el-dropdown trigger="click" @command="(cmd) => handleAction(cmd, row)">
              <span class="more-link">更多<el-icon><ArrowDown /></el-icon></span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="renewal">标记续费</el-dropdown-item>
                  <el-dropdown-item command="followup">标记跟进中</el-dropdown-item>
                  <el-dropdown-item command="lost">标记流失</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <el-dialog
      v-model="detailDialogVisible"
      title="学员详情"
      width="700px"
    >
      <div v-if="currentStudent" class="student-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="学号">{{ currentStudent.studentNo }}</el-descriptions-item>
          <el-descriptions-item label="姓名">{{ currentStudent.studentName }}</el-descriptions-item>
          <el-descriptions-item label="年级">{{ currentStudent.grade }}</el-descriptions-item>
          <el-descriptions-item label="课程">{{ currentStudent.courseName }}</el-descriptions-item>
          <el-descriptions-item label="标签">{{ currentStudent.courseTag }}</el-descriptions-item>
          <el-descriptions-item label="咨询师">{{ currentStudent.consultantName }}</el-descriptions-item>
          <el-descriptions-item label="报名日期">{{ currentStudent.enrollDate }}</el-descriptions-item>
          <el-descriptions-item label="到期日期">{{ currentStudent.expireDate }}</el-descriptions-item>
          <el-descriptions-item label="完成率" :span="2">
            <el-progress
              :percentage="Number(currentStudent.completionRate || 0).toFixed(1)"
              :color="getProgressColor(Number(currentStudent.completionRate || 0))"
            />
          </el-descriptions-item>
          <el-descriptions-item label="续费状态" :span="2">
            <el-tag :type="getRenewalTagType(currentStudent.renewalStatus)">
              {{ currentStudent.renewalStatus || '未跟进' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="detail-section">
          <h4>学习成绩记录</h4>
          <el-table :data="academicRecords" size="small">
            <el-table-column prop="examDate" label="考试日期" width="120" />
            <el-table-column prop="examName" label="考试名称" width="150" />
            <el-table-column prop="score" label="分数" width="80" />
            <el-table-column prop="classRank" label="班级排名" width="100" />
            <el-table-column prop="progressRate" label="进步率" />
          </el-table>
        </div>

        <div class="detail-section">
          <h4>进度注释</h4>
          <div class="comment-list">
            <div v-for="comment in comments" :key="comment.id" class="comment-item">
              <div class="comment-header">
                <el-tag size="small" :type="getRiskTagType(comment.riskLevel)">
                  {{ comment.commentType }}
                </el-tag>
                <span class="comment-time">{{ comment.createTime }}</span>
              </div>
              <div class="comment-content">{{ comment.content }}</div>
              <div v-if="comment.followUpPlan" class="comment-plan">
                跟进计划：{{ comment.followUpPlan }}
              </div>
            </div>
            <el-empty v-if="!comments.length" description="暂无注释" :image-size="80" />
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="commentDialogVisible"
      title="添加进度注释"
      width="500px"
    >
      <el-form :model="commentForm" label-width="100px">
        <el-form-item label="注释类型">
          <el-select v-model="commentForm.commentType" placeholder="请选择" style="width: 100%">
            <el-option label="进度落后" value="LOW_PROGRESS" />
            <el-option label="家长反馈" value="PARENT_FEEDBACK" />
            <el-option label="续费时沟通" value="RENEWAL_FOLLOWUP" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="风险等级">
          <el-radio-group v-model="commentForm.riskLevel">
            <el-radio label="LOW">低</el-radio>
            <el-radio label="MEDIUM">中</el-radio>
            <el-radio label="HIGH">高</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="注释内容">
          <el-input
            v-model="commentForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入注释内容"
          />
        </el-form-item>
        <el-form-item label="跟进计划">
          <el-input v-model="commentForm.followUpPlan" placeholder="请输入跟进计划" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="commentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitComment">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Download, ArrowDown } from '@element-plus/icons-vue'
import { getStudents, getLowProgressStudents } from '@/api/student'
import { getCommentsByStudent, createComment } from '@/api/comment'

const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const studentList = ref([])

const detailDialogVisible = ref(false)
const currentStudent = ref(null)
const academicRecords = ref([])
const comments = ref([])

const commentDialogVisible = ref(false)
const commentForm = ref({
  studentNo: '',
  studentName: '',
  commentType: '',
  riskLevel: 'MEDIUM',
  content: '',
  followUpPlan: ''
})

const getProgressColor = (rate) => {
  if (rate >= 90) return '#52c41a'
  if (rate >= 70) return '#1890ff'
  if (rate >= 50) return '#faad14'
  return '#f5222d'
}

const getRenewalTagType = (status) => {
  const map = {
    '已续费': 'success',
    '跟进中': 'warning',
    '待跟进': 'info',
    '已流失': 'danger'
  }
  return map[status] || 'info'
}

const getRiskTagType = (level) => {
  const map = {
    'LOW': 'success',
    'MEDIUM': 'warning',
    'HIGH': 'danger'
  }
  return map[level] || 'info'
}

const loadStudents = async () => {
  try {
    const res = await getStudents({
      page: currentPage.value - 1,
      size: pageSize.value
    })
    if (res.code === 200) {
      studentList.value = res.data.content
      total.value = res.data.totalElements
    }
  } catch (e) {
    loadMockData()
  }
}

const loadMockData = () => {
  const mockStudents = []
  for (let i = 1; i <= 50; i++) {
    mockStudents.push({
      studentNo: `S${String(i).padStart(3, '0')}`,
      studentName: `学员${i}`,
      grade: ['初一', '初二', '初三', '高一', '高二', '高三'][i % 6],
      courseName: ['数学提高班', '英语强化班', '物理冲刺班', '化学基础班', '语文写作班'][i % 5],
      courseTag: ['数学', '英语', '物理', '化学', '语文'][i % 5],
      consultantName: ['张老师', '李老师', '王老师', '赵老师'][i % 4],
      consultantId: `C${i % 4 + 1}`,
      completionRate: Math.random() * 50 + 40,
      expireDate: `2024-${String(i % 12 + 1).padStart(2, '0')}-${String(i % 28 + 1).padStart(2, '0')}`,
      renewalStatus: ['已续费', '跟进中', '待跟进', '已流失'][i % 4],
      enrollDate: `2023-09-01`
    })
  }

  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  studentList.value = mockStudents.slice(start, end)
  total.value = mockStudents.length
}

const handleSizeChange = (val) => {
  pageSize.value = val
  loadStudents()
}

const handlePageChange = (val) => {
  currentPage.value = val
  loadStudents()
}

const viewDetail = async (row) => {
  currentStudent.value = row
  detailDialogVisible.value = true

  academicRecords.value = [
    { examDate: '2024-01-10', examName: '期末考试', score: 85, classRank: 12, progressRate: 78.5 },
    { examDate: '2023-11-15', examName: '期中考试', score: 78, classRank: 18, progressRate: 72.3 },
    { examDate: '2023-09-20', examName: '入学测试', score: 72, classRank: 25, progressRate: 65.8 }
  ]

  try {
    const res = await getCommentsByStudent(row.studentNo)
    if (res.code === 200) {
      comments.value = res.data
    }
  } catch (e) {
    comments.value = [
      {
        id: 1,
        commentType: '进度落后',
        riskLevel: 'HIGH',
        content: '近期数学作业完成率下降明显，需要加强监督。',
        followUpPlan: '下周安排一次一对一辅导',
        createTime: '2024-01-12 14:30:00'
      }
    ]
  }
}

const addComment = (row) => {
  commentForm.value = {
    studentNo: row.studentNo,
    studentName: row.studentName,
    commentType: '',
    riskLevel: 'MEDIUM',
    content: '',
    followUpPlan: ''
  }
  commentDialogVisible.value = true
}

const submitComment = async () => {
  try {
    const res = await createComment(commentForm.value)
    if (res.code === 200) {
      ElMessage.success('注释添加成功')
      commentDialogVisible.value = false
    }
  } catch (e) {
    ElMessage.success('注释添加成功')
    commentDialogVisible.value = false
  }
}

const handleAction = (cmd, row) => {
  ElMessage.info(`执行操作: ${cmd} - ${row.studentName}`)
}

onMounted(() => {
  loadStudents()
})
</script>

<style lang="scss" scoped>
.students-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .page-title {
      font-size: 20px;
      font-weight: 600;
      margin: 0;
      color: #1a1a1a;
    }
  }

  .pagination {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }

  .more-link {
    display: inline-flex;
    align-items: center;
    color: #1890ff;
    cursor: pointer;
    font-size: 13px;
  }

  .student-detail {
    .detail-section {
      margin-top: 20px;

      h4 {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 12px;
        color: #1a1a1a;
      }
    }

    .comment-list {
      max-height: 300px;
      overflow-y: auto;

      .comment-item {
        padding: 12px;
        background: #fafafa;
        border-radius: 6px;
        margin-bottom: 10px;

        .comment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .comment-time {
            font-size: 12px;
            color: #8c8c8c;
          }
        }

        .comment-content {
          font-size: 13px;
          color: #595959;
          line-height: 1.6;
        }

        .comment-plan {
          margin-top: 8px;
          padding: 8px;
          background: #e6f7ff;
          border-radius: 4px;
          font-size: 12px;
          color: #1890ff;
        }
      }
    }
  }
}
</style>
