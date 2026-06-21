module Cs
  class BaseController < ApplicationController
    before_action :verify_cs_role!
    layout "application"
  end
end
