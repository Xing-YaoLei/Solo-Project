module Api
  class BaseController < ApplicationController
    protect_from_forgery with: :null_session
    before_action :authenticate_user_from_token!

    respond_to :json

    private

    def authenticate_user_from_token!
      token = request.headers["Authorization"]&.split(" ")&.last
      return unless token

      user = User.find_by(authentication_token: token)
      sign_in(user, store: false) if user
    end
  end
end
