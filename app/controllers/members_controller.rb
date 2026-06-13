class MembersController < ApplicationController
  before_action :set_member, only: [:show, :edit, :update]

  def index
    @q = Member.ransack(params[:q])
    @members = @q.result.order(created_at: :desc).page(params[:page])
  end

  def show; end

  def new
    @member = Member.new
  end

  def edit; end

  def create
    @member = Member.new(member_params)
    if @member.save
      redirect_to @member, notice: "会员已创建"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    if @member.update(member_params)
      redirect_to @member, notice: "会员已更新"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  private

  def set_member
    @member = Member.find(params[:id])
  end

  def member_params
    params.require(:member).permit(:name, :phone, :member_no, :source_channel, :notes)
  end
end
