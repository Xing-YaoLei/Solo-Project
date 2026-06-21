class FilterConfig < ApplicationRecord
  belongs_to :user

  validates :name, presence: true
  validates :target_model, presence: true

  scope :by_user, ->(user_id) { where(user_id: user_id) }
  scope :by_target_model, ->(target_model) { where(target_model: target_model) }
  scope :default, -> { where(is_default: true) }
  scope :active, -> { where(is_default: [true, false]) }
end
