class GuideContent < ApplicationRecord
  enum :status, { draft: 0, published: 1, archived: 2 }, default: :draft

  has_many :processing_records, as: :recordable
  has_many :todos, as: :source

  validates :title, presence: true
  validates :order_index, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :by_category, ->(category) { where(category: category) if category.present? }
  scope :published, -> { where(status: :published) }
  scope :ordered, -> { order(order_index: :asc) }

  def self.ransackable_attributes(auth_object = nil)
    %w[audio_url category content cover_image created_at duration_minutes id order_index point_of_interest status title updated_at]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[processing_records todos]
  end
end
