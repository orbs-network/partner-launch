import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { deployPartnerPortal } from '../scripts/deploy.mjs';

const sourceRoot = fileURLToPath(new URL('..', import.meta.url));
const target = JSON.parse(await readFile(path.join(sourceRoot, 'ops/deploy/partner-portal-deploy-target.json'), 'utf8'));
const deployment = { id: 'dpl_partner123', url: 'https://partner-release.vercel.app', readyState: 'READY' };
const sourceHtml = await readFile(path.join(sourceRoot, 'index.html'), 'utf8');
const viteHtml = (html) => html.replace('/src/main.tsx', '/assets/portal-current.js');
const withTitle = (html, title) => html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
const builtHtml = viteHtml(sourceHtml);

async function fixture(t, changes = {}) {
  t.mock.method(globalThis, 'fetch', () => assert.fail('deployment tests must not contact the network'));
  const root = await mkdtemp(path.join(tmpdir(), 'partner-portal-deploy-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const sourceIndex = changes.sourceHtml ?? sourceHtml;
  const compiledHtml = viteHtml(sourceIndex);
  const files = [
    'package.json', 'package-lock.json', 'vendor/partner-config/package.json',
    'vendor/partner-analytics/lib/auth.ts',
    'index.html', 'src/main.tsx',
    'src/new-component.tsx', 'public/favicon.svg',
    '.env.local', '.env.production.local',
    '.vercel/project.json', 'node_modules/stale.js',
    'dist/index.html', 'tsconfig.tsbuildinfo',
    'src/deleted.tsx',
  ];
  const save = (base, file, value) => {
    mkdirSync(path.dirname(path.join(base, file)), { recursive: true });
    writeFileSync(path.join(base, file), typeof value === 'string' ? value : JSON.stringify(value));
  };
  for (const file of files.filter((file) => !file.endsWith('deleted.tsx')))
    save(root, file, `current source: ${file}`);
  save(root, 'index.html', sourceIndex);
  save(root, 'ops/deploy/partner-portal-deploy-target.json', target);
  save(root, '.vercel/project.json', { projectId: 'prj_unrelated', orgId: 'team_unrelated' });
  // Non-selected sources must never be copied or used to build this app.
  save(root, 'tee/internal/handlers/source.go', 'private TEE source');
  save(root, 'contracts/src/Protocol.sol', 'contract source');
  save(root, 'admin-frontend/app/page.tsx', 'unrelated admin source');
  let confirmed = false;
  let stage;
  let pulls = 0;
  let settingsRepaired = false;
  let authenticated = !changes.loggedOut;
  const calls = [];
  const logs = [];
  const options = {
    root,
    env: {
      VERCEL_PROJECT_ID: 'prj_stale', VERCEL_ORG_ID: 'team_stale',
      VERCEL_TOKEN: 'private-token', VERCEL_TOKEN_PERPS: 'private-token',
      VERCEL_TOKEN_OTHER: 'private-token',
    },
    confirm: async (...args) => {
      assert.ok(args.some((arg) => arg === target || JSON.stringify(arg).includes(target.vercelProjectId)));
      confirmed = true;
      return true;
    },
    log: (line) => logs.push(line),
  };
  options.run = (command, args, opts) => {
    assert.ok(confirmed || changes.buildOnly, 'publishing commands must follow confirmation');
    calls.push({ command, args: [...args], cwd: opts.cwd, env: { ...opts.env } });
    if (command === 'git') {
      assert.equal(args[0], 'ls-files');
      assert.ok(args.includes('--cached'));
      assert.ok(args.includes('--others'));
      assert.ok(args.includes('--exclude-standard'));
      assert.ok(args.includes('-z'));
      assert.ok(args.includes('package-lock.json'));
      assert.ok(args.includes('src'));
      assert.ok(args.includes('vendor'));
      assert.equal(args.includes('tee'), false);
      assert.equal(args.includes('contracts'), false);
      assert.equal(args.includes('admin-frontend'), false);
      if (changes.failure === 'git') throw new Error('Source preparation failed');
      return `${files.join('\0')}\0`;
    }
    assert.equal(command, 'vercel');
    assert.equal(opts.env.VERCEL_PROJECT_ID, target.vercelProjectId);
    assert.equal(opts.env.VERCEL_ORG_ID, target.vercelOrgId);
    assert.equal(opts.env.VERCEL_TOKEN, undefined);
    assert.equal(opts.env.VERCEL_TOKEN_PERPS, undefined);
    assert.equal(opts.env.VERCEL_TOKEN_OTHER, undefined);
    assert.equal(args.some((arg) => arg.startsWith('--token')), false);
    if (args[0] === 'pull') stage = opts.cwd;
    if (changes.failure === args[0]) throw new Error(`${args[0]} failed`);
    if (args[0] === 'project') {
      assert.deepEqual(args, [
        'project', 'update', target.vercelProjectId,
        '--auto-detect', 'root-directory', '--framework', 'vite',
        '--scope', target.vercelOrgId, '--non-interactive',
      ]);
      assert.equal(pulls, 1, 'only a pulled and identity-verified project may be updated');
      if (changes.failure === 'project-update') throw new Error('Project settings update failed');
      settingsRepaired = true;
      return '';
    }
    if (args[0] === 'whoami') {
      if (changes.missingCli) throw Object.assign(new Error('Missing executable'), { code: 'ENOENT' });
      if (!authenticated) throw new Error('Not logged in');
      return 'deployment-user';
    }
    if (args[0] === 'login') {
      authenticated = !changes.failedLoginCheck;
      return '';
    }
    if (args[0] === 'logout') {
      assert.equal(opts.cwd, root, 'logout runs from the checkout after staging cleanup');
      if (stage) assert.equal(existsSync(stage), false);
      if (changes.logoutFails) throw new Error('logout failed with private command output');
      return '';
    }
    if (args[0] === 'pull') {
      assert.notEqual(stage, root);
      if (!pulls) {
        for (const file of files.filter((file) => !/\.env|\.vercel|node_modules|^dist\/|tsbuildinfo|deleted/.test(file)))
          assert.equal(readFileSync(path.join(stage, file), 'utf8'), file === 'index.html' ? sourceIndex : `current source: ${file}`);
        for (const file of files.filter((file) => /\.env|\.vercel|node_modules|^dist\/|tsbuildinfo|deleted/.test(file)))
          assert.equal(existsSync(path.join(stage, file)), false, `excluded source entered staging: ${file}`);
        for (const file of ['tee/internal/handlers/source.go', 'contracts/src/Protocol.sol', 'admin-frontend/app/page.tsx'])
          assert.equal(existsSync(path.join(stage, file)), false);
      }
      pulls++;
      save(stage, '.vercel/project.json', {
        projectId: target.vercelProjectId,
        orgId: target.vercelOrgId,
        settings: {
          rootDirectory: null, framework: 'vite',
          ...(!settingsRepaired || changes.settingsRemainWrong ? changes.projectSettings : {}),
        },
        ...changes.projectIdentity,
        ...(settingsRepaired ? changes.identityAfterRepair : {}),
      });
      return '';
    }
    if (args[0] === 'build') {
      if (!changes.noConfig) save(stage, '.vercel/output/config.json', { version: changes.outputVersion ?? 3 });
      if (!changes.noIndex) save(stage, '.vercel/output/static/index.html', changes.buildHtml ?? compiledHtml);
      save(stage, '.vercel/output/static/assets/portal-current.js', 'console.log("current release");');
      return '';
    }
    if (args[0] === 'deploy') {
      for (const flag of ['--prebuilt', '--prod', '--archive=tgz', '--yes', '--json']) assert.ok(args.includes(flag));
      assert.equal(args.some((arg) => arg === '--env' || arg === '--build-env'), false, 'static apps need no runtime environment publication');
      return JSON.stringify(changes.published ?? (changes.envelope ? { deployment } : deployment));
    }
    if (args[0] === 'inspect') {
      assert.ok(args.includes('--wait'));
      assert.ok(args.includes('--format=json'));
      assert.ok(args.includes('--timeout'));
      assert.ok(args.includes('3m'));
      assert.ok(args.includes(deployment.url));
      return JSON.stringify({ ...deployment, url: 'partner-release.vercel.app', target: 'production', ...changes.inspected });
    }
    if (args[0] === 'curl') {
      assert.equal(args[1], '/');
      assert.ok(args.includes('--deployment'));
      assert.ok(args.includes('--fail'));
      assert.ok(args.includes('--silent'));
      assert.ok(args.includes('--show-error'));
      assert.ok(args.includes('--max-time'));
      assert.ok(args.includes('30'));
      return changes.servedHtml ?? compiledHtml;
    }
    assert.fail(`unexpected subprocess: ${command} ${args.join(' ')}`);
  };
  return { root, options, calls, logs, getStage: () => stage };
}

const vercelCommands = (calls) => calls.filter(({ command }) => command === 'vercel').map(({ args }) => args[0]);

test('standalone package and deployment target are self-contained', async () => {
  const pkg = JSON.parse(await readFile(path.join(sourceRoot, 'package.json'), 'utf8'));
  assert.equal(target.name, 'partner-portal');
  assert.equal(target.vercelProjectId, 'prj_FuUQY7dLPoEwSzrFfXThDwldZhrN');
  assert.equal(target.vercelOrgId, 'team_t6YZC010wIUd8yFGN6mkglL9');
  assert.equal(pkg.scripts.deploy, 'node scripts/deploy.mjs');
  assert.equal(pkg.scripts['test:deploy'], 'node --test tests/deploy.test.mjs');
  assert.equal(pkg.workspaces, undefined);
  assert.equal(pkg.dependencies['@perpetual-hub/partner-config'], 'file:vendor/partner-config');
  const vercel = JSON.parse(await readFile(path.join(sourceRoot, 'vercel.json'), 'utf8'));
  assert.equal(vercel.installCommand, 'npm ci');
  for (const dependency of Object.values(pkg.dependencies))
    assert.equal(dependency.startsWith('file:..'), false, 'standalone dependencies cannot point to sibling checkouts');
});

test('help and dry-run need no CLI, network, confirmation or login changes', async (t) => {
  const { options, logs } = await fixture(t);
  options.run = () => assert.fail('dry-run started a subprocess');
  options.confirm = () => assert.fail('dry-run requested confirmation');
  await deployPartnerPortal(['--help'], options);
  await deployPartnerPortal(['--dry-run'], options);
  assert.ok(logs.some((line) => line.includes(target.vercelProjectId)));
});

test('the CLI resolves its default repository target from an unrelated working directory', async (t) => {
  const cwd = await mkdtemp(path.join(tmpdir(), 'partner-portal-deploy-cwd-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const output = execFileSync(process.execPath, [
    path.join(sourceRoot, 'scripts/deploy.mjs'), '--dry-run',
  ], { cwd, encoding: 'utf8', env: { PATH: '' }, timeout: 10_000 });
  assert.ok(output.includes(`Target: Partner Portal production | Project: ${target.vercelProjectId} | Org: ${target.vercelOrgId}`));
});

test('cancelled deployment leaves source and CLI session untouched', async (t) => {
  const { options } = await fixture(t);
  options.confirm = async () => false;
  options.run = () => assert.fail('cancelled publishing started a subprocess');
  await deployPartnerPortal([], options);
});

test('unknown or conflicting flags fail before confirmation or commands', async (t) => {
  const { options } = await fixture(t);
  options.confirm = () => assert.fail('invalid flags prompted');
  options.run = () => assert.fail('invalid flags started a subprocess');
  for (const args of [['--preview'], ['--yes'], ['--dry-run', '--build-only'], ['--help', '--prod']])
    await assert.rejects(deployPartnerPortal(args, options));
});

test('publishes only fresh portal sources, verifies the built deployment, then cleans up and logs out', async (t) => {
  const { root, options, calls, getStage } = await fixture(t);
  await deployPartnerPortal([], options);
  assert.deepEqual(vercelCommands(calls), ['whoami', 'pull', 'build', 'deploy', 'inspect', 'curl', 'logout']);
  assert.equal(existsSync(getStage()), false);
  assert.deepEqual(JSON.parse(readFileSync(path.join(root, '.vercel/project.json'), 'utf8')), { projectId: 'prj_unrelated', orgId: 'team_unrelated' });
  assert.equal(options.env.VERCEL_PROJECT_ID, 'prj_stale');
  assert.equal(options.env.VERCEL_TOKEN, 'private-token');
});

test('accepts the current source title and a matching future app title', async (t) => {
  for (const changes of [{}, { sourceHtml: withTitle(sourceHtml, 'Future Creator Studio') }]) {
    const { options, calls, logs } = await fixture(t, changes);
    await deployPartnerPortal([], options);
    assert.deepEqual(vercelCommands(calls), ['whoami', 'pull', 'build', 'deploy', 'inspect', 'curl', 'logout']);
    assert.ok(logs.some((line) => line.startsWith('Verified Partner Portal:')));
  }
});

test('logged-out publishing logs in, verifies the session, and handles the CLI deployment envelope', async (t) => {
  const { options, calls } = await fixture(t, { loggedOut: true, envelope: true });
  await deployPartnerPortal([], options);
  assert.deepEqual(vercelCommands(calls), ['whoami', 'login', 'whoami', 'pull', 'build', 'deploy', 'inspect', 'curl', 'logout']);
});

test('build-only produces inspectable output without confirmation, publishing or logout', async (t) => {
  const { root, options, calls, getStage } = await fixture(t, { buildOnly: true });
  options.confirm = () => assert.fail('local build requested deployment confirmation');
  await deployPartnerPortal(['--build-only'], options);
  assert.deepEqual(vercelCommands(calls), ['whoami', 'pull', 'build']);
  const destination = path.join(root, '.vercel/local-builds/partner-portal');
  assert.equal(JSON.parse(readFileSync(path.join(destination, 'config.json'), 'utf8')).version, 3);
  assert.equal(readFileSync(path.join(destination, 'static/index.html'), 'utf8'), builtHtml);
  assert.equal(existsSync(getStage()), false);
});

test('wrong pulled project or organization stops before settings changes and still logs out', async (t) => {
  for (const changes of [
    { projectIdentity: { projectId: 'prj_other' } },
    { projectIdentity: { orgId: 'team_other' } },
  ]) {
    const { options, calls, getStage } = await fixture(t, changes);
    await assert.rejects(deployPartnerPortal([], options));
    assert.deepEqual(vercelCommands(calls), ['whoami', 'pull', 'logout']);
    assert.equal(existsSync(getStage()), false);
  }
});

test('publishing repairs wrong or missing build settings and reads them back before building', async (t) => {
  for (const projectSettings of [
    { rootDirectory: 'partner-portal' },
    { framework: 'nextjs' },
    { rootDirectory: null, framework: null },
    { rootDirectory: undefined, framework: undefined },
  ]) {
    const { options, calls, getStage } = await fixture(t, { projectSettings });
    await deployPartnerPortal([], options);
    assert.deepEqual(vercelCommands(calls), ['whoami', 'pull', 'project', 'pull', 'build', 'deploy', 'inspect', 'curl', 'logout']);
    assert.equal(existsSync(getStage()), false);
  }
});

test('settings update failures or incorrect readback stop before building and still log out', async (t) => {
  for (const changes of [
    { failure: 'project-update' },
    { settingsRemainWrong: true },
    { identityAfterRepair: { projectId: 'prj_other' } },
    { identityAfterRepair: { orgId: 'team_other' } },
  ]) {
    const { options, calls, getStage } = await fixture(t, {
      projectSettings: { rootDirectory: null, framework: null }, ...changes,
    });
    const expected = changes.failure
      ? /Project settings update failed/
      : changes.identityAfterRepair
        ? /project\/org mismatch/
        : /settings readback failed: .*rootDirectory=null, framework=null/;
    await assert.rejects(deployPartnerPortal([], options), expected);
    assert.deepEqual(vercelCommands(calls), [
      'whoami', 'pull', 'project', ...(changes.failure ? [] : ['pull']), 'logout',
    ]);
    assert.equal(existsSync(getStage()), false);
  }
});

test('build-only refuses mismatched settings without changing the project or session', async (t) => {
  const { options, calls, getStage } = await fixture(t, {
    buildOnly: true, projectSettings: { rootDirectory: null, framework: null },
  });
  options.confirm = () => assert.fail('local build requested deployment confirmation');
  await assert.rejects(deployPartnerPortal(['--build-only'], options), /rootDirectory=null, framework=null.*Build-only does not change remote settings/);
  assert.deepEqual(vercelCommands(calls), ['whoami', 'pull']);
  assert.equal(existsSync(getStage()), false);
});

test('each failed preparation, build, publication or verification command cleans up and logs out', async (t) => {
  const order = ['whoami', 'pull', 'build', 'deploy', 'inspect', 'curl'];
  for (const failure of ['git', 'pull', 'build', 'deploy', 'inspect', 'curl']) {
    const { options, calls, getStage } = await fixture(t, { failure });
    await assert.rejects(deployPartnerPortal([], options));
    const expected = failure === 'git' ? ['whoami'] : order.slice(0, order.indexOf(failure) + 1);
    assert.deepEqual(vercelCommands(calls), [...expected, 'logout']);
    if (getStage()) assert.equal(existsSync(getStage()), false);
  }
});

test('missing or invalid Vercel output cannot be published', async (t) => {
  for (const changes of [{ noConfig: true }, { outputVersion: 2 }, { noIndex: true }, { buildHtml: '' }]) {
    const { options, calls, getStage } = await fixture(t, changes);
    await assert.rejects(deployPartnerPortal([], options));
    assert.deepEqual(vercelCommands(calls), ['whoami', 'pull', 'build', 'logout']);
    assert.equal(existsSync(getStage()), false);
  }
});

test('rejects obsolete and unrelated build titles even when the expected bundle is present', async (t) => {
  for (const title of ['Partner Portal · Perpetual Hub', 'Admin dashboard']) {
    const { options, calls, getStage } = await fixture(t, { buildHtml: withTitle(builtHtml, title) });
    await assert.rejects(deployPartnerPortal([], options));
    assert.deepEqual(vercelCommands(calls), ['whoami', 'pull', 'build', 'logout']);
    assert.equal(existsSync(getStage()), false);
  }
});

test('a different deployment, non-ready state or non-production target cannot pass verification', async (t) => {
  for (const inspected of [{ id: 'dpl_other' }, { readyState: 'ERROR' }, { target: 'preview' }]) {
    const { options, calls } = await fixture(t, { inspected });
    await assert.rejects(deployPartnerPortal([], options));
    assert.deepEqual(vercelCommands(calls), ['whoami', 'pull', 'build', 'deploy', 'inspect', 'logout']);
  }
});

test('serving an obsolete title, another app or stale script assets fails the live check before logout', async (t) => {
  for (const servedHtml of [withTitle(builtHtml, 'Partner Portal · Perpetual Hub'), withTitle(builtHtml, 'Admin dashboard'), builtHtml.replace('portal-current.js', 'portal-stale.js')]) {
    const { options, calls } = await fixture(t, { servedHtml });
    await assert.rejects(deployPartnerPortal([], options));
    assert.deepEqual(vercelCommands(calls), ['whoami', 'pull', 'build', 'deploy', 'inspect', 'curl', 'logout']);
  }
});

test('authentication failures stop publication and still attempt logout', async (t) => {
  for (const changes of [{ missingCli: true }, { loggedOut: true, failure: 'login' }, { loggedOut: true, failedLoginCheck: true }]) {
    const { options, calls } = await fixture(t, changes);
    await assert.rejects(deployPartnerPortal([], options));
    assert.equal(vercelCommands(calls).at(-1), 'logout');
    assert.equal(vercelCommands(calls).includes('pull'), false);
  }
});

test('logout failure fails success without hiding an earlier deployment error', async (t) => {
  for (const failure of [undefined, 'build']) {
    const { options, calls, logs } = await fixture(t, { failure, logoutFails: true });
    await assert.rejects(deployPartnerPortal([], options), failure ? /build failed/i : /logout/i);
    assert.equal(vercelCommands(calls).at(-1), 'logout');
    if (failure) assert.ok(logs.some((line) => /logout/i.test(line)));
    assert.equal(logs.some((line) => line.includes('private command output')), false);
  }
});
