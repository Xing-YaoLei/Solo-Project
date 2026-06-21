class ModalComponent < ViewComponent::Base
  def initialize(title:, size: 'md', closeable: true)
    @title = title
    @size = size
    @closeable = closeable
  end

  def size_classes
    {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-full mx-4'
    }[@size.to_sym] || 'max-w-lg'
  end
end
