class Member < ApplicationRecord
  has_many :course_consumptions, dependent: :restrict_with_error

  validates :name, presence: true
  validates :member_no, presence: true, uniqueness: true

  SOURCE_CHANNELS = %w[offline_promotion online_referral friend_referral corporate_cooperation other].freeze

  def source_channel_label
    I18n.t("members.source_channels.#{source_channel}", default: source_channel)
  end
end
