class ActivityLog < ApplicationRecord
  ACTIONS = %w[create update submit start_process mark_missing materials_received send_to_review complete reject_review close upload_proof add_item update_item handle_shortage].freeze

  belongs_to :pickup_order
  belongs_to :user, optional: true

  validates :action, presence: true, inclusion: { in: ACTIONS }

  scope :latest, -> { order(created_at: :desc) }

  def action_display
    {
      'create' => '创建',
      'update' => '更新',
      'submit' => '提交',
      'start_process' => '开始处理',
      'mark_missing' => '标记缺材料',
      'materials_received' => '材料已补充',
      'send_to_review' => '提交复核',
      'complete' => '完成',
      'reject_review' => '复核退回',
      'close' => '关闭',
      'upload_proof' => '上传凭证',
      'add_item' => '添加商品',
      'update_item' => '更新商品',
      'handle_shortage' => '处理短少'
    }[action] || action
  end

  def timestamp_display
    created_at.strftime('%Y-%m-%d %H:%M:%S')
  end

  def user_display
    user&.display_name || '系统'
  end
end
