class CreateExceptionOrders < ActiveRecord::Migration[7.2]
  def change
    create_table :exception_orders, id: :uuid do |t|
      t.uuid :audit_id, null: false
      t.uuid :handler_id
      t.string :title, null: false, limit: 200
      t.enum :severity, enum_type: :severity_level, default: "medium", null: false
      t.enum :status, enum_type: :exception_status, default: "open", null: false
      t.text :impact_scope
      t.text :responsibility
      t.text :conclusion
      t.jsonb :missing_items, null: false, default: []
      t.datetime :resolved_at
      t.datetime :due_at

      t.timestamps null: false

      t.index :audit_id
      t.index :status
      t.index :handler_id
      t.index :severity
      t.index :resolved_at
      t.index :due_at
      t.index :missing_items, using: :gin
    end

    add_foreign_key :exception_orders, :audits
    add_foreign_key :exception_orders, :users, column: :handler_id
  end
end
