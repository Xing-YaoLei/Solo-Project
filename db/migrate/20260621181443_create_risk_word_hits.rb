class CreateRiskWordHits < ActiveRecord::Migration[8.1]
  def change
    create_table :risk_word_hits do |t|
      t.references :document, null: false, foreign_key: true
      t.references :risk_word, null: false, foreign_key: true
      t.integer :position
      t.text :context

      t.timestamps
    end
  end
end
