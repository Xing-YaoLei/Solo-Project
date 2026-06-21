class CreateExceptionOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :exception_orders do |t|
      t.references :document, null: false, foreign_key: true
      t.string :order_no
      t.text :impact_scope
      t.text :responsibility
      t.string :handling_result
      t.string :status
      t.references :handler, null: true, foreign_key: { to_table: :users }

      t.timestamps
    end
    add_index :exception_orders, :order_no
  end
end
