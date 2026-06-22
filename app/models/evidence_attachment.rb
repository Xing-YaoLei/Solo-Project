class EvidenceAttachment < ApplicationRecord
  include Searchable

  belongs_to :audit
  belongs_to :uploader, class_name: "User"
  has_one_attached :file

  has_paper_trail only: [:name, :file_type, :description, :evidence_type]

  validates :name, presence: true, length: { maximum: 200 }
  validates :file_type, length: { maximum: 100 }, allow_blank: true
  validates :evidence_type, length: { maximum: 50 }, allow_blank: true
  validates :file, presence: true

  validate :file_size_validation
  validate :file_type_validation

  scope :by_evidence_type, ->(type) { where(evidence_type: type) }
  scope :by_uploader, ->(uploader_id) { where(uploader_id: uploader_id) }
  scope :uploaded_between, ->(start_date, end_date) { where(created_at: start_date.beginning_of_day..end_date.end_of_day) }
  scope :recent, -> { order(created_at: :desc).limit(20) }

  EVIDENCE_TYPES = %w[
    contract
    invoice
    report
    certificate
    screenshot
    email
    meeting_minutes
    other
  ].freeze

  ALLOWED_FILE_TYPES = %w[
    application/pdf
    image/jpeg
    image/png
    image/gif
    application/msword
    application/vnd.openxmlformats-officedocument.wordprocessingml.document
    application/vnd.ms-excel
    application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
    application/vnd.ms-powerpoint
    application/vnd.openxmlformats-officedocument.presentationml.presentation
    text/plain
    text/csv
  ].freeze

  MAX_FILE_SIZE = 50.megabytes

  def self.evidence_type_options
    EVIDENCE_TYPES.map { |type| [I18n.t("evidence_types.#{type}", default: type.humanize), type] }
  end

  def file_url
    return nil unless file.attached?
    Rails.application.routes.url_helpers.rails_storage_proxy_url(file, only_path: true)
  end

  def image?
    file.attached? && file.content_type.start_with?("image/")
  end

  def pdf?
    file.attached? && file.content_type == "application/pdf"
  end

  def previewable?
    image? || pdf?
  end

  def file_size_human
    return nil unless file_size.present?
    ActiveSupport::NumberHelper.number_to_human_size(file_size)
  end

  private

  def file_size_validation
    return unless file.attached? && file.blob.byte_size > MAX_FILE_SIZE
    errors.add(:file, "文件大小不能超过 50MB")
  end

  def file_type_validation
    return unless file.attached? && !ALLOWED_FILE_TYPES.include?(file.content_type)
    errors.add(:file, "不支持的文件类型")
  end
end
