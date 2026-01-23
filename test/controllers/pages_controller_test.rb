require "test_helper"

class PagesControllerTest < ActionDispatch::IntegrationTest
  include EntriesTestHelper

  setup do
    sign_in @user = users(:family_admin)
    @family = @user.family
  end

  test "dashboard" do
    get root_path
    assert_response :ok
  end

  test "dashboard renders sankey chart with subcategories" do
    # Create parent category with subcategory
    parent_category = @family.categories.create!(name: "Shopping", classification: "expense", color: "#FF5733")
    subcategory = @family.categories.create!(name: "Groceries", classification: "expense", parent: parent_category, color: "#33FF57")

    # Create transactions using helper
    create_transaction(account: @family.accounts.first, name: "General shopping", amount: 100, category: parent_category)
    create_transaction(account: @family.accounts.first, name: "Grocery store", amount: 50, category: subcategory)

    get root_path
    assert_response :ok
    assert_select "[data-controller='sankey-chart']"
  end

  test "dashboard renders outflows donut chart with colors for each category" do
    # Create multiple categories with different colors
    food_category = @family.categories.create!(name: "Food", classification: "expense", color: "#FF5733")
    transport_category = @family.categories.create!(name: "Transport", classification: "expense", color: "#33FF57")
    entertainment_category = @family.categories.create!(name: "Entertainment", classification: "expense", color: "#3357FF")

    # Create transactions for each category
    create_transaction(account: @family.accounts.first, name: "Restaurant", amount: 100, category: food_category)
    create_transaction(account: @family.accounts.first, name: "Uber", amount: 50, category: transport_category)
    create_transaction(account: @family.accounts.first, name: "Movie", amount: 30, category: entertainment_category)

    get root_path
    assert_response :ok
    
    # Verify the outflows donut chart controller is present
    assert_select "[data-controller='outflows-donut-chart']"
    
    # Verify that the data includes all three categories with their colors
    response_body = @response.body
    assert_match /Food/, response_body
    assert_match /Transport/, response_body
    assert_match /Entertainment/, response_body
    assert_match /#FF5733/, response_body # Food color
    assert_match /#33FF57/, response_body # Transport color
    assert_match /#3357FF/, response_body # Entertainment color
  end

  test "changelog" do
    VCR.use_cassette("git_repository_provider/fetch_latest_release_notes") do
      get changelog_path
      assert_response :ok
    end
  end

  test "changelog with nil release notes" do
    # Mock the GitHub provider to return nil (simulating API failure or no releases)
    github_provider = mock
    github_provider.expects(:fetch_latest_release_notes).returns(nil)
    Provider::Registry.stubs(:get_provider).with(:github).returns(github_provider)

    get changelog_path
    assert_response :ok
    assert_select "h2", text: "Release notes unavailable"
    assert_select "a[href='https://github.com/we-promise/sure/releases']"
  end

  test "changelog with incomplete release notes" do
    # Mock the GitHub provider to return incomplete data (missing some fields)
    github_provider = mock
    incomplete_data = {
      avatar: nil,
      username: "maybe-finance",
      name: "Test Release",
      published_at: nil,
      body: nil
    }
    github_provider.expects(:fetch_latest_release_notes).returns(incomplete_data)
    Provider::Registry.stubs(:get_provider).with(:github).returns(github_provider)

    get changelog_path
    assert_response :ok
    assert_select "h2", text: "Test Release"
    # Should not crash even with nil values
  end
end
