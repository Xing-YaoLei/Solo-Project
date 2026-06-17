class CreateInspectionRoutes < ActiveRecord::Migration[7.2]
  def change
    create_table :inspection_routes do |t|
      t.string :name, null: false
      t.string :inspector_name, null: false
      t.datetime :scheduled_at, null: false
      t.datetime :started_at
      t.datetime :completed_at
      t.string :status, null: false, default: "pending"
      t.text :notes

      t.timestamps
    end

    add_index :inspection_routes, :scheduled_at
  end
end
