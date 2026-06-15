class CreateLiveSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :live_sessions do |t|
      t.references :course, null: false, foreign_key: true
      t.string :title
      t.text :description
      t.datetime :start_time
      t.datetime :end_time
      t.string :stream_url
      t.string :playback_url
      t.integer :status

      t.timestamps
    end
  end
end
