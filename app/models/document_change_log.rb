class DocumentChangeLog < ApplicationRecord
  belongs_to :check_in_document
  belongs_to :operator, class_name: "User"

  validates :changed_field, presence: true
  validates :old_value, presence: true
  validates :new_value, presence: true

  scope :for_document, ->(doc_id) { where(check_in_document_id: doc_id) }
  scope :recent, -> { order(created_at: :desc) }

  def changed_field_i18n
    I18n.t("document_fields.#{changed_field}", default: changed_field.humanize)
  end
end
