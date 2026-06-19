class CreateReportDownloads < ActiveRecord::Migration[8.1]
  def change
    create_table :report_downloads do |t|
      t.references :reporter, null: false, foreign_key: { to_table: :users }
      t.string :report_type
      t.jsonb :filters
      t.datetime :generated_at
      t.string :file_name

      t.timestamps
    end
  end
end
