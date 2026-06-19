class CreateInspectionPhotos < ActiveRecord::Migration[8.1]
  def change
    create_table :inspection_photos do |t|
      t.references :work_order, null: false, foreign_key: true
      t.string :photo_type
      t.string :caption
      t.datetime :taken_at
      t.bigint :taken_by_id

      t.timestamps
    end
  end
end
