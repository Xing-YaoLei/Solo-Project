class CreateGuideContents < ActiveRecord::Migration[8.1]
  def change
    create_table :guide_contents do |t|
      t.string :title, null: false
      t.text :content
      t.integer :duration_minutes
      t.integer :order_index, default: 0
      t.string :category
      t.integer :status, default: 0
      t.string :point_of_interest
      t.string :audio_url
      t.string :cover_image

      t.timestamps
    end

    add_index :guide_contents, :category
    add_index :guide_contents, :status
    add_index :guide_contents, :order_index
  end
end
