# GitHub Workflow Setup (One-Time)

This repository now includes issue templates, PR template, CI checks, and project automation workflows.

## 1) Connect repository to GitHub
If remote is missing:

```bash
git remote add origin <your-repo-url>
git push -u origin main
```

## 2) Create or choose your GitHub Project
Create a project board in GitHub (for example: `Savetime Board`), then copy its URL.

Example URL:
`https://github.com/users/<username>/projects/<number>`

## 3) Create a token for project automation
Create a Personal Access Token (classic) with:
- `repo`
- `project`

## 4) Add repository secret and variable
In `Repository -> Settings -> Secrets and variables -> Actions`:

- Secret: `ADD_TO_PROJECT_PAT` = your PAT token
- Variable: `GH_PROJECT_URL` = your project URL

After this, every new issue/PR is added automatically to the project.

## 5) Recommended repository settings
In `Repository -> Settings -> Branches`, add branch protection for `main`:
- Require pull request before merging
- Require status checks to pass (`CI`, `PR Title Check`)
- Require conversation resolution before merging

In `Repository -> Settings -> General`, prefer merge strategy:
- Enable `Squash merge`
- Disable `Merge commit` (optional but recommended for cleaner history)

## 6) Daily usage
1. Open a `Task`, `Feature request`, or `Bug report`.
2. Work on a branch named with issue number.
3. Open PR using the template and link the issue (`Closes #123`).
4. Merge only after checks pass.
