class ContentVersion < ApplicationRecord
  belongs_to :document
  belongs_to :editor, class_name: 'User'

  validates :version, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :content, presence: true

  scope :ordered, -> { order(version: :desc) }
end
