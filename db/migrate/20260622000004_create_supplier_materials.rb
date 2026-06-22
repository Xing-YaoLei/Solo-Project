class CreateSupplierMaterials < ActiveRecord::Migration[7.2]
  def change
    create_table :supplier_materials, id: :uuid do |t|
      t.uuid :supplier_id, null: false
      t.string :material_type, null: false, limit: 50
      t.string :name, null: false, limit: 200
      t.enum :status, enum_type: :material_status, default: "pending", null: false
      t.datetime :expire_at
      t.text :remark
      t.uuid :uploaded_by_id

      t.timestamps null: false

      t.index :supplier_id
      t.index :material_type
      t.index :status
      t.index :expire_at
      t.index :uploaded_by_id
    end

    add_foreign_key :supplier_materials, :suppliers
    add_foreign_key :supplier_materials, :users, column: :uploaded_by_id
  end
end
