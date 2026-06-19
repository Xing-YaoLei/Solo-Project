class CreateOversellReviews < ActiveRecord::Migration[8.1]
  def change
    create_table :oversell_reviews do |t|
      t.references :order, null: false, foreign_key: true
      t.references :reviewer, foreign_key: { to_table: :users }

      t.text :review_opinion, null: false
      t.string :resolution, null: false, default: "pending"
      t.datetime :reviewed_at

      t.timestamps
    end

    add_index :oversell_reviews, :resolution
    add_index :oversell_reviews, [:order_id, :created_at]
  end
end
