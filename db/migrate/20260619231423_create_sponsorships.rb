class CreateSponsorships < ActiveRecord::Migration[8.1]
  def change
    create_table :sponsorships do |t|
      t.references :sponsor, null: false, foreign_key: true
      t.references :performance, null: false, foreign_key: true
      t.decimal :amount
      t.string :sponsorship_type
      t.text :benefits
      t.date :start_date
      t.date :end_date
      t.string :status

      t.timestamps
    end
  end
end
