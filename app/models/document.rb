class Document < ApplicationRecord
  include AASM

  has_paper_trail

  belongs_to :creator, class_name: 'User'
  belongs_to :reviewer, class_name: 'User', optional: true

  has_many :review_opinions, dependent: :destroy
  has_many :publish_schedules, dependent: :destroy
  has_many :interaction_records, dependent: :destroy
  has_many :risk_word_hits, dependent: :destroy
  has_many :risk_words, through: :risk_word_hits
  has_many :content_versions, dependent: :destroy
  has_many :status_histories, dependent: :destroy
  has_many :exception_orders, dependent: :destroy

  validates :title, :doc_type, :content, presence: true

  DOC_TYPES = {
    'contract' => '合同文书',
    'legal_opinion' => '法律意见书',
    'lawsuit' => '诉讼文书',
    'regulation' => '规章制度',
    'other' => '其他'
  }.freeze

  aasm column: 'status', timestamps: false do
    state :draft, initial: true
    state :pending_review
    state :reviewing
    state :approved
    state :rejected
    state :scheduled
    state :published
    state :archived

    event :submit_for_review do
      transitions from: :draft, to: :pending_review
    end

    event :start_review do
      transitions from: :pending_review, to: :reviewing
    end

    event :approve do
      transitions from: :reviewing, to: :approved
    end

    event :reject do
      transitions from: :reviewing, to: :rejected
    end

    event :resubmit do
      transitions from: :rejected, to: :pending_review
    end

    event :schedule do
      transitions from: :approved, to: :scheduled
    end

    event :publish do
      transitions from: :scheduled, to: :published
    end

    event :archive do
      transitions from: :published, to: :archived
    end

    event :unarchive do
      transitions from: :archived, to: :published
    end
  end

  def status_name
    {
      'draft' => '草稿',
      'pending_review' => '待审核',
      'reviewing' => '审核中',
      'approved' => '审核通过',
      'rejected' => '审核退回',
      'scheduled' => '待发布',
      'published' => '已发布',
      'archived' => '已归档'
    }[status] || status
  end

  def doc_type_name
    DOC_TYPES[doc_type] || doc_type
  end

  def create_content_version(editor, change_summary = nil)
    version = content_versions.maximum(:version).to_i + 1
    content_versions.create!(
      version: version,
      content: content,
      editor: editor,
      change_summary: change_summary
    )
  end

  def record_status_history(operator, from_status, to_status, remark = nil)
    status_histories.create!(
      operator: operator,
      from_status: from_status,
      to_status: to_status,
      remark: remark
    )
  end

  def record_interaction(operator, action_type, content = nil)
    interaction_records.create!(
      operator: operator,
      action_type: action_type,
      content: content
    )
  end

  def scan_risk_words
    risk_word_hits.destroy_all
    RiskWord.all.each do |risk_word|
      next if content.blank?

      index = 0
      while (pos = content.index(risk_word.word, index))
        context_start = [pos - 20, 0].max
        context_end = [pos + risk_word.word.length + 20, content.length].min
        context = content[context_start..context_end]

        risk_word_hits.create!(
          risk_word: risk_word,
          position: pos,
          context: context
        )
        index = pos + 1
      end
    end
    risk_word_hits.count
  end

  def risk_level
    return 'none' if risk_word_hits.empty?

    levels = risk_word_hits.includes(:risk_word).map { |h| h.risk_word.risk_level }
    return 'high' if levels.include?('high')
    return 'medium' if levels.include?('medium')

    'low'
  end

  def risk_level_name
    { 'high' => '高风险', 'medium' => '中风险', 'low' => '低风险', 'none' => '无风险' }[risk_level]
  end

  def latest_review_opinion
    review_opinions.order(reviewed_at: :desc).first
  end

  def latest_publish_schedule
    publish_schedules.order(planned_publish_at: :desc).first
  end

  def self.ransackable_attributes(auth_object = nil)
    %w[title doc_type status created_at updated_at]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[creator reviewer]
  end
end
