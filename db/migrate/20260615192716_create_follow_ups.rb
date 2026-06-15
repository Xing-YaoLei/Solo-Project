class CreateFollowUps < ActiveRecord::Migration[8.1]
  def change
    create_table :follow_ups do |t|
      t.references :enrollment, null: false, foreign_key: true
      t.references :assistant, null: false, foreign_key: { to_table: :users }
      t.string :reason
      t.text :description
      t.datetime :next_follow_up_at
      t.integer :status

      t.timestamps
    end
  end
end
