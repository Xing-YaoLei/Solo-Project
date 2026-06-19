class CreateExceptionRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :exception_records do |t|
      t.references :order, null: false, foreign_key: true
      t.references :ticket, null: false, foreign_key: true
      t.string :exception_type
      t.string :title
      t.text :description
      t.text :impact_scope
      t.string :responsible_person
      t.string :assignee
      t.string :status
      t.text :resolution
      t.text :conclusion
      t.datetime :closed_at

      t.timestamps
    end
  end
end
