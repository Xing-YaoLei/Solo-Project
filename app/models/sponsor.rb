class Sponsor < ApplicationRecord
  belongs_to :event

  validates :name, presence: true
  validates :level, presence: true, inclusion: { in: %w[platinum gold silver bronze partner] }

  scope :by_level, -> { order(Arel.sql("CASE level WHEN 'platinum' THEN 1 WHEN 'gold' THEN 2 WHEN 'silver' THEN 3 WHEN 'bronze' THEN 4 WHEN 'partner' THEN 5 END")) }

  def self.level_options
    %w[platinum gold silver bronze partner].map { |l| [I18n.t("sponsor.levels.#{l}", default: l.humanize), l] }
  end
end
