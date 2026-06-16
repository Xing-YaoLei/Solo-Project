class CreateNursingLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :nursing_logs do |t|
      t.references :patient, null: false, foreign_key: true
      t.references :nurse, null: false, foreign_key: { to_table: :users }
      t.references :assessment_record, foreign_key: true
      t.text :content
      t.string :care_type
      t.date :logged_at

      t.timestamps
    end
  end
end
