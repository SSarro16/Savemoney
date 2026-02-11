# Mini E2E Future - Account A/B Isolation

Target framework suggestion: Detox.

## Scenario 1 - Recurring + Template Isolation
1. Login with account A.
2. Create 1 recurring item and 1 quick-add template.
3. Logout.
4. Login with new account B.
5. Open Recurring and Quick Add screens.
6. Verify B sees zero items created by A.

Expected result:
- No recurring item from A is visible in B.
- No quick-add template from A is visible in B.

## Scenario 2 - Quick Add Functional Smoke
1. Create one manual expense.
2. Save it as template.
3. Reuse template via Quick Add.
4. Trigger quick add from a habit/subscription.
5. Delete expense and use Undo.

Expected result:
- No crash.
- Values remain consistent after each action.

## Scenario 3 - Export + Insights
1. Open Insights.
2. Export current month report.
3. Verify success feedback and formatted currency in current locale.

Expected result:
- Export completes.
- Values are formatted with locale-aware currency.
