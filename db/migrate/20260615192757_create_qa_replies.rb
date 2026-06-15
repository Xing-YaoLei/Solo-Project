class CreateQaReplies < ActiveRecord::Migration[8.1]
  def change
    create_table :qa_replies do |t|
      t.references :qa_thread, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.text :content
      t.boolean :is_instructor

      t.timestamps
    end
  end
end
