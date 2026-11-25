# Runtime verification (experimental)

ExaPro separates static checks, builds, and startup checks. The Node runner runs root npm build/test scripts rather than a simulated echo command. Passing an npm script does not certify that the application starts or that its tests are comprehensive.

Runtime execution is disabled by default. Only enable it on a dedicated disposable test worker with Docker, not on a public/shared application host. Docker isolation is not a complete security boundary for hostile multi-tenant submissions.

On the isolated worker:
- Preload a trusted runner image (default node:20-alpine).
- Set EXAPRO_ENABLE_RUNTIME_TESTS=1 in the backend environment.
- Optionally set EXAPRO_NODE_RUNNER_IMAGE to a trusted local image containing a readable offline npm cache at /opt/npm-cache.
- Projects with dependencies need a complete npm lockfile and all required cache entries. Installation uses npm ci --offline --ignore-scripts. Projects requiring lifecycle installation scripts, workspaces, other package managers or non-Node runtimes are not supported by this runner.
- No internet access, no host execution, no automatic image pulls. Source is mounted read-only and copied into bounded temporary storage.
- If the worker, dependencies or execution limits prevent verification, the check is blocked. Startup, HTTP, browser and API runtime checks remain unimplemented and are marked not tested.
- Reports expose script exit status and duration rather than raw untrusted output.
- A successful script only proves its reported exit status; submitted scripts can be trivial or misleading.

The legacy testCoveragePercent field now represents (passed + failed) / planned checks, not code coverage. Older stored reports may contain the previous metric. New incomplete assessments are capped at grade C. Scores are provisional, not production-readiness certifications.

Regression tests: npm test --prefix backend. Build: npm run build:backend and npm run build:frontend.
