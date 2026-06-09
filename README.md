# QA-Automation

## Playwright Feedback Form Suite

### Install dependencies

```bash
npm install
npx playwright install-deps
npx playwright install
```

### Run the full suite

```bash
npx playwright test
```

### Run in headed mode for visual observation

If you have a display server (local desktop), run:

```bash
npx playwright test --headed
```

If you are inside a Linux container with no X server, use the virtual framebuffer wrapper:

```bash
npm run test:headed:ci
```

### Open the HTML report after test execution

```bash
npx playwright show-report
```
