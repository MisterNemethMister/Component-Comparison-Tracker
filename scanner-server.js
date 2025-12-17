const http = require('http');
const { URL } = require('url');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const fg = require('fast-glob');
let esbuild;

const PORT = process.env.SCANNER_PORT ? Number(process.env.SCANNER_PORT) : 5055;
const MAX_FILE_BYTES = process.env.SCANNER_MAX_FILE_BYTES
  ? Number(process.env.SCANNER_MAX_FILE_BYTES)
  : 250_000;

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(text);
}

function sendJs(res, statusCode, js) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/javascript; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
  });
  res.end(js);
}

function fileExists(p) {
  try {
    return fs.existsSync(p);
  } catch (_) {
    return false;
  }
}

async function readJsonBody(req) {
  return await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 10_000_000) {
        reject(new Error('Request body too large'));
      }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sanitizeRepoPath(p) {
  if (!p || typeof p !== 'string') return null;
  const resolved = path.resolve(p);
  return resolved;
}

function safeJoinWithinRepo(repoPath, relFilePath) {
  if (!repoPath || !relFilePath) return null;
  const absRepo = path.resolve(repoPath);
  const absFile = path.resolve(absRepo, relFilePath);
  const rel = path.relative(absRepo, absFile);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return absFile;
}

async function getRepoInfo(repoPath) {
  const pkgPath = path.join(repoPath, 'package.json');
  try {
    const raw = await fsp.readFile(pkgPath, 'utf8');
    const pkg = JSON.parse(raw);
    return {
      name: pkg.name || path.basename(repoPath),
      description: pkg.description,
    };
  } catch (_) {
    return {
      name: path.basename(repoPath),
      description: undefined,
    };
  }
}

async function scanRepo(repoPath, options) {
  const includePatterns = Array.isArray(options?.includePatterns)
    ? options.includePatterns
    : [
        '**/components/**/*',
        '**/src/components/**/*',
        '**/lib/components/**/*',
        '**/packages/*/components/**/*',
      ];

  const excludePatterns = Array.isArray(options?.excludePatterns)
    ? options.excludePatterns
    : [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**',
        '**/coverage/**',
        '**/*.test.*',
        '**/*.spec.*',
        '**/*.stories.*',
      ];

  const componentExtensions = Array.isArray(options?.componentExtensions)
    ? options.componentExtensions
    : ['.tsx', '.ts', '.jsx', '.js', '.vue', '.svelte'];

  const maxDepth = typeof options?.maxDepth === 'number' ? options.maxDepth : 10;

  const entries = await fg(includePatterns, {
    cwd: repoPath,
    dot: false,
    onlyFiles: true,
    followSymbolicLinks: false,
    suppressErrors: true,
    deep: maxDepth,
    ignore: excludePatterns,
    absolute: false,
  });

  const filtered = entries.filter((p) => componentExtensions.includes(path.extname(p)));

  const results = [];
  for (const relPath of filtered) {
    const absPath = path.join(repoPath, relPath);
    try {
      const stat = await fsp.stat(absPath);
      if (!stat.isFile()) continue;
      if (stat.size > MAX_FILE_BYTES) continue;

      const content = await fsp.readFile(absPath, 'utf8');
      const ext = path.extname(relPath);
      const name = path.basename(relPath, ext);

      results.push({
        path: relPath,
        name,
        content,
        extension: ext,
        size: stat.size,
        lastModified: stat.mtime.toISOString(),
      });
    } catch (_) {
      // ignore unreadable files
    }
  }

  return results;
}

