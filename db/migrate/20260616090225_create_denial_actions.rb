class CreateDenialActions < ActiveRecord::Migration[8.1]
  def change
    create_table :denial_actions do |t|
      t.references :settlement, null: false, foreign_key: true
      t.string :action_type
      t.text :reason
      t.jsonb :materials, default: []
      t.references :operator, null: false, foreign_key: { to_table: :users }
      t.datetime :performed_at

      t.timestamps
    end
  end
end
