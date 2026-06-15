class CreateCertificateIssuances < ActiveRecord::Migration[8.1]
  def change
    create_table :certificate_issuances do |t|
      t.references :certificate, null: false, foreign_key: true
      t.references :enrollment, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.datetime :issued_at
      t.string :certificate_no
      t.integer :status

      t.timestamps
    end
  end
end
