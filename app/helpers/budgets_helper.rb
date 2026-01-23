module BudgetsHelper
  def available_variance_months(budget)
    # Get available months for variance selection
    # Go back up to 2 years or to the oldest budget date
    oldest_date = [
      2.years.ago.beginning_of_month,
      budget.family.oldest_entry_date&.beginning_of_month || 2.years.ago.beginning_of_month
    ].min
    current_month = Date.current.beginning_of_month

    months = []
    date = oldest_date
    while date <= current_month
      months << date
      date = date.next_month.beginning_of_month
    end

    months.reverse
  end
end
