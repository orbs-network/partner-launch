import { execFileSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const sourcePaths = [
  'package.json', 'package-lock.json', 'index.html', 'vercel.json',
  'vite.config.ts', 'tsconfig.json', 'eslint.config.js', 'components.json',
  'api', 'server', 'src', 'public', 'vendor',
];

function pageTitle(html) {
  return html.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1].replace(/\s+/g, ' ').trim() ?? '';
}

async function confirmProduction(target) {
  if (!process.stdin.isTTY || !process.stdout.isTTY)
    throw new Error('Production deployment requires an interactive terminal; use --dry-run or --build-only without publishing.');
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    prompt.once('close', () => resolve(false));
    prompt.once('SIGINT', () => prompt.close());
    prompt.question(`Configure Partner Portal build settings and deploy to PRODUCTION (${target.vercelProjectId})? (yes/no) [no]: `, (answer) => {
      resolve(['yes', 'y'].includes(answer.trim().toLowerCase()));
      prompt.close();
    });
  });
}

export function deploymentErrorMessage(error) {
  return typeof error.status === 'number'
    ? `Deployment command failed (exit ${error.status})`
    : error.message;
}

export async function deployPartnerPortal(argv, {
  root = repoRoot, env = process.env, run = execFileSync,
  confirm = confirmProduction, log = console.log,
} = {}) {
  if (argv.length === 1 && argv[0] === '--help') {
    log('Run from the standalone partner-portal project:\nUsage: npm run deploy -- [--dry-run|--build-only]\nDefault: confirm, configure the project root/Vite preset if needed, build and publish to production, verify it, then log out.');
    return;
  }
  if (argv.length > 1 || argv.some((flag) => !['--dry-run', '--build-only'].includes(flag)))
    throw new Error('Use only --dry-run or --build-only; see --help.');
  const target = JSON.parse(await readFile(path.join(root, 'ops/deploy/partner-portal-deploy-target.json'), 'utf8'));
  if (target.name !== 'partner-portal' || !/^prj_\w+$/.test(target.vercelProjectId) || !/^team_\w+$/.test(target.vercelOrgId))
    throw new Error('Invalid Partner Portal deployment target.');
  log(`Target: Partner Portal production | Project: ${target.vercelProjectId} | Org: ${target.vercelOrgId}`);
  log(`Plan: production pull → ${argv.includes('--build-only') ? 'check' : 'configure and verify'} project root/Vite preset → isolated Vite build → ${argv.includes('--build-only') ? 'save local output' : 'prebuilt deploy → verify READY and deployed HTML → cleanup → logout'}.`);
  if (argv.includes('--dry-run')) return;
  const buildOnly = argv.includes('--build-only');
  if (!buildOnly && !await confirm(target)) { log('Deployment cancelled.'); return; }

  const commandEnv = { ...env };
  for (const key of Object.keys(commandEnv)) {
    if (key === 'VERCEL_TOKEN' || key.startsWith('VERCEL_TOKEN_')) delete commandEnv[key];
  }
  commandEnv.VERCEL_PROJECT_ID = target.vercelProjectId;
  commandEnv.VERCEL_ORG_ID = target.vercelOrgId;
  let failed = false;
  try {
    try {
      run('vercel', ['whoami', '--non-interactive'], { cwd: root, env: commandEnv, stdio: 'inherit' });
    } catch (error) {
      if (error.code === 'ENOENT') throw new Error('Vercel CLI is not installed; install it with npm install --global vercel.');
      log('Starting Vercel login…');
      run('vercel', ['login'], { cwd: root, env: commandEnv, stdio: 'inherit' });
      run('vercel', ['whoami', '--non-interactive'], { cwd: root, env: commandEnv, stdio: 'inherit' });
    }
    const files = run('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z', '--', ...sourcePaths], {
      cwd: root, encoding: 'utf8',
    }).split('\0').filter(Boolean);
    const stage = await mkdtemp(path.join(tmpdir(), 'partner-portal-'));
    try {
      for (const file of new Set(files)) {
        if (file.split('/').some((part) => ['node_modules', '.vercel', '.next', 'dist', 'coverage'].includes(part)) ||
            path.basename(file).startsWith('.env') || file.endsWith('.tsbuildinfo')) continue;
        await mkdir(path.dirname(path.join(stage, file)), { recursive: true });
        try { await cp(path.join(root, file), path.join(stage, file)); }
        catch (error) { if (error.code !== 'ENOENT') throw error; }
      }
      const vercel = (args, capture = false) => run('vercel', args, {
        cwd: stage, env: commandEnv,
        ...(capture ? { encoding: 'utf8', stdio: ['inherit', 'pipe', 'inherit'] } : { stdio: 'inherit' }),
      });
      const pullProject = async () => {
        vercel(['pull', '--yes', '--environment=production']);
        const project = JSON.parse(await readFile(path.join(stage, '.vercel/project.json'), 'utf8'));
        if (project.projectId !== target.vercelProjectId || project.orgId !== target.vercelOrgId)
          throw new Error(`Pulled Vercel project/org mismatch: expected ${target.vercelProjectId}/${target.vercelOrgId}, got ${project.projectId}/${project.orgId}.`);
        return project;
      };
      const hasPortalSettings = (project) => (project.settings?.rootDirectory ?? null) === null && project.settings?.framework === 'vite';
      const describeSettings = (project) => `rootDirectory=${JSON.stringify(project.settings?.rootDirectory ?? null)}, framework=${JSON.stringify(project.settings?.framework ?? null)}`;
      let project = await pullProject();
      if (!hasPortalSettings(project)) {
        if (buildOnly)
          throw new Error(`Partner Portal build settings mismatch: ${describeSettings(project)}. Build-only does not change remote settings. Set rootDirectory=null and framework=vite, or run npm run deploy to configure and publish.`);
        log(`Current Vercel settings: ${describeSettings(project)}. Configuring the Partner Portal root and Vite preset…`);
        vercel(['project', 'update', target.vercelProjectId, '--auto-detect', 'root-directory', '--framework', 'vite', '--scope', target.vercelOrgId, '--non-interactive']);
        project = await pullProject();
        if (!hasPortalSettings(project))
          throw new Error(`Partner Portal settings readback failed: expected rootDirectory=null and framework=vite, got ${describeSettings(project)}.`);
      }
      const expectedTitle = pageTitle(await readFile(path.join(stage, 'index.html'), 'utf8'));
      if (!expectedTitle) throw new Error('Partner Portal source HTML is missing its page title.');
      vercel(['build', '--prod']);
      const output = path.join(stage, '.vercel/output');
      const config = JSON.parse(await readFile(path.join(output, 'config.json'), 'utf8'));
      const html = await readFile(path.join(output, 'static/index.html'), 'utf8');
      const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["'](\/assets\/[^"']+\.js)["']/g)].map((match) => match[1]);
      if (config.version !== 3 || pageTitle(html) !== expectedTitle || !scripts.length)
        throw new Error(`Partner Portal build did not produce valid Vite/Vercel static output (expected title ${JSON.stringify(expectedTitle)}, received ${JSON.stringify(pageTitle(html))}, output version ${JSON.stringify(config.version)}, entry scripts ${scripts.length}).`);
      for (const script of scripts) await readFile(path.join(output, 'static', script));
      if (buildOnly) {
        const destination = path.join(root, '.vercel/local-builds/partner-portal');
        await rm(destination, { recursive: true, force: true });
        await cp(output, destination, { recursive: true });
        log(`Build saved to ${destination}; no deployment created.`);
      } else {
        const published = JSON.parse(vercel(['deploy', '--prebuilt', '--prod', '--archive=tgz', '--yes', '--json'], true));
        // Current CLI interactive and agent modes return different JSON envelopes.
        const deployment = published.deployment ?? published;
        if (typeof deployment.url !== 'string' || !/^dpl_\w+$/.test(deployment.id))
          throw new Error('Vercel did not return a deployment ID and URL.');
        const url = new URL(deployment.url);
        if (url.protocol !== 'https:' || !url.hostname.endsWith('.vercel.app') || url.username || url.password || url.port || url.pathname !== '/' || url.search || url.hash)
          throw new Error('Vercel did not return a valid deployment URL.');
        log(`Deployment: ${url.origin}`);
        const inspected = JSON.parse(vercel(['inspect', url.origin, '--wait', '--timeout', '3m', '--format=json'], true));
        if (inspected.id !== deployment.id || inspected.readyState !== 'READY' || inspected.target !== 'production')
          throw new Error('Partner Portal deployment verification failed: expected the published production deployment to be READY.');
        const liveHtml = vercel(['curl', '/', '--deployment', url.origin, '--', '--fail', '--silent', '--show-error', '--max-time', '30'], true);
        if (pageTitle(liveHtml) !== expectedTitle || scripts.some((script) => !liveHtml.includes(script)))
          throw new Error('Partner Portal deployment verification failed: the live HTML does not match the new build.');
        log(`Verified Partner Portal: ${url.origin}`);
      }
    } finally {
      await rm(stage, { recursive: true, force: true });
    }
  } catch (error) {
    failed = true;
    throw error;
  } finally {
    if (!buildOnly) {
      try { run('vercel', ['logout'], { cwd: root, env: commandEnv, stdio: 'inherit' }); }
      catch {
        const message = 'Vercel logout failed; run vercel logout manually.';
        if (failed) log(message);
        else throw new Error(message);
      }
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await deployPartnerPortal(process.argv.slice(2)); }
  catch (error) { console.error(deploymentErrorMessage(error)); process.exitCode = 1; }
}
