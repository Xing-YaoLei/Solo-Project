class CreateNotifications < ActiveRecord::Migration[7.2]
  def change
    create_table :notifications, id: :uuid do |t|
      t.uuid :user_id, null: false
      t.uuid :notifiable_id
      t.string :notifiable_type, limit: 50
      t.string :notification_type, null: false, limit: 50
      t.string :title, null: false, limit: 200
      t.text :content
      t.boolean :read, null: false, default: false
      t.datetime :read_at

      t.timestamps null: false

      t.index :user_id
      t.index :read
      t.index [:notifiable_type, :notifiable_id]
      t.index :notification_type
      t.index :created_at
    end

    add_foreign_key :notifications, :users
  end
end
