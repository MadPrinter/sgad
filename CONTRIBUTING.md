# Contributing

SGAD accepts three kinds of contributions:

- Documentation fixes and examples.
- Workflow improvements that make AI agents safer or more effective.
- Tool adapters for specific assistants and IDEs.

## Small Changes

Small documentation fixes can be submitted directly.

## Larger Changes

For changes that affect workflow, governance policy, schemas, or CLI behavior:

1. Create `openspec/changes/<change-id>/`.
2. Add `proposal.md`, `design.md`, `tasks.md`, and test notes.
3. Classify the change risk.
4. Update `sgad/evidence-matrix.md` if behavior changes.
5. Run:

```bash
npm run check
```

## AI-Generated Contributions

AI-generated code is welcome when the contribution documents:

- assistant and model used
- prompts or workflow summary
- tests run
- known limitations

SGAD values evidence over claims.
