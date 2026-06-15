class CreateQuestions < ActiveRecord::Migration[8.1]
  def change
    create_table :questions do |t|
      t.references :question_bank, null: false, foreign_key: true
      t.integer :question_type
      t.text :content
      t.json :options
      t.text :answer
      t.text :analysis
      t.integer :difficulty
      t.decimal :score
      t.integer :status

      t.timestamps
    end
  end
end
