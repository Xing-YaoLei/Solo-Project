class ClientsController < ApplicationController
  include Pagy::Backend

  def index
    @clients = Client.order(created_at: :desc)
    @clients = @clients.search(params[:keyword]) if params[:keyword].present?
    @pagy, @clients = pagy(@clients, items: 20)
  end

  def show
    @client = Client.find(params[:id])
    @cases = @client.legal_cases.order(created_at: :desc)
  end

  def new
    @client = Client.new
  end

  def edit
    @client = Client.find(params[:id])
  end

  def create
    @client = Client.new(client_params)
    if @client.save
      if params[:redirect_to_case]
        redirect_to new_case_path(client_id: @client.id), notice: "客户创建成功"
      else
        redirect_to @client, notice: "客户创建成功"
      end
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    @client = Client.find(params[:id])
    if @client.update(client_params)
      redirect_to @client, notice: "客户更新成功"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @client = Client.find(params[:id])
    @client.destroy
    redirect_to clients_path, notice: "客户已删除"
  end

  def search
    @clients = Client.search(params[:keyword]).limit(10)
    render json: @clients.map { |c| { id: c.id, name: c.name, phone: c.phone, label: c.display_name } }
  end

  private

  def client_params
    params.require(:client).permit(:name, :phone, :id_number, :email, :address, :source_channel, :contact_person, :notes)
  end
end
