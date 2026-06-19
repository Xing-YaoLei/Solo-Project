class CreateStockAlerts < ActiveRecord::Migration[8.1]
  def change
    create_table :stock_alerts do |t|
      t.references :part, null: false, foreign_key: true
      t.references :work_order, null: false, foreign_key: true
      t.references :work_order_part, null: false, foreign_key: true
      t.text :affected_scope
      t.text :supplementary_note
      t.bigint :handler_id
      t.bigint :reassigned_to_id
      t.string :status, default: 'pending'
      t.datetime :resolved_at

      t.timestamps
    end
  end
end
