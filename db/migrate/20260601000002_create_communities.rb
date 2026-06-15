class CreateCommunities < ActiveRecord::Migration[7.2]
  def change
    create_table :communities do |t|
      t.string :name, null: false
      t.string :course_name
      t.text :description
      t.string :status, default: "active"
      t.references :manager, foreign_key: { to_table: :users }
      t.date :start_date
      t.date :end_date
      t.timestamps
    end
  end
end
