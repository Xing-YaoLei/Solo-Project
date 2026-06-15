class CreateCertificates < ActiveRecord::Migration[8.1]
  def change
    create_table :certificates do |t|
      t.references :course, null: false, foreign_key: true
      t.string :title
      t.string :template_url
      t.integer :certificate_type
      t.integer :validity_period
      t.integer :status

      t.timestamps
    end
  end
end
