class CreateFollowUps < ActiveRecord::Migration[8.1]
  def change
    create_table :follow_ups do |t|
      t.references :legal_case, null: false, foreign_key: true
      t.text :content
      t.datetime :follow_date
      t.string :operator
      t.text :next_step

      t.timestamps
    end
  end
end