const server = http.createServer(async (req, res) => {
  if (!req.url) return sendText(res, 400, 'Missing url');

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === 'GET' && url.pathname === '/api/repo-info') {
    const repoPath = sanitizeRepoPath(url.searchParams.get('path'));
    if (!repoPath) return sendJson(res, 400, { error: 'Missing path' });

    try {
      const info = await getRepoInfo(repoPath);
      return sendJson(res, 200, info);
    } catch (e) {
      return sendJson(res, 500, { error: e?.message || 'Failed to get repo info' });
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/scan') {
    try {
      const body = await readJsonBody(req);
      const repoPath = sanitizeRepoPath(body?.path);
      if (!repoPath) return sendJson(res, 400, { error: 'Missing path' });

      const files = await scanRepo(repoPath, body?.options);
      return sendJson(res, 200, { files });
    } catch (e) {
      return sendJson(res, 500, { error: e?.message || 'Scan failed' });
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/source') {
    try {
      const body = await readJsonBody(req);
      const repoPath = sanitizeRepoPath(body?.repoPath);
      const filePath = body?.filePath;

      if (!repoPath) return sendJson(res, 400, { error: 'Missing repoPath' });
      if (!filePath) return sendJson(res, 400, { error: 'Missing filePath' });

      const absFile = safeJoinWithinRepo(repoPath, filePath);
      if (!absFile) return sendJson(res, 400, { error: 'Invalid file path' });

      const content = await fsp.readFile(absFile, 'utf8');
      return sendJson(res, 200, { content });
    } catch (e) {
      return sendJson(res, 500, { error: e?.message || 'Failed to read source file' });
    }
  }

  if (req.method === 'PUT' && url.pathname === '/api/source') {
    try {
      const body = await readJsonBody(req);
      const repoPath = sanitizeRepoPath(body?.repoPath);
      const filePath = body?.filePath;
      const content = body?.content;

      if (!repoPath) return sendJson(res, 400, { error: 'Missing repoPath' });
      if (!filePath) return sendJson(res, 400, { error: 'Missing filePath' });
      if (typeof content !== 'string') return sendJson(res, 400, { error: 'Missing content' });

      const absFile = safeJoinWithinRepo(repoPath, filePath);
      if (!absFile) return sendJson(res, 400, { error: 'Invalid file path' });

      await fsp.writeFile(absFile, content, 'utf8');
      return sendJson(res, 200, { success: true });
    } catch (e) {
      return sendJson(res, 500, { error: e?.message || 'Failed to write source file' });
    }
  }

  if (req.method === 'GET' && url.pathname === '/api/bundle') {
    const repoPath = sanitizeRepoPath(url.searchParams.get('repoPath'));
    const file = url.searchParams.get('file');

    if (!repoPath) return sendJson(res, 400, { error: 'Missing repoPath' });
    if (!file) return sendJson(res, 400, { error: 'Missing file' });

    const absEntry = safeJoinWithinRepo(repoPath, file);
    if (!absEntry) return sendJson(res, 400, { error: 'Invalid file path' });

    try {
      if (!esbuild) {
        // Lazy require so server can still start without esbuild installed.
        // eslint-disable-next-line global-require
        esbuild = require('esbuild');
      }

      const tsconfigPath = path.join(repoPath, 'tsconfig.json');
      const hasTsconfig = fileExists(tsconfigPath);

      const result = await esbuild.build({
        entryPoints: [absEntry],
        bundle: true,
        format: 'esm',
        platform: 'browser',
        jsx: 'automatic',
        sourcemap: 'inline',
        write: false,
        absWorkingDir: repoPath,
        tsconfig: hasTsconfig ? tsconfigPath : undefined,
        loader: {
          '.ts': 'ts',
          '.tsx': 'tsx',
          '.js': 'jsx',
          '.jsx': 'jsx',
          '.css': 'empty',
          '.scss': 'empty',
          '.sass': 'empty',
          '.less': 'empty',
          '.svg': 'dataurl',
          '.png': 'dataurl',
          '.jpg': 'dataurl',
          '.jpeg': 'dataurl',
          '.gif': 'dataurl',
          '.webp': 'dataurl',
        },
        external: [
          'react',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          'react-dom',
          'react-dom/client',
          '@mui/material',
          '@mui/material/*',
          '@mui/icons-material',
          '@mui/icons-material/*',
          '@emotion/react',
          '@emotion/styled',
        ],
        plugins: [
          {
            name: 'stub-unavailable',
            setup(build) {
              // Stub out packages that aren't available in browser preview
              const stubPatterns = [
                // Utility libraries
                /^lodash/,
                /^underscore$/,
                /^ramda$/,
                /^uuid$/,
                // Date/Time
                /^temporal-polyfill/,
                /^date-fns/,
                /^moment$/,
                /^dayjs$/,
                // Monitoring/Analytics
                /^@sentry\//,
                // HTTP/Network
                /^axios$/,
                /^fetch$/,
                /^node-fetch$/,
                // Routing
                /^react-router/,
                // State Management
                /^redux$/,
                /^@reduxjs\//,
                /^zustand$/,
                /^jotai$/,
                /^recoil$/,
                // Data Fetching
                /^@tanstack\//,
                /^swr$/,
                /^swr\//,
                // UI Libraries (non-MUI)
                /^react-tooltip$/,
                /^styled-components$/,
                /^@emotion\/styled$/,
                // Validation
                /^zod$/,
                /^zod\//,
                /^zod-validation-error$/,
                /^yup$/,
                /^joi$/,
                // Cookies/Storage
                /^cookie$/,
                /^cookieI$/,
                /^js-cookie$/,
                /^universal-cookie$/,
                // Cloudflare specific
                /^@cloudflare\//,
                // Forms
                /^react-hook-form$/,
                /^formik$/,
                // i18n
                /^react-i18next$/,
                /^i18next$/,
                // Testing
                /^@testing-library\//,
                // Build tools
                /^webpack$/,
                /^vite$/,
              ];

              build.onResolve({ filter: /.*/ }, (args) => {
                if (stubPatterns.some((pattern) => pattern.test(args.path))) {
                  return { path: args.path, namespace: 'stub' };
                }
              });

              build.onLoad({ filter: /.*/, namespace: 'stub' }, (args) => {
                return {
                  contents: `
                    const noop = () => {};
                    const mockComponent = (props) => null;
                    const mockValue = new Proxy({}, {
                      get: () => mockValue,
                      apply: () => mockValue,
                    });
                    
                    export default mockValue;
                    export const __esModule = true;
                    
                    // Export common named exports
                    export const get = mockValue;
                    export const set = mockValue;
                    export const map = mockValue;
                    export const filter = mockValue;
                    export const reduce = mockValue;
                    export const find = mockValue;
                    export const findIndex = mockValue;
                    export const forEach = mockValue;
                    export const some = mockValue;
                    export const every = mockValue;
                    export const includes = mockValue;
                    export const merge = mockValue;
                    export const cloneDeep = mockValue;
                    export const debounce = mockValue;
                    export const throttle = mockValue;
                    export const isEmpty = mockValue;
                    export const isEqual = mockValue;
                    export const pick = mockValue;
                    export const omit = mockValue;
                    
                    // UI Component exports
                    export const Div = mockComponent;
                    export const P = mockComponent;
                    export const Span = mockComponent;
                    export const Button = mockComponent;
                    export const Input = mockComponent;
                    export const Section = mockComponent;
                    export const Heading = mockComponent;
                    export const Text = mockComponent;
                    export const Box = mockComponent;
                    export const Flex = mockComponent;
                    export const Grid = mockComponent;
                    export const Card = mockComponent;
                    export const Container = mockComponent;
                    
                    // Hook exports
                    export const useQuery = mockValue;
                    export const useMutation = mockValue;
                    export const useRouter = mockValue;
                    export const useNavigate = mockValue;
                    export const useParams = mockValue;
                    export const useSearchParams = mockValue;
                    export const useState = mockValue;
                    export const useEffect = mockValue;
                    export const useCallback = mockValue;
                    export const useMemo = mockValue;
                    export const useRef = mockValue;
                    
                    // Validation exports
                    export const z = mockValue;
                    export const object = mockValue;
                    export const string = mockValue;
                    export const number = mockValue;
                    export const boolean = mockValue;
                    export const array = mockValue;
                    
                    // Utility exports
                    export const v4 = mockValue;
                    export const parse = mockValue;
                    export const stringify = mockValue;
                    export const format = mockValue;
                    
                    // Cloudflare style exports
                    export const createComponent = mockValue;
                    export const createStyledComponent = mockValue;
                    export const theme = mockValue;
                    export const styled = mockValue;
                    export const css = mockValue;
                    
                    // Additional common exports
                    export const Link = mockComponent;
                    export const Image = mockComponent;
                    export const Form = mockComponent;
                    export const Label = mockComponent;
                    export const Select = mockComponent;
                    export const Textarea = mockComponent;
                    export const Checkbox = mockComponent;
                    export const Radio = mockComponent;
                    export const Table = mockComponent;
                    export const Tr = mockComponent;
                    export const Td = mockComponent;
                    export const Th = mockComponent;
                    export const Tbody = mockComponent;
                    export const Thead = mockComponent;
                    export const Nav = mockComponent;
                    export const Header = mockComponent;
                    export const Footer = mockComponent;
                    export const Main = mockComponent;
                    export const Article = mockComponent;
                    export const Aside = mockComponent;
                    export const Hr = mockComponent;
                    export const Br = mockComponent;
                    export const Strong = mockComponent;
                    export const Em = mockComponent;
                    export const Code = mockComponent;
                    export const Pre = mockComponent;
                    export const Ul = mockComponent;
                    export const Ol = mockComponent;
                    export const Li = mockComponent;
                    export const H1 = mockComponent;
                    export const H2 = mockComponent;
                    export const H3 = mockComponent;
                    export const H4 = mockComponent;
                    export const H5 = mockComponent;
                    export const H6 = mockComponent;
                  `,
                  loader: 'js',
                };
              });
            },
          },
        ],
        logLevel: 'silent',
      });

      const js = result.outputFiles?.[0]?.text;
      if (!js) return sendJson(res, 500, { error: 'Bundling produced no output' });
      return sendJs(res, 200, js);
    } catch (e) {
      const message = e?.message || 'Bundle failed';
      return sendJson(res, 500, { error: message });
    }
  }

  return sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[scanner-server] listening on http://localhost:${PORT}`);
});
