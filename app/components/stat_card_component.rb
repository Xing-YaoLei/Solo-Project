class StatCardComponent < ViewComponent::Base
  def initialize(title:, value:, icon:, trend: nil, trend_value: nil, color: 'blue')
    @title = title
    @value = value
    @icon = icon
    @trend = trend
    @trend_value = trend_value
    @color = color
  end

  def color_classes
    {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-emerald-500 to-emerald-600',
      orange: 'from-amber-500 to-amber-600',
      red: 'from-red-500 to-red-600',
      purple: 'from-violet-500 to-violet-600'
    }[@color.to_sym] || 'from-blue-500 to-blue-600'
  end

  def icon_color_classes
    {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-emerald-100 text-emerald-600',
      orange: 'bg-amber-100 text-amber-600',
      red: 'bg-red-100 text-red-600',
      purple: 'bg-violet-100 text-violet-600'
    }[@color.to_sym] || 'bg-blue-100 text-blue-600'
  end

  def trend_icon
    @trend == 'up' ? 'trending-up' : 'trending-down'
  end

  def trend_color_class
    @trend == 'up' ? 'text-emerald-600' : 'text-red-600'
  end
end
