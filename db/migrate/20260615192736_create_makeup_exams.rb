class CreateMakeupExams < ActiveRecord::Migration[8.1]
  def change
    create_table :makeup_exams do |t|
      t.references :enrollment, null: false, foreign_key: true
      t.references :exam, null: false, foreign_key: true
      t.references :exam_record, null: false, foreign_key: true
      t.string :reason
      t.integer :status
      t.references :approved_by, null: true, foreign_key: { to_table: :users }
      t.datetime :approved_at
      t.datetime :expires_at

      t.timestamps
    end
  end
end
