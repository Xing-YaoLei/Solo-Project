class SponsorsController < ApplicationController
  before_action :set_sponsor, only: %i[show edit update destroy]

  def index
    @sponsors = Sponsor.order(:name)
    @sponsors = @sponsors.where(status: params[:status]) if params[:status].present?
    @sponsors = paginate(@sponsors, per_page: 20)
  end

  def show
    @sponsorships = @sponsor.sponsorships.includes(:performance).order(created_at: :desc)
    @status_logs = StatusLog.for_trackable(@sponsor).recent.limit(10)
  end

  def new
    @sponsor = Sponsor.new
  end

  def create
    @sponsor = Sponsor.new(sponsor_params)
    if @sponsor.save
      redirect_to @sponsor, notice: "赞助商创建成功"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @sponsor.update(sponsor_params)
      redirect_to @sponsor, notice: "赞助商更新成功"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @sponsor.destroy
    redirect_to sponsors_url, notice: "赞助商已删除"
  end

  private

  def set_sponsor
    @sponsor = Sponsor.find(params[:id])
  end

  def sponsor_params
    params.require(:sponsor).permit(:name, :contact_person, :contact_phone, :contact_email, :address, :status)
  end
end
