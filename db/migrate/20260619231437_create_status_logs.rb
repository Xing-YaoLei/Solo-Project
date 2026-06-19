class CreateStatusLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :status_logs do |t|
      t.references :trackable, polymorphic: true, null: false
      t.string :event
      t.string :from_state
      t.string :to_state
      t.string :operator
      t.text :reason
      t.text :metadata

      t.timestamps
    end
  end
end
