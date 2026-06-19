class CreateTodos < ActiveRecord::Migration[8.1]
  def change
    create_table :todos do |t|
      t.string :title, null: false
      t.text :description
      t.references :assignee, foreign_key: { to_table: :users }
      t.references :creator, foreign_key: { to_table: :users }
      t.integer :status, default: 0
      t.integer :priority, default: 1
      t.date :due_date
      t.references :source, polymorphic: true

      t.timestamps
    end

    add_index :todos, :status
    add_index :todos, :priority
    add_index :todos, :due_date
  end
end
