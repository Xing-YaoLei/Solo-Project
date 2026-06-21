class PublishSchedule < ApplicationRecord
  belongs_to :document

  validates :planned_publish_at, :channel, presence: true

  CHANNELS = {
    'internal' => '内部系统',
    'official_website' => '官网',
    'wechat' => '微信公众号',
    'email' => '邮件通知',
    'other' => '其他'
  }.freeze

  def channel_name
    CHANNELS[channel] || channel
  end

  def published?
    actual_publish_at.present?
  end
end
