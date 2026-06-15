class CreateQaThreads < ActiveRecord::Migration[8.1]
  def change
    create_table :qa_threads do |t|
      t.references :enrollment, null: false, foreign_key: true
      t.references :lesson, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :title
      t.text :content
      t.integer :status
      t.datetime :last_reply_at

      t.timestamps
    end
  end
end
