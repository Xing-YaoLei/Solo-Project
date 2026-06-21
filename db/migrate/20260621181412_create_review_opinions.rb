class CreateReviewOpinions < ActiveRecord::Migration[8.1]
  def change
    create_table :review_opinions do |t|
      t.references :document, null: false, foreign_key: true
      t.references :reviewer, null: false, foreign_key: { to_table: :users }
      t.text :opinion
      t.string :result
      t.datetime :reviewed_at

      t.timestamps
    end
  end
end
