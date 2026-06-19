class OversellDetectionJob < ApplicationJob
  queue_as :orders

  def perform
    Package.find_each do |package|
      check_package_oversell(package)
    end
  end

  private

  def check_package_oversell(package)
    confirmed_quantity = package.orders.confirmed.sum(:quantity)

    if confirmed_quantity > package.total_inventory
      oversold_amount = confirmed_quantity - package.total_inventory
      Rails.logger.warn "Package #{package.id} is oversold by #{oversold_amount} units"

      package.orders.confirmed.order(created_at: :desc).each do |order|
        next if order.is_oversold?

        if confirmed_quantity - order.quantity <= package.total_inventory
          break
        end

        order.update_column(:is_oversold, true)

        order.oversell_communications.create!(
          direction: :internal,
          communication_type: :note,
          content: "系统检测：由于套餐库存不足，此订单被标记为超卖订单，请及时与客户沟通处理"
        )

        confirmed_quantity -= order.quantity
      end
    end
  end
end
