class PartsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_part, only: %i[show edit update destroy]

  def index
    @q = Part.ransack(params[:q])

    case params[:filter]
    when 'low_stock'
      @parts = @q.result.low_stock
    when 'out_of_stock'
      @parts = @q.result.out_of_stock
    else
      @parts = @q.result
    end

    @pagy, @parts = pagy(@parts.order(created_at: :desc))
  end

  def show
  end

  def new
    @part = Part.new
  end

  def edit
  end

  def create
    @part = Part.new(part_params)

    respond_to do |format|
      if @part.save
        format.html { redirect_to @part, notice: 'Part was successfully created.' }
        format.turbo_stream { redirect_to @part, notice: 'Part was successfully created.' }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.turbo_stream { render :new, status: :unprocessable_entity }
      end
    end
  end

  def update
    respond_to do |format|
      if @part.update(part_params)
        format.html { redirect_to @part, notice: 'Part was successfully updated.', status: :see_other }
        format.turbo_stream { redirect_to @part, notice: 'Part was successfully updated.', status: :see_other }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.turbo_stream { render :edit, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @part.destroy
    respond_to do |format|
      format.html { redirect_to parts_url, notice: 'Part was successfully destroyed.', status: :see_other }
      format.turbo_stream { redirect_to parts_url, notice: 'Part was successfully destroyed.', status: :see_other }
    end
  end

  private

  def set_part
    @part = Part.find(params[:id])
  end

  def part_params
    params.require(:part).permit(:sku, :name, :description, :cost_price, :selling_price, :stock_quantity, :safety_stock)
  end
end
