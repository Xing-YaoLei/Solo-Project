class ChannelsController < ApplicationController
  before_action :set_channel, only: [:show, :edit, :update, :destroy]

  def index
    authorize Channel
    @channels = policy_scope(Channel).order(created_at: :desc)
  end

  def show
    authorize @channel
    @price_rules = @channel.price_rules.active
  end

  def new
    @channel = Channel.new
    authorize @channel
  end

  def create
    @channel = Channel.new(channel_params)
    authorize @channel

    if @channel.save
      redirect_to @channel, notice: "渠道创建成功。"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    authorize @channel
  end

  def update
    authorize @channel

    if @channel.update(channel_params)
      redirect_to @channel, notice: "渠道更新成功。"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @channel
    @channel.destroy
    redirect_to channels_url, notice: "渠道已删除。"
  end

  private

  def set_channel
    @channel = Channel.find(params[:id])
  end

  def channel_params
    params.require(:channel).permit(:name, :code, :description, :status, :commission_rate)
  end
end
