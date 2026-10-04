# Working rules
- Plan before any change touching more than two files. Prefer the smallest change that fully solves the task.
- One slice per branch and PR. Never push to main.
- No new dependency without approval and a one-line reason.
- Logic gets tests. If something cannot be tested, say how it must be checked by hand.
- No secrets in the repo. No eval, and no innerHTML with dynamic content.
- Never invent facts about this project. If something is not in the repo or docs/design.md, ask.
- Definition of done: tests pass, build passes, git diff reviewed, and a note of anything you could not verify.
