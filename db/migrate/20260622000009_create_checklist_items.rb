class CreateChecklistItems < ActiveRecord::Migration[7.2]
  def change
    create_table :checklist_items, id: :uuid do |t|
      t.uuid :audit_id, null: false
      t.string :item_code, null: false, limit: 50
      t.text :content, null: false
      t.string :status, null: false, default: "pending", limit: 20
      t.text :evidence_required
      t.text :remark
      t.integer :sort_order, default: 0
      t.uuid :checked_by_id
      t.datetime :checked_at

      t.timestamps null: false

      t.index :audit_id
      t.index :item_code
      t.index :status
      t.index :sort_order
      t.index :checked_by_id
    end

    add_foreign_key :checklist_items, :audits
    add_foreign_key :checklist_items, :users, column: :checked_by_id
  end
end
