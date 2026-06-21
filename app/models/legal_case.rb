class LegalCase < ApplicationRecord
  include AASM

  belongs_to :client
  has_many :case_stages, -> { order(order: :asc) }, dependent: :destroy
  has_many :evidence_attachments, dependent: :destroy
  has_many :status_transitions, dependent: :destroy
  has_many :follow_ups, -> { order(follow_date: :desc) }, dependent: :destroy
  has_many :review_records, -> { order(review_date: :desc) }, dependent: :destroy

  has_many_attached :files

  validates :title, presence: true
  validates :status, presence: true

  SOURCE_CHANNELS = %w[线上推广 客户转介 律所合作 企业合作 其他].freeze
  CATEGORIES = %w[民事 刑事 行政 商事 劳动 婚姻家庭 知识产权 其他].freeze

  aasm column: :status, whiny_transitions: false do
    state :draft, initial: true, display: "草稿"
    state :pending, display: "待处理"
    state :in_progress, display: "处理中"
    state :material_missing, display: "补资料"
    state :review_required, display: "升级复核"
    state :completed, display: "已完成"
    state :closed, display: "已关闭"

    event :submit do
      transitions from: :draft, to: :pending, after: :record_transition
    end

    event :start_processing do
      transitions from: :pending, to: :in_progress, after: :record_transition
    end

    event :request_materials do
      transitions from: [:pending, :in_progress], to: :material_missing, after: :record_transition
    end

    event :materials_received do
      transitions from: :material_missing, to: :in_progress, after: :record_transition
    end

    event :escalate_review do
      transitions from: [:pending, :in_progress, :material_missing], to: :review_required, after: :record_transition
    end

    event :review_approved do
      transitions from: :review_required, to: :in_progress, after: :record_transition
    end

    event :complete do
      transitions from: [:in_progress, :review_required], to: :completed, after: :record_transition
    end

    event :close do
      transitions from: :completed, to: :closed, after: :record_transition
    end

    event :reopen do
      transitions from: [:completed, :closed], to: :in_progress, after: :record_transition
    end
  end

  scope :active, -> { where.not(status: %i[completed closed]) }
  scope :need_materials, -> { where(status: :material_missing) }
  scope :under_review, -> { where(status: :review_required) }
  scope :finished, -> { where(status: %i[completed closed]) }
  scope :by_channel, ->(channel) { where(source_channel: channel) if channel.present? }
  scope :by_responsible, ->(person) { where(responsible_person: person) if person.present? }

  def status_label
    case status.to_sym
    when :draft then "bg-gray-100 text-gray-800"
    when :pending then "bg-yellow-100 text-yellow-800"
    when :in_progress then "bg-blue-100 text-blue-800"
    when :material_missing then "bg-red-100 text-red-800"
    when :review_required then "bg-purple-100 text-purple-800"
    when :completed then "bg-green-100 text-green-800"
    when :closed then "bg-slate-200 text-slate-700"
    end
  end

  def status_text
    aasm.human_state
  end

  private

  def record_transition(**args)
    operator = args[:operator] || "系统"
    reason = args[:reason]
    status_transitions.create!(
      from_status: aasm.from_state,
      to_status: aasm.to_state,
      operator: operator,
      reason: reason
    )
  end
end
