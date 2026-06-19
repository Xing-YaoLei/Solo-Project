class CheckInDocument < ApplicationRecord
  ID_TYPES = %w[id_card passport driver_license other].freeze
  GENDERS = %w[male female other].freeze

  belongs_to :channel_order
  belongs_to :guest
  has_many :document_change_logs, dependent: :destroy

  validates :id_type, inclusion: { in: ID_TYPES }
  validates :name, presence: true
  validates :id_number, presence: true

  after_save :log_changes

  def id_type_i18n
    I18n.t("id_types.#{id_type}", default: id_type)
  end

  def gender_i18n
    I18n.t("genders.#{gender}", default: gender) if gender.present?
  end

  private

  def log_changes
    return unless previous_changes.any?

    current_operator = Current.user || User.first

    previous_changes.each do |field, (old_val, new_val)|
      next if %w[updated_at created_at].include?(field)
      next if old_val == new_val

      document_change_logs.create!(
        operator: current_operator,
        changed_field: field,
        old_value: old_val.to_s,
        new_value: new_val.to_s
      )
    end
  end
end
