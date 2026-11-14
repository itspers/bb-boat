import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { IDENTITY_SCRUB_SCRIPT } from "../src/backend.js";

// The plugin runs the scrub as `bash -lc <script>`, so the shell's own command line mentions the
// daemon. A fake pkill checks the pattern against that shell's real command line, so the test
// never touches other processes.
function fakeTools(dir: string) {
  const tool = (name: string, body: string) => {
    writeFileSync(join(dir, name), `#!/bin/sh\n${body}\n`);
    chmodSync(join(dir, name), 0o755);
  };
  // Like the real pkill -f: kill the calling shell if the pattern matches its command line.
  tool("pkill", 'for p; do pattern="$p"; done; tr "\\0" " " < /proc/$PPID/cmdline | grep -Eq -- "$pattern" && kill -TERM "$PPID"; exit 0');
  tool("systemctl", "exit 0");
}

describe("IDENTITY_SCRUB_SCRIPT", () => {
  it.runIf(process.platform === "linux")("does not kill the shell running it and removes the copied state", () => {
    const root = mkdtempSync(join(tmpdir(), "bb-boat-scrub-"));
    try {
      const bin = join(root, "bin");
      const home = join(root, "home");
      mkdirSync(bin);
      mkdirSync(join(home, ".bb-machines", "hub", "npm"), { recursive: true });
      fakeTools(bin);
      const result = spawnSync("bash", ["-lc", IDENTITY_SCRUB_SCRIPT], {
        env: { PATH: `${bin}:/usr/bin:/bin`, HOME: home },
        encoding: "utf8",
      });
      expect(result.signal).toBeNull();
      expect(result.status).toBe(0);
      expect(existsSync(join(home, ".bb-machines"))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
