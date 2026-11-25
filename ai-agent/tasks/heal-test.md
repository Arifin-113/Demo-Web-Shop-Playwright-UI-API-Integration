TASK:
Diagnose and fix failing Playwright tests without weakening them.

────────────────────────────────────

WORKFLOW:

1. **Reproduce**: `npx playwright test <spec> -g "<title>" --retries=0`. Read the full error, then open the trace
   (`npx playwright show-trace test-results/<test>/trace.zip`). Every test records one: API calls with bodies, and
   for browser tests the DOM snapshots and video.
2. **Health check**: `curl -s -o /dev/null -w "%{http_code}\n" https://demowebshop.tricentis.com/`. Not 200 → environment.
3. **Re-probe live**: the same request on a fresh `APIRequestContext`, or the same page in the browser.
4. **Classify** and act:

| Class | Signs | Action |
|---|---|---|
| Environment | 5xx, `ECONNRESET`, home page not 200, everything slow | No code change. Re-run later; record a `ROOT-CAUSE-n` if it recurs. |
| Slow endpoint | `Timeout 15000ms exceeded` on one endpoint, which answers when given longer | Give that call its own measured `timeout` in the client (see `ADD_TIMEOUT_MS`). Never raise global timeouts blindly. |
| Session lock | requests after `addressdelete` time out | DEFECT-1: delete must stay last / tolerated; check ordering. |
| Test bug | wrong data, missing precondition, assertion on another session's data | Fix the spec. |
| Framework bug | client parses wrong markup, locator matches 0 / many elements | Fix the client / page object, then re-run every spec that uses it. |
| Site changed | consistent new markup / status / message | Update the live-verified fact (`products.js`, `MESSAGES`, client) and record the change. |

5. **Re-run** the test, then the file, then `npm test`.

────────────────────────────────────

NEVER:
- Loosen an assertion, add `waitForTimeout`, retries or `test.skip` to get green.
- Hardcode a value you saw once.

If the test is right and the site is wrong in a new way, mark it `test.fail()` with a comment naming the new
`DEFECT-n`, and report it.

────────────────────────────────────

OUTPUT:
1. Failing test(s) and the error
2. Live probe result
3. Classification and root cause
4. The fix (diff)
5. Re-run result
