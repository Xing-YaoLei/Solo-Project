class ApplicationController < ActionController::Base
  include Paginatable
  allow_browser versions: :modern
end
