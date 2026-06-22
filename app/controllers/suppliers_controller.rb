class SuppliersController < ApplicationController
  before_action :set_supplier, only: [:show, :edit, :update, :audit_history]

  def index
    authorize Supplier

    add_breadcrumb "供应商管理", suppliers_path
    @page_title = "供应商列表 | 合规审计结算台"

    @q = policy_scope(Supplier).ransack(params[:q])
    @suppliers = @q.result
      .includes(:audits, :materials)
      .order(created_at: :desc)
      .page(params[:page])
      .per(20)
  end

  def show
    authorize @supplier

    add_breadcrumb "供应商管理", suppliers_path
    add_breadcrumb @supplier.name, supplier_path(@supplier)
    @page_title = "#{@supplier.name} | 供应商详情"

    load_supplier_details
  end

  def new
    authorize Supplier
    @supplier = Supplier.new
    @supplier.permission_configs.build
    @supplier.materials.build

    add_breadcrumb "供应商管理", suppliers_path
    add_breadcrumb "新增供应商", nil
    @page_title = "新增供应商"
  end

  def create
    authorize Supplier

    @supplier = Supplier.new(supplier_params)
    @supplier.created_by = current_user

    if @supplier.save
      redirect_to @supplier, notice: "供应商创建成功"
    else
      add_breadcrumb "供应商管理", suppliers_path
      add_breadcrumb "新增供应商", nil
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    authorize @supplier

    add_breadcrumb "供应商管理", suppliers_path
    add_breadcrumb @supplier.name, supplier_path(@supplier)
    add_breadcrumb "编辑", nil
    @page_title = "编辑供应商 - #{@supplier.name}"
  end

  def update
    authorize @supplier

    if @supplier.update(supplier_params)
      respond_to do |format|
        format.html { redirect_to @supplier, notice: "供应商信息更新成功" }
        format.turbo_stream do
          render turbo_stream: [
            turbo_stream.replace("supplier_info", partial: "suppliers/info", locals: { supplier: @supplier }),
            *render_turbo_flash(notice: "供应商信息更新成功")
          ]
        end
      end
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def audit_history
    authorize @supplier, :audit_history?

    @audits = @supplier.audits.includes(:creator, :exception_orders)
      .order(created_at: :desc)
      .page(params[:page])
      .per(10)

    respond_to do |format|
      format.html
      format.turbo_stream do
        render turbo_stream: turbo_stream.replace(
          "audit_history_list",
          partial: "suppliers/audit_history_table",
          locals: { audits: @audits }
        )
      end
    end
  end

  def search
    authorize Supplier, :search?

    keyword = params[:keyword].to_s.strip
    scope = policy_scope(Supplier).search_by_name_or_code(keyword) if keyword.present?
    scope ||= Supplier.none

    @suppliers = scope.limit(10)

    respond_to do |format|
      format.json { render json: @suppliers.map { |s| { id: s.id, name: s.name, code: s.code, label: "#{s.code} - #{s.name}" } } }
      format.turbo_stream do
        render turbo_stream: turbo_stream.replace(
          "supplier_search_results",
          partial: "suppliers/search_results",
          locals: { suppliers: @suppliers }
        )
      end
    end
  end

  private

  def set_supplier
    @supplier = Supplier.find(params[:id])
  end

  def load_supplier_details
    @materials = @supplier.materials.order(created_at: :desc).limit(20)
    @permission_configs = @supplier.permission_configs.order(created_at: :desc)
    @recent_audits = @supplier.audits.includes(:creator)
      .order(created_at: :desc)
      .limit(10)
    @audit_statistics = {
      total: @supplier.audits.count,
      completed: @supplier.audits.completed.count,
      in_progress: @supplier.audits.where.not(status: %w[approved archived rejected]).count,
      exceptions: @supplier.audits.joins(:exception_orders).merge(ExceptionOrder.open).count
    }
  end

  def supplier_params
    params.require(:supplier).permit(
      :name, :code, :contact_person, :phone, :email,
      :status, :description,
      materials_attributes: [:id, :material_type, :name, :status, :expire_at, :remark, :_destroy],
      permission_configs_attributes: [:id, :permission_type, :is_active, :_destroy, access_scope: {}]
    )
  end
end
