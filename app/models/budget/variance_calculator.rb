class Budget::VarianceCalculator
  attr_reader :family, :start_date, :period_type

  PERIOD_TYPES = %w[month quarter year].freeze

  def initialize(family:, start_date:, period_type: "month")
    @family = family
    @start_date = start_date.beginning_of_month
    @period_type = period_type
  end

  def calculate
    {
      period_type: period_type,
      start_date: start_date,
      end_date: end_date,
      budgets: budgets_in_period,
      total_budgeted: total_budgeted,
      total_actual: total_actual,
      total_variance: total_variance,
      total_variance_percent: total_variance_percent,
      category_variances: category_variances
    }
  end

  def period
    Period.custom(start_date: start_date, end_date: end_date)
  end

  private

    def end_date
      case period_type
      when "month"
        start_date.end_of_month
      when "quarter"
        start_date.end_of_quarter
      when "year"
        start_date.end_of_year
      else
        start_date.end_of_month
      end
    end

    def budgets_in_period
      @budgets_in_period ||= begin
        budgets = []
        current_date = start_date

        while current_date <= end_date
          budget = Budget.find_or_bootstrap(family, start_date: current_date)
          budgets << budget if budget
          current_date = current_date.next_month.beginning_of_month
        end

        budgets
      end
    end

    def total_budgeted
      budgets_in_period.sum { |b| b.budgeted_spending || 0 }
    end

    def total_actual
      budgets_in_period.sum(&:actual_spending)
    end

    def total_variance
      total_budgeted - total_actual
    end

    def total_variance_percent
      return 0 unless total_budgeted > 0

      (total_variance / total_budgeted.to_f) * 100
    end

    def category_variances
      # Group all budget categories by category across all budgets in the period
      category_data = {}

      budgets_in_period.each do |budget|
        budget.budget_categories.each do |bc|
          next if bc.subcategory?

          category_id = bc.category_id
          category_data[category_id] ||= {
            category: bc.category,
            budgeted: 0,
            actual: 0
          }

          category_data[category_id][:budgeted] += bc.budgeted_spending || 0
          category_data[category_id][:actual] += budget.budget_category_actual_spending(bc)
        end
      end

      # Calculate variance for each category
      category_data.map do |category_id, data|
        variance = data[:budgeted] - data[:actual]
        variance_percent = data[:budgeted] > 0 ? (variance / data[:budgeted].to_f) * 100 : 0

        {
          category: data[:category],
          budgeted: data[:budgeted],
          actual: data[:actual],
          variance: variance,
          variance_percent: variance_percent,
          over_budget: variance < 0
        }
      end.sort_by { |cv| cv[:variance].abs }.reverse
    end
end
