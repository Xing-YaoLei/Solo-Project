class InteractionRecord < ApplicationRecord
  belongs_to :document
  belongs_to :operator, class_name: 'User'

  validates :action_type, presence: true

  ACTION_TYPES = {
    'create' => '创建',
    'update' => '更新',
    'submit' => '提交审核',
    'review_start' => '开始审核',
    'review_approve' => '审核通过',
    'review_reject' => '审核退回',
    'schedule' => '排期发布',
    'publish' => '发布',
    'archive' => '归档',
    'unarchive' => '取消归档',
    'comment' => '评论',
    'download' => '下载',
    'other' => '其他'
  }.freeze

  def action_type_name
    ACTION_TYPES[action_type] || action_type
  end
end
