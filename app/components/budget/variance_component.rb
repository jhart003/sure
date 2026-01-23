class Budget::VarianceComponent < ApplicationComponent
  attr_reader :variance_data, :currency

  def initialize(variance_data:, currency:)
    @variance_data = variance_data
    @currency = currency
  end

  def period_label
    case variance_data[:period_type]
    when "month"
      variance_data[:start_date].strftime("%B %Y")
    when "quarter"
      "Q#{(variance_data[:start_date].month - 1) / 3 + 1} #{variance_data[:start_date].year}"
    when "year"
      variance_data[:start_date].year.to_s
    else
      "#{variance_data[:start_date].strftime('%b %Y')} - #{variance_data[:end_date].strftime('%b %Y')}"
    end
  end

  def variance_status
    if variance_data[:total_variance] >= 0
      "under_budget"
    else
      "over_budget"
    end
  end

  def variance_color_class
    variance_data[:total_variance] >= 0 ? "text-green-500" : "text-destructive"
  end

  def variance_bg_class
    variance_data[:total_variance] >= 0 ? "bg-green-500" : "bg-destructive"
  end

  def variance_percent_width
    if variance_data[:total_budgeted] == 0
      0
    else
      actual_percent = (variance_data[:total_actual].to_f / variance_data[:total_budgeted]) * 100
      [ [ actual_percent, 0 ].max, 100 ].min
    end
  end
end
