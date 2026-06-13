class CreateCourseConsumptions < ActiveRecord::Migration[7.2]
  def change
    create_table :course_consumptions do |t|
      t.string :bill_no, null: false
      t.references :member, null: false, foreign_key: true
      t.references :trainer, null: false, foreign_key: true
      t.references :course_package, null: false, foreign_key: true
      t.date :consumption_date, null: false
      t.integer :sessions_consumed, default: 1
      t.integer :sessions_remaining
      t.string :status, null: false, default: "draft"
      t.string :processing_status, default: "normal"
      t.string :responsible_person
      t.string :source_channel
      t.text :review_notes
      t.text :settlement_notes
      t.text :review_summary
      t.datetime :reviewed_at
      t.datetime :settled_at
      t.datetime :closed_at
      t.decimal :progress_rate, precision: 5, scale: 2, default: 0
      t.boolean :is_closed, default: false
      t.timestamps
    end
    add_index :course_consumptions, :bill_no, unique: true
    add_index :course_consumptions, :status
    add_index :course_consumptions, :processing_status
    add_index :course_consumptions, :responsible_person
    add_index :course_consumptions, :source_channel
    add_index :course_consumptions, :consumption_date
  end
end
