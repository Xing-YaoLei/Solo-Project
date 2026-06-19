class SponsorshipsController < ApplicationController
  before_action :set_sponsor
  before_action :set_sponsorship, only: %i[show edit update destroy]

  def index
    @sponsorships = Sponsorship.includes(:sponsor, :performance).order(created_at: :desc)
    @sponsorships = @sponsorships.where(status: params[:status]) if params[:status].present?
    @sponsorships = @sponsorships.where(sponsorship_type: params[:sponsorship_type]) if params[:sponsorship_type].present?
    @sponsorships = paginate(@sponsorships, per_page: 20)
  end

  def show
    @status_logs = StatusLog.for_trackable(@sponsorship).recent.limit(10)
  end

  def new
    @sponsorship = @sponsor.sponsorships.build
    @performances = Performance.order(:start_time)
  end

  def create
    @sponsorship = @sponsor.sponsorships.build(sponsorship_params)
    if @sponsorship.save
      redirect_to @sponsor, notice: "赞助记录创建成功"
    else
      @performances = Performance.order(:start_time)
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    @performances = Performance.order(:start_time)
  end

  def update
    if @sponsorship.update(sponsorship_params)
      redirect_to [@sponsor, @sponsorship], notice: "赞助记录更新成功"
    else
      @performances = Performance.order(:start_time)
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @sponsorship.destroy
    redirect_to @sponsor, notice: "赞助记录已删除"
  end

  private

  def set_sponsor
    @sponsor = Sponsor.find(params[:sponsor_id])
  end

  def set_sponsorship
    @sponsorship = @sponsor.sponsorships.find(params[:id])
  end

  def sponsorship_params
    params.require(:sponsorship).permit(:performance_id, :amount, :sponsorship_type, :benefits, :start_date, :end_date, :status)
  end
end
