module Merchants
  class BaseController < ApplicationController
    before_action :verify_merchant_role!
    layout "application"
  end
end
