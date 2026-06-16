class CreateNotifications < ActiveRecord::Migration[8.1]
  def change
    create_table :notifications do |t|
      t.references :user, null: false, foreign_key: true
      t.references :settlement, foreign_key: true
      t.string :title
      t.text :message
      t.string :category
      t.boolean :read, default: false
      t.datetime :sent_at

      t.timestamps
    end
  end
end
