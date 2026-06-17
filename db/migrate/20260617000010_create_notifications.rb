class CreateNotifications < ActiveRecord::Migration[7.2]
  def change
    create_table :notifications do |t|
      t.string :recipient_role, null: false
      t.string :title, null: false
      t.text :message, null: false
      t.string :channel, null: false, default: "in_app"
      t.string :notifiable_type
      t.bigint :notifiable_id
      t.datetime :read_at

      t.timestamps
    end

    add_index :notifications, [:notifiable_type, :notifiable_id]
    add_index :notifications, :recipient_role
    add_index :notifications, :read_at
  end
end
