# Contributing

## Workflow
1. Create an issue using one of the templates (`Bug`, `Feature request`, `Task`).
2. Assign labels/assignee and optionally a milestone.
3. Create a branch from `main`:
   - `feat/<issue-number>-short-name`
   - `fix/<issue-number>-short-name`
   - `chore/<issue-number>-short-name`
4. Open a Pull Request with:
   - semantic title (`feat: ...`, `fix: ...`, `docs: ...`, etc.)
   - `Closes #<issue-number>` in the PR body
5. Wait for CI checks, then merge.

## PR rules
- Keep PRs focused on one issue.
- Update documentation when behavior changes.
- Add test notes in the PR template.
- Prefer squash merge to keep a clean history.

## Commit and PR title format
Use conventional types for clear history:
- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `chore`
- `ci`
- `build`
