class OversellCommunication < ApplicationRecord
  belongs_to :order
  belongs_to :user, optional: true

  enum :direction, { incoming: "incoming", outgoing: "outgoing", internal: "internal" }
  enum :communication_type, { note: "note",
                              phone: "phone",
                              email: "email",
                              sms: "sms",
                              wechat: "wechat" }

  validates :content, :direction, presence: true

  scope :chronological, -> { order(created_at: :asc) }
  scope :latest_first, -> { order(created_at: :desc) }
end
