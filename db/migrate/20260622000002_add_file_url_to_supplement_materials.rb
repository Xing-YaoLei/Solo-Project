class AddFileUrlToSupplementMaterials < ActiveRecord::Migration[8.1]
  def change
    add_column :supplement_materials, :file_url, :string
  end
end
