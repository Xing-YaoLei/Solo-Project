module RoleScopable
  extend ActiveSupport::Concern

  class_methods do
    def scope_by_role(user, role = nil)
      role ||= user&.role

      return all if role.blank?
      return all if user&.admin?

      case role.to_sym
      when :merchant
        scope_for_merchant(user)
      when :rider
        scope_for_rider(user)
      when :cs
        scope_for_cs(user)
      when :city_manager
        scope_for_city_manager(user)
      else
        none
      end
    end

    def scope_for_merchant(user)
      return none unless user&.merchant_id

      if column_names.include?("merchant_id")
        where(merchant_id: user.merchant_id)
      else
        joins(:merchant).where(merchants: { id: user.merchant_id })
      end
    end

    def scope_for_rider(user)
      return none unless user&.id

      if column_names.include?("rider_id")
        where(rider_id: user.id)
      elsif column_names.include?("user_id")
        where(user_id: user.id)
      else
        none
      end
    end

    def scope_for_cs(user)
      if column_names.include?("handler_id")
        where(handler_id: user.id).or(where(handler_id: nil))
      else
        all
      end
    end

    def scope_for_city_manager(user)
      return none unless user&.city_id

      if column_names.include?("city_id")
        where(city_id: user.city_id)
      elsif reflections.key?("merchant")
        joins(:merchant).where(merchants: { city_id: user.city_id })
      elsif reflections.key?("user")
        joins(:user).where(users: { city_id: user.city_id })
      else
        all
      end
    end
  end

  def visible_to?(user)
    return true if user&.admin?
    return false unless user

    case user.role.to_sym
    when :merchant
      visible_to_merchant?(user)
    when :rider
      visible_to_rider?(user)
    when :cs
      visible_to_cs?(user)
    when :city_manager
      visible_to_city_manager?(user)
    else
      false
    end
  end

  def editable_by?(user)
    return true if user&.admin?
    return false unless user

    case user.role.to_sym
    when :merchant
      editable_by_merchant?(user)
    when :rider
      editable_by_rider?(user)
    when :cs
      editable_by_cs?(user)
    when :city_manager
      editable_by_city_manager?(user)
    else
      false
    end
  end

  private

  def visible_to_merchant?(user)
    if respond_to?(:merchant_id)
      merchant_id == user.merchant_id
    elsif respond_to?(:merchant)
      merchant&.id == user.merchant_id
    else
      false
    end
  end

  def visible_to_rider?(user)
    if respond_to?(:rider_id)
      rider_id == user.id
    elsif respond_to?(:user_id)
      user_id == user.id
    else
      false
    end
  end

  def visible_to_cs?(user)
    if respond_to?(:handler_id)
      handler_id.nil? || handler_id == user.id
    else
      true
    end
  end

  def visible_to_city_manager?(user)
    return true if user&.city_id.blank?

    if respond_to?(:city_id)
      city_id == user.city_id
    elsif respond_to?(:merchant) && merchant
      merchant.city_id == user.city_id
    elsif respond_to?(:user) && self.user
      self.user.city_id == user.city_id
    else
      true
    end
  end

  def editable_by_merchant?(user)
    visible_to_merchant?(user)
  end

  def editable_by_rider?(user)
    visible_to_rider?(user)
  end

  def editable_by_cs?(user)
    visible_to_cs?(user)
  end

  def editable_by_city_manager?(user)
    visible_to_city_manager?(user)
  end
end
