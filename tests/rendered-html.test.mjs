import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the finished romantic experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Buse ♡ Onur<\/title>/i);
  assert.match(html, /Onur’dan Buse’ye|Buse’ye küçük/i);
  assert.match(html, /başlat|küçük bir sürpriz/i);
  assert.doesNotMatch(html, /codex-preview|Building your site|react-loading-skeleton/i);
});

test("published page keeps the heart experience and game drawer together", async () => {
  const [html, script, css] = await Promise.all([
    readFile(new URL("../docs/index.html", import.meta.url), "utf8"),
    readFile(new URL("../docs/app.js", import.meta.url), "utf8"),
    readFile(new URL("../docs/styles.css", import.meta.url), "utf8"),
  ]);
  assert.match(html, /id="mainHeart"/);
  assert.match(html, /id="drawerHandle"/);
  assert.match(script, /wheel:\{title:'Aşk Çarkı'/);
  assert.match(html, /Buse/);
  assert.match(script, /heart\.connect\(\)/);
  assert.match(script, /const GAME_RENDERERS/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});
