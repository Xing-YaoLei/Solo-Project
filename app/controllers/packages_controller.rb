class PackagesController < ApplicationController
  before_action :set_package, only: [:show, :edit, :update, :destroy, :adjust_inventory]

  def index
    authorize Package
    @packages = policy_scope(Package).order(created_at: :desc).page(params[:page]).per(20)
    @packages = @packages.where(status: params[:status]) if params[:status].present?
  end

  def show
    authorize @package
    @price_rules = @package.price_rules.active
    @recent_orders = @package.orders.order(created_at: :desc).limit(10)
  end

  def new
    @package = Package.new
    authorize @package
  end

  def create
    @package = Package.new(package_params)
    authorize @package

    @package.available_inventory = @package.total_inventory

    if @package.save
      redirect_to @package, notice: "套餐创建成功。"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    authorize @package
  end

  def update
    authorize @package

    if @package.update(package_params)
      redirect_to @package, notice: "套餐更新成功。"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @package
    @package.destroy
    redirect_to packages_url, notice: "套餐已删除。"
  end

  def adjust_inventory
    authorize @package

    adjustment = params[:adjustment].to_i
    adjustment_type = params[:adjustment_type]

    if adjustment_type == "increase"
      @package.increment!(:total_inventory, adjustment)
      @package.increment!(:available_inventory, adjustment)
    elsif adjustment_type == "decrease"
      if @package.available_inventory >= adjustment
        @package.decrement!(:total_inventory, adjustment)
        @package.decrement!(:available_inventory, adjustment)
      else
        redirect_to @package, alert: "可用库存不足，无法减少。"
        return
      end
    end

    redirect_to @package, notice: "库存调整成功。"
  end

  private

  def set_package
    @package = Package.find(params[:id])
  end

  def package_params
    params.require(:package).permit(:name, :description, :base_price, :total_inventory, :status, :cover_image)
  end
end
