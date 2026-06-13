class TrainersController < ApplicationController
  before_action :set_trainer, only: [:show, :edit, :update]

  def index
    @q = Trainer.ransack(params[:q])
    @trainers = @q.result.order(created_at: :desc).page(params[:page])
  end

  def show; end

  def new
    @trainer = Trainer.new
  end

  def edit; end

  def create
    @trainer = Trainer.new(trainer_params)
    if @trainer.save
      redirect_to @trainer, notice: "教练已创建"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    if @trainer.update(trainer_params)
      redirect_to @trainer, notice: "教练已更新"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  private

  def set_trainer
    @trainer = Trainer.find(params[:id])
  end

  def trainer_params
    params.require(:trainer).permit(:name, :employee_no, :phone, :specialty, :active)
  end
end
