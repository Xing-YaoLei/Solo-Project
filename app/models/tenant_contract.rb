class TenantContract < ApplicationRecord
  has_paper_trail on: [:update, :destroy], meta: { operator_id: :operator_id }

  belongs_to :tenant
  belongs_to :parking_spot, optional: true

  validates :contract_number, presence: true, uniqueness: true
  validates :start_date, presence: true
  validates :end_date, presence: true
  validates :rent_amount, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validate :end_date_after_start_date

  scope :active, -> { where("start_date <= ? AND end_date >= ?", Date.current, Date.current) }
  scope :expired, -> { where("end_date < ?", Date.current) }

  attr_accessor :operator_id

  def operator_id
    @operator_id || Thread.current[:current_operator_id]
  end

  private

  def end_date_after_start_date
    return if start_date.blank? || end_date.blank?

    errors.add(:end_date, "must be after start date") if end_date < start_date
  end
end
