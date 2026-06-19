class CreateCheckinCodes < ActiveRecord::Migration[8.1]
  def change
    create_table :checkin_codes do |t|
      t.references :ticket, null: false, foreign_key: true
      t.string :code
      t.text :qr_code_data
      t.string :status
      t.datetime :verified_at
      t.datetime :used_at
      t.datetime :expires_at

      t.timestamps
    end
  end
end
