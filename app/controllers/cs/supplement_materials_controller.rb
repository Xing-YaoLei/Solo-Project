module Cs
  class SupplementMaterialsController < BaseController
    before_action :set_discrepancy, only: [:create]
    before_action :set_supplement_material, only: [:show, :destroy]

    def index
      authorize SupplementMaterial, :index?

      @q = policy_scope(SupplementMaterial).ransack(params[:q])
      scope = @q.result.includes(:discrepancy, :uploader).recent
      @pagy, @supplement_materials = pagy(scope)
    end

    def show
      authorize @supplement_material, :show?
    end

    def create
      authorize SupplementMaterial, :create?

      service = DiscrepancyResolutionService.new(@discrepancy, current_user)

      begin
        service.supplement_material(params[:description], params[:file_url])
        redirect_to cs_discrepancy_path(@discrepancy), notice: "补充材料已上传。"
      rescue StandardError => e
        redirect_to cs_discrepancy_path(@discrepancy), alert: "上传失败: #{e.message}"
      end
    end

    def destroy
      authorize @supplement_material, :destroy?

      @supplement_material.destroy
      redirect_to cs_discrepancy_path(@supplement_material.discrepancy), notice: "补充材料已删除。"
    end

    private

    def set_discrepancy
      @discrepancy = policy_scope(Discrepancy).find(params[:discrepancy_id])
    end

    def set_supplement_material
      @supplement_material = policy_scope(SupplementMaterial).find(params[:id])
    end

    def supplement_material_params
      params.require(:supplement_material).permit(:description, :file_url)
    end
  end
end
