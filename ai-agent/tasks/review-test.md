TASK:
Review a spec, API client, page object or fixture as a Senior SDET. Review only: no edits.

────────────────────────────────────

CHECKLIST:

1. **Assertions**
   - Status + `location` on form posts; status + body on JSON endpoints.
   - UI assertions are web-first (`toHaveText`, `toHaveURL`…), never `expect(await locator.innerText())` when a
     web-first form exists.
   - Negatives prove nothing changed (list still empty, session still anonymous).
   - Expected values come from `PRODUCTS` / `CHECKOUT_FEES` / `MESSAGES`, not literals copied from one run.
2. **Isolation**
   - Unique user / address per test; no reliance on existing accounts, orders, counts.
   - Extra request contexts disposed in `finally`.
3. **Layers**
   - Specs use clients / page objects only; no raw `request.*`, URLs or form field names.
   - Clients and page objects contain no `expect`.
   - Preconditions via API; integration tests verify through the other side.
4. **Synchronisation**
   - No `waitForTimeout`. AJAX sections waited via the next element / web-first assertion; server state via `expect.poll`.
5. **Structure**
   - Right folder for the layer; `test.step` phases named `API: …` / `UI: …`; `{ tag }` option on main happy paths.
6. **Known findings**
   - DEFECT-1 (address delete) handled via `tolerateTimeout` + poll; DEFECT-2 annotated where relevant.
7. **Code style** (rules.md §10): async/await, try/catch with context, logger in `src/`, header comments, no date stamps.
8. **Coverage** against `generate-spec.md`'s checklist.

────────────────────────────────────

BY DESIGN (do not flag):
- `Address_Api.delete()` returning `null` on timeout (DEFECT-1).
- Teardown errors logged as `warn` instead of failing the test.
- 302 asserted as success for form posts; 200 + `{error:1}` asserted as failure for checkout.

────────────────────────────────────

OUTPUT:
### CRITICAL ISSUES
- `file:line`: problem → impact → fix
### SUGGESTED IMPROVEMENTS
- …
### OPTIONAL REFACTORED CODE
(only if truly needed)
