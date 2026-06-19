class PriceRulesController < ApplicationController
  before_action :set_price_rule, only: [:show, :edit, :update, :destroy]
  before_action :set_package, only: [:index, :new, :create]
  before_action :set_channel, only: [:index]

  def index
    authorize PriceRule
    scope = PriceRule.all
    scope = scope.where(package_id: @package.id) if @package
    scope = scope.where(channel_id: @channel.id) if @channel
    @price_rules = scope.order(created_at: :desc)
  end

  def show
    authorize @price_rule
  end

  def new
    @price_rule = PriceRule.new(package: @package)
    authorize @price_rule
  end

  def create
    @price_rule = PriceRule.new(price_rule_params)
    @price_rule.package = @package if @package
    authorize @price_rule

    if @price_rule.save
      redirect_to package_price_rules_path(@package || @price_rule.package), notice: "价格规则创建成功。"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    authorize @price_rule
  end

  def update
    authorize @price_rule

    if @price_rule.update(price_rule_params)
      redirect_to @price_rule, notice: "价格规则更新成功。"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @price_rule
    package = @price_rule.package
    @price_rule.destroy
    redirect_to package_price_rules_path(package), notice: "价格规则已删除。"
  end

  private

  def set_price_rule
    @price_rule = PriceRule.find(params[:id])
  end

  def set_package
    @package = Package.find(params[:package_id]) if params[:package_id].present?
  end

  def set_channel
    @channel = Channel.find(params[:channel_id]) if params[:channel_id].present?
  end

  def price_rule_params
    params.require(:price_rule).permit(:name, :rule_type, :value, :channel_id,
                                        :start_date, :end_date, :min_quantity, :status)
  end
end
