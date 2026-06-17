class CreateInspectionCheckpoints < ActiveRecord::Migration[7.2]
  def change
    create_table :inspection_checkpoints do |t|
      t.references :inspection_route, null: false, foreign_key: true
      t.string :location, null: false
      t.integer :checkpoint_order, null: false
      t.string :status, null: false, default: "pending"
      t.datetime :checked_at
      t.text :remark

      t.timestamps
    end

    add_index :inspection_checkpoints, [:inspection_route_id, :checkpoint_order], unique: true
  end
end
