class CreateInteractionRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :interaction_records do |t|
      t.references :document, null: false, foreign_key: true
      t.references :operator, null: false, foreign_key: { to_table: :users }
      t.string :action_type
      t.text :content

      t.timestamps
    end
  end
end
