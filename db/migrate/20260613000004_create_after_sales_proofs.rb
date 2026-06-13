class CreateAfterSalesProofs < ActiveRecord::Migration[7.2]
  def change
    create_table :after_sales_proofs do |t|
      t.references :pickup_order, null: false, foreign_key: true
      t.references :pickup_item, foreign_key: true
      t.string :proof_type, null: false
      t.string :description
      t.references :uploaded_by, foreign_key: { to_table: :users }

      t.timestamps
    end
    add_index :after_sales_proofs, :proof_type
  end
end
