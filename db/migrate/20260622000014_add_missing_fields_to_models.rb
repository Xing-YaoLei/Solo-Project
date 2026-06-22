class AddMissingFieldsToModels < ActiveRecord::Migration[7.2]
  def change
    add_column :audits, :notification_content, :text
    add_column :audits, :notification_generated_at, :datetime
    add_column :audits, :rejection_reason, :text

    add_column :exception_orders, :auto_generated, :boolean, default: false, null: false

    add_index :audits, :notification_generated_at
    add_index :exception_orders, :auto_generated
  end
end
