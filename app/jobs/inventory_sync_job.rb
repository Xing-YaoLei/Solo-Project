class InventorySyncJob < ApplicationJob
  queue_as :inventory

  def perform(package_id = nil)
    if package_id
      package = Package.find_by(id: package_id)
      sync_package_inventory(package) if package
    else
      Package.find_each do |package|
        sync_package_inventory(package)
      end
    end
  end

  private

  def sync_package_inventory(package)
    confirmed_count = package.orders.confirmed.sum(:quantity)
    expected_available = package.total_inventory - confirmed_count

    if package.available_inventory != expected_available
      Rails.logger.info "Inventory mismatch for package #{package.id}: expected #{expected_available}, actual #{package.available_inventory}"
      package.update_column(:available_inventory, [expected_available, 0].max)
    end
  end
end
