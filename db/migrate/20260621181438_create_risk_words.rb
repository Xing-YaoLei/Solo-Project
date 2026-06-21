class CreateRiskWords < ActiveRecord::Migration[8.1]
  def change
    create_table :risk_words do |t|
      t.string :word
      t.string :category
      t.string :risk_level
      t.text :description

      t.timestamps
    end
    add_index :risk_words, :word
  end
end
