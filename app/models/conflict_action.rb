class ConflictAction < ApplicationRecord
  belongs_to :room_conflict
  belongs_to :actor, class_name: "User"

  validates :action, presence: true
end
