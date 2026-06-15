class CreateEnrollments < ActiveRecord::Migration[8.1]
  def change
    create_table :enrollments do |t|
      t.references :user, null: false, foreign_key: true
      t.references :course, null: false, foreign_key: true
      t.references :channel, null: false, foreign_key: true
      t.bigint :order_id, null: true
      t.index :order_id
      t.integer :status
      t.datetime :enrolled_at
      t.datetime :expired_at
      t.decimal :progress
      t.integer :completed_lessons_count
      t.integer :total_lessons_count
      t.boolean :exam_passed
      t.boolean :certificate_issued

      t.timestamps
    end
  end
end
