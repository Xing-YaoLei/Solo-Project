module ApplicationHelper
  def nav_link_class(path)
    base = "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150"
    active = "bg-gray-700 text-white"
    inactive = "text-gray-300 hover:bg-gray-700 hover:text-white"
    "#{base} #{current_page?(path) ? active : inactive}"
  end

  def mobile_nav_link_class(path)
    base = "block px-3 py-2 rounded-md text-base font-medium transition-colors duration-150"
    active = "bg-gray-700 text-white"
    inactive = "text-gray-300 hover:bg-gray-700 hover:text-white"
    "#{base} #{current_page?(path) ? active : inactive}"
  end

  def channel_display(channel)
    channel_map = {
      "airbnb" => "Airbnb",
      "booking" => "Booking",
      "meituan" => "美团",
      "xiaohongshu" => "小红书",
      "direct" => "直订",
      "other" => "其他"
    }
    channel_map[channel] || channel
  end

  def status_badge(status, color_class, label = nil)
    content_tag(:span, class: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium #{color_class}") do
      label || status
    end
  end
end
