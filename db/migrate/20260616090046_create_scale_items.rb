class CreateScaleItems < ActiveRecord::Migration[8.1]
  def change
    create_table :scale_items do |t|
      t.references :scale, null: false, foreign_key: { to_table: :assessment_scales }
      t.string :name
      t.string :category
      t.decimal :weight, default: 1.0
      t.jsonb :scoring_rule
      t.integer :sort_order, default: 0

      t.timestamps
    end
  end
end
