class WasteItem < ApplicationRecord
  belongs_to :waste_report

  validates :product_name, presence: true
  validates :quantity, presence: true, numericality: { greater_than: 0 }
  validates :unit_cost, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :waste_reason, presence: true

  before_save :calculate_subtotal
  after_commit :recalculate_report_totals, on: [:create, :update, :destroy]

  WASTE_REASONS = %w[
    过期变质
    制作失误
    原料损耗
    设备故障
    温度控制不当
    包装破损
    顾客退回
    其他
  ].freeze

  CATEGORIES = %w[
    咖啡豆
    奶制品
    糖浆
    食品
    包装材料
    其他物料
  ].freeze

  def calculate_subtotal
    self.subtotal = quantity.to_i * unit_cost.to_d
  end

  def recalculate_report_totals
    waste_report&.recalculate_totals!
  end
end
