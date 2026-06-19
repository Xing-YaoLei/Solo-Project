class CreateCleaningTasks < ActiveRecord::Migration[8.1]
  def change
    create_table :cleaning_tasks do |t|
      t.references :property, null: false, foreign_key: true
      t.date :task_date
      t.string :status
      t.references :assignee, null: true, foreign_key: { to_table: :users }
      t.string :priority
      t.text :note

      t.timestamps
    end
    add_index :cleaning_tasks, :status
  end
end
