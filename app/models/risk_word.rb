class RiskWord < ApplicationRecord
  has_many :risk_word_hits, dependent: :destroy
  has_many :documents, through: :risk_word_hits

  validates :word, :category, :risk_level, presence: true
  validates :word, uniqueness: true
  validates :risk_level, inclusion: { in: %w[high medium low] }

  CATEGORIES = {
    'sensitive' => '敏感词',
    'legal' => '法律风险',
    'compliance' => '合规风险',
    'privacy' => '隐私风险',
    'other' => '其他'
  }.freeze

  def category_name
    CATEGORIES[category] || category
  end

  def risk_level_name
    { 'high' => '高', 'medium' => '中', 'low' => '低' }[risk_level]
  end

  def self.ransackable_attributes(auth_object = nil)
    %w[word category risk_level description created_at updated_at]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[documents risk_word_hits]
  end
end
