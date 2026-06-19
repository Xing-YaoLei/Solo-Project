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
    return if previous_changes.empty?
    return if previous_changes.key?("id") && previous_changes["id"].first.nil?

    current_operator = Current.user || User.first
    tracked_fields = %w[id_type id_number name gender nationality]

    previous_changes.each do |field, (old_val, new_val)|
      next unless tracked_fields.include?(field)

      old_str = old_val.nil? ? "" : old_val.to_s
      new_str = new_val.nil? ? "" : new_val.to_s
      next if old_str == new_str

      document_change_logs.create!(
        operator: current_operator,
        changed_field: field,
        old_value: old_str,
        new_value: new_str
      )
    end
  end
end
