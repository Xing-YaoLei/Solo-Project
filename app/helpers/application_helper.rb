module ApplicationHelper
  def status_badge_class(status)
    case status
    when 'pending' then 'bg-gray-100 text-gray-800'
    when 'submitted' then 'bg-blue-100 text-blue-800'
    when 'processing' then 'bg-yellow-100 text-yellow-800'
    when 'materials_missing' then 'bg-red-100 text-red-800'
    when 'reviewing' then 'bg-purple-100 text-purple-800'
    when 'completed' then 'bg-green-100 text-green-800'
    when 'closed' then 'bg-gray-100 text-gray-500'
    else 'bg-gray-100 text-gray-800'
    end
  end

  def format_date(date)
    date&.strftime('%Y-%m-%d')
  end

  def format_datetime(datetime)
    datetime&.strftime('%Y-%m-%d %H:%M')
  end

  def format_currency(amount)
    number_to_currency(amount, unit: '¥', precision: 2)
  end

  def percentage(value, total)
    return '0.00%' if total.to_f == 0
    "#{(value.to_f / total * 100).round(2)}%"
  end

  def link_to_add_fields(name, f, association, **options)
    new_object = f.object.send(association).klass.new
    id = new_object.object_id
    fields = f.fields_for(association, new_object, child_index: id) do |builder|
      render(association.to_s.singularize + "_fields", f: builder)
    end
    link_to(name, '#', class: options[:class], data: { id: id, fields: fields.gsub("\n", "") })
  end
end

