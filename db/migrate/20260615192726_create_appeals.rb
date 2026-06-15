class CreateAppeals < ActiveRecord::Migration[8.1]
  def change
    create_table :appeals do |t|
      t.references :enrollment, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.integer :appeal_type
      t.string :title
      t.text :content
      t.integer :status
      t.references :handled_by, null: true, foreign_key: { to_table: :users }
      t.datetime :handled_at
      t.text :handle_result

      t.timestamps
    end
  end
end
