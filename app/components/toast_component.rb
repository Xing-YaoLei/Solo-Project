class ToastComponent < ViewComponent::Base
  def initialize(message: nil, type: 'info', duration: 3000)
    @message = message
    @type = type
    @duration = duration
  end

  def render?
    @message.present?
  end

  def type_classes
    {
      info: 'bg-blue-500',
      success: 'bg-[#10b981]',
      warning: 'bg-[#f59e0b]',
      error: 'bg-[#ef4444]'
    }[@type.to_sym] || 'bg-blue-500'
  end

  def icon
    {
      info: 'info',
      success: 'check-circle',
      warning: 'alert-triangle',
      error: 'x-circle'
    }[@type.to_sym] || 'info'
  end
end
