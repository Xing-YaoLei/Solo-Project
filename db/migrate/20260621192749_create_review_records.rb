class CreateReviewRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :review_records do |t|
      t.references :legal_case, null: false, foreign_key: true
      t.text :content
      t.text :result
      t.text :lessons
      t.datetime :review_date
      t.string :operator

      t.timestamps
    end
  end
end
