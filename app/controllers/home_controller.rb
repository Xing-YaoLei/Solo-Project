class HomeController < ApplicationController
  def index
    redirect_to records_path
  end
end
