module Rider
  class BaseController < ApplicationController
    before_action :verify_rider_role!
    layout "application"
  end
end
