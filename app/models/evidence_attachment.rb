class EvidenceAttachment < ApplicationRecord
  belongs_to :legal_case

  has_one_attached :file

  CATEGORIES = %w[起诉状 答辩状 证据材料 判决书 调解书 委托合同 其他].freeze

  validates :name, presence: true
  validates :category, inclusion: { in: CATEGORIES }

  def status_label
    if is_missing?
      "bg-red-100 text-red-800"
    elsif file.attached?
      "bg-green-100 text-green-800"
    else
      "bg-yellow-100 text-yellow-800"
    end
  end

  def status_text
    if is_missing?
      "缺页"
    elsif file.attached?
      "已上传"
    else
      "待上传"
    end
  end
end
