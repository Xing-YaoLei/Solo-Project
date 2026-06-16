class Notification < ApplicationRecord
  belongs_to :user
  belongs_to :settlement, optional: true

  scope :unread, -> { where(read: false) }
end
