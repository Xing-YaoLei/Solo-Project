class CreateReviewTags < ActiveRecord::Migration[7.2]
  def change
    create_table :review_tags do |t|
      t.string :name, null: false
      t.string :color, default: "#3b82f6"
      t.timestamps
    end
    add_index :review_tags, :name, unique: true

    create_table :course_consumption_review_tags do |t|
      t.references :course_consumption, null: false, foreign_key: true
      t.references :review_tag, null: false, foreign_key: true
      t.timestamps
    end
    add_index :course_consumption_review_tags, [:course_consumption_id, :review_tag_id], unique: true, name: "idx_cc_review_tags_uniq"
  end
end
