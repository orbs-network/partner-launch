import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

// Vite resolves extensionless imports, but Vercel's Node ESM runtime does not.
test("every API entry and its runtime imports load as Node ES modules", async () => {
  const root = process.cwd();
  const output = await mkdtemp(path.join(tmpdir(), "portal-server-modules-"));
  try {
    await writeFile(path.join(output, "package.json"), '{"type":"module"}');
    await symlink(path.join(root, "node_modules"), path.join(output, "node_modules"), "dir");
    const entries = (await readdir(path.join(root, "api"))).filter(name => name.endsWith(".ts")).map(name => `api/${name}`);
    const queue = [...entries];
    const seen = new Set();
    while (queue.length) {
      const file = queue.pop();
      if (seen.has(file)) continue;
      seen.add(file);
      const source = await readFile(path.join(root, file), "utf8");
      const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, verbatimModuleSyntax: true } }).outputText;
      const ast = ts.createSourceFile(file, compiled, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
      for (const item of ast.statements) {
        if (!(ts.isImportDeclaration(item) || ts.isExportDeclaration(item)) || !item.moduleSpecifier || !ts.isStringLiteral(item.moduleSpecifier)) continue;
        const specifier = item.moduleSpecifier.text;
        assert.ok(!specifier.startsWith("@/"), `${file}: runtime alias ${specifier}`);
        if (!specifier.startsWith(".")) continue;
        assert.ok(specifier.endsWith(".js"), `${file}: runtime import ${specifier} needs a .js extension`);
        queue.push(path.normalize(path.join(path.dirname(file), specifier.replace(/\.js$/, ".ts"))));
      }
      const destination = path.join(output, file.replace(/\.ts$/, ".js"));
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, compiled);
    }
    for (const entry of entries) {
      const module = await import(pathToFileURL(path.join(output, entry.replace(/\.ts$/, ".js"))).href);
      assert.equal(typeof module.default, "function", `${entry} must export a handler`);
    }
  } finally { await rm(output, { recursive: true, force: true }); }
});
