class CreateOversellCommunications < ActiveRecord::Migration[8.1]
  def change
    create_table :oversell_communications do |t|
      t.references :order, null: false, foreign_key: true
      t.references :user, foreign_key: true

      t.string :direction, null: false
      t.text :content, null: false
      t.string :communication_type, default: "note"

      t.timestamps
    end

    add_index :oversell_communications, :direction
    add_index :oversell_communications, [:order_id, :created_at]
  end
end
