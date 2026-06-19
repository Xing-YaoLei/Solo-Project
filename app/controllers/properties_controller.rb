class PropertiesController < ApplicationController
  before_action :set_property, only: [:show, :edit, :update, :destroy]

  def index
    @properties = Property.all
  end

  def show
  end

  def new
    @property = Property.new
  end

  def create
    @property = Property.new(property_params)

    if @property.save
      redirect_to @property, notice: "Property was successfully created."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @property.update(property_params)
      redirect_to @property, notice: "Property was successfully updated.", status: :see_other
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @property.destroy
    redirect_to properties_url, notice: "Property was successfully destroyed.", status: :see_other
  end

  private

  def set_property
    @property = Property.find(params[:id])
  end

  def property_params
    params.require(:property).permit(:name, :address, :room_count, :status, :manager_id)
  end
end
