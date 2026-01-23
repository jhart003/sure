class BudgetsController < ApplicationController
  before_action :set_budget, only: %i[show edit update]

  def index
    redirect_to_current_month_budget
  end

  def show
    @variance_period_type = params[:variance_period] || "month"

    # Parse variance start date safely
    @variance_start_date = if params[:variance_start].present?
      begin
        Date.parse(params[:variance_start])
      rescue ArgumentError, TypeError
        @budget.start_date
      end
    else
      @budget.start_date
    end

    calculator = Budget::VarianceCalculator.new(
      family: Current.family,
      start_date: @variance_start_date,
      period_type: @variance_period_type
    )
    @variance_data = calculator.calculate
  end

  def edit
    render layout: "wizard"
  end

  def update
    @budget.update!(budget_params)
    redirect_to budget_budget_categories_path(@budget)
  end

  def picker
    render partial: "budgets/picker", locals: {
      family: Current.family,
      year: params[:year].to_i || Date.current.year
    }
  end

  private

    def budget_create_params
      params.require(:budget).permit(:start_date)
    end

    def budget_params
      params.require(:budget).permit(:budgeted_spending, :expected_income)
    end

    def set_budget
      start_date = Budget.param_to_date(params[:month_year])
      @budget = Budget.find_or_bootstrap(Current.family, start_date: start_date)
      raise ActiveRecord::RecordNotFound unless @budget
    end

    def redirect_to_current_month_budget
      current_budget = Budget.find_or_bootstrap(Current.family, start_date: Date.current)
      redirect_to budget_path(current_budget)
    end
end
