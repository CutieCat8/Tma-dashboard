# Project Working Preferences

These instructions apply to every agent session working in this repository.

## Communication

- Communicate with the user in Thai unless the user requests another language.
- Keep progress updates and final summaries concise to conserve usage quota.
- Do not print entire large files or large command outputs when a targeted excerpt is sufficient.

## Scope and token usage

- Read and search only the files relevant to the current task before expanding scope.
- Prefer targeted `rg` searches over broad repository dumps.
- Do not repeat repository-wide analysis that is already documented in `README.md`, Git history, or `plans/`.
- Run focused checks while developing. Run the full typecheck, test suite, and production build once near the end of a coherent feature unless risk requires otherwise.

## Browser and visual QA

- Do not launch Chrome or use browser automation for local visual QA unless the user explicitly asks for it.
- Prefer typecheck, unit tests, build checks, code inspection, and screenshots supplied by the user.
- If visual confirmation is necessary, ask the user to inspect the page or provide a focused screenshot.

## Git workflow

- Work in small, coherent feature increments.
- Prefer several focused commits over one large commit containing unrelated features.
- Each commit should represent one feature, fix, or refactor and use a clear Conventional Commit message.
- Before starting the next independent feature, finish and verify the current feature first.
- Ask for confirmation before committing unless the user has explicitly authorized the commit in the current request.
- Never mix unrelated user changes into a feature commit.

## Session handoff

- Use `README.md`, files under `plans/`, and recent Git history as the primary context for a new session.
- After completing a feature, leave the repository in a clean, documented state so another session can continue without rereading a long chat history.
