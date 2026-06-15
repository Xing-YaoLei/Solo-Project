class CreateQuestionBanks < ActiveRecord::Migration[8.1]
  def change
    create_table :question_banks do |t|
      t.references :course, null: false, foreign_key: true
      t.string :title
      t.text :description
      t.integer :question_count
      t.integer :status

      t.timestamps
    end
  end
end
