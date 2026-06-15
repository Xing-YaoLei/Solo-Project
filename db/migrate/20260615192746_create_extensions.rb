class CreateExtensions < ActiveRecord::Migration[8.1]
  def change
    create_table :extensions do |t|
      t.references :enrollment, null: false, foreign_key: true
      t.string :reason
      t.integer :extend_days
      t.datetime :original_expired_at
      t.datetime :new_expired_at
      t.integer :status
      t.references :approved_by, null: true, foreign_key: { to_table: :users }
      t.datetime :approved_at

      t.timestamps
    end
  end
end
