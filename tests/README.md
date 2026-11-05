# Tests

Run all unit tests with `pnpm test`. This uses the built-in Node test runner (`node --experimental-strip-types --test tests/*.test.ts`).

- Tests live in `tests/*.test.ts`. The glob is not recursive, so a test in a subfolder will not run.
- Node strips types rather than compiling, so test files and the modules they import must use erasable TypeScript only: no enums, parameter properties or namespaces.
- Runtime imports must be relative and end in `.ts` (for example `../modules/process-flows/rules.ts`). Use `import type` for type-only imports, including those that use path aliases such as `@/`.
- Canvas and React code (the BPMN editor and `components/`) is verified in a browser, not by node tests. Keep logic that needs testing in pure modules with no DOM, React or diagram-js imports.

Integration and end-to-end suites should be added alongside concrete backend implementations.
