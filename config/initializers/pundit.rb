ActiveSupport.on_load(:action_controller) do
  include Pundit::Authorization
end
