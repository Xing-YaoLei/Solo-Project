class CreateShortageRecords < ActiveRecord::Migration[7.2]
  def change
    create_table :shortage_records do |t|
      t.references :pickup_order, null: false, foreign_key: true
      t.references :pickup_item, null: false, foreign_key: true
      t.integer :shortage_quantity, null: false, default: 0
      t.string :reason, null: false
      t.string :handling_method
      t.string :status, default: 'pending'
      t.decimal :compensation_amount, precision: 10, scale: 2, default: 0
      t.references :handled_by, foreign_key: { to_table: :users }
      t.datetime :handled_at
      t.text :remark

      t.timestamps
    end
    add_index :shortage_records, :reason
    add_index :shortage_records, :status
  end
end
