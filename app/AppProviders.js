import AuthContextProvider from "../store/auth-context";
import BudgetContextProvider from "../store/budget-context";
import CustomizationContextProvider from "../store/customization-context";
import ExpenseCategoriesContextProvider from "../store/expense-categories-context";
import ExpensesContextProvider from "../store/expenses-context";
import GoalsContextProvider from "../store/goals-context";
import LanguageContextProvider from "../store/language-context";
import PaymentContextProvider from "../store/payment-context";
import ThemeContextProvider from "../store/theme-context";

export default function AppProviders({ children }) {
  return (
    <AuthContextProvider>
      <LanguageContextProvider>
        <ThemeContextProvider>
          <CustomizationContextProvider>
            <ExpenseCategoriesContextProvider>
              <BudgetContextProvider>
                <PaymentContextProvider>
                  <GoalsContextProvider>
                    <ExpensesContextProvider>{children}</ExpensesContextProvider>
                  </GoalsContextProvider>
                </PaymentContextProvider>
              </BudgetContextProvider>
            </ExpenseCategoriesContextProvider>
          </CustomizationContextProvider>
        </ThemeContextProvider>
      </LanguageContextProvider>
    </AuthContextProvider>
  );
}
