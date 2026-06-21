module Manager
  class BaseController < ApplicationController
    before_action :verify_manager_role!
    layout "application"
  end
end
