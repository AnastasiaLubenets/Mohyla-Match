import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();

function source(path: string) {
  return readFileSync(join(root, path), "utf8");
}

test("supplied high-quality Mohyla visual assets are stored under stable branding paths", () => {
  assert.ok(existsSync(join(root, "public/branding/mohyla-match-logo.png")));
  assert.ok(existsSync(join(root, "public/branding/mohyla-building.png")));
  assert.ok(
    existsSync(join(root, "public/branding/mohyla-quote-architecture.png")),
  );
});

test("discover quote card uses the supplied background while keeping real HTML text", () => {
  const page = source("src/app/app/page.tsx");
  const chrome = source("src/components/matching/app-chrome.tsx");

  assert.match(page, /mohyla-quote-architecture\.png/);
  assert.match(chrome, /mohyla-quote-architecture\.png/);
  assert.match(page, /backgroundPosition: "center bottom"/);
  assert.match(chrome, /backgroundPosition: "center bottom"/);
  assert.match(
    page,
    /Great things happen when Mohylians find each other\./,
  );
  assert.match(page, /Community[\s\S]*Ideas[\s\S]*People[\s\S]*Impact/);
  assert.doesNotMatch(page, /<Image[\s\S]*Great things happen/);
});

test("sidebar keeps the existing logo and building image containers", () => {
  const chrome = source("src/components/matching/app-chrome.tsx");

  assert.match(chrome, /src: "\/branding\/mohyla-match-logo\.png"/);
  assert.match(chrome, /src: "\/branding\/mohyla-building\.png"/);
  assert.match(chrome, /height: 657[\s\S]*width: 1920/);
  assert.match(chrome, /height: 1620[\s\S]*width: 971/);
  assert.match(chrome, /className="h-auto w-full object-contain"/);
  assert.match(
    chrome,
    /className="h-auto w-full max-w-none object-contain object-left-bottom"/,
  );
});
