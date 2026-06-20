import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_CLAUDE_COMMAND = 'claude';
const CLAUDE_SCRIPT_EXTENSIONS = new Set(['.cjs', '.js', '.jsx', '.mjs', '.ts', '.tsx']);
const CLAUDE_WRAPPER_SEGMENTS = ['node_modules', '@anthropic-ai', 'claude-code', 'bin', 'claude.exe'] as const;

export type ResolveClaudeCodeExecutablePathDependencies = {
  execFileSync?: typeof execFileSync;
  existsSync?: typeof fs.existsSync;
  platform?: NodeJS.Platform;
  readFileSync?: typeof fs.readFileSync;
};

function getPathApi(platform: NodeJS.Platform) {
  return platform === 'win32' ? path.win32 : path;
}

function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function isPathLike(value: string): boolean {
  return value.includes('/') || value.includes('\\');
}

function resolveClaudeWrapperBinary(
  wrapperPath: string,
  deps: Required<ResolveClaudeCodeExecutablePathDependencies>,
): string | null {
  const pathApi = getPathApi(deps.platform);
  const directCandidate = pathApi.resolve(pathApi.dirname(wrapperPath), ...CLAUDE_WRAPPER_SEGMENTS);

  if (deps.existsSync(directCandidate)) {
    return directCandidate;
  }

  let content: string;
  try {
    content = deps.readFileSync(wrapperPath, 'utf8');
  } catch {
    return null;
  }

  const matches = content.matchAll(/["']([^"'\\\r\n]*claude\.exe)["']/gi);
  for (const match of matches) {
    const rawTarget = match[1]
      .replace(/^\$basedir[\\/]/i, '')
      .replace(/^%dp0%[\\/]/i, '')
      .replace(/^%~dp0[\\/]/i, '');
    const normalizedTarget = rawTarget.replace(/[\\/]/g, pathApi.sep);
    const candidate = pathApi.isAbsolute(normalizedTarget)
      ? normalizedTarget
      : pathApi.resolve(pathApi.dirname(wrapperPath), normalizedTarget);

    if (deps.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Returns the Windows ANSI code page number (e.g. 936 for GBK/Chinese).
 */
function readWindowsAnsiCodePage(
  execFileSyncFn: typeof execFileSync,
): number | null {
  try {
    const stdout = execFileSyncFn('reg.exe', [
      'query',
      'HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Nls\\CodePage',
      '/v', 'ACP',
    ], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
    });
    const match = stdout.match(/ACP\s+REG_SZ\s+(\d+)/);
    return match ? Number.parseInt(match[1], 10) : null;
  } catch {
    return null;
  }
}

/**
 * Tries to decode a buffer using a Windows code page number.
 * Falls back to the raw buffer if the codec is not available.
 */
function decodeWithCodePage(buffer: Buffer, codePage: number): string {
  try {
    // Node.js TextDecoder supports common Windows codec names.
    // CP 936  → 'gbk'
    // CP 932  → 'shift_jis'
    // CP 949  → 'euc-kr'
    // CP 950  → 'big5'
    // CP 1252 → 'windows-1252'
    const encodingMap: Record<number, string> = {
      936: 'gbk',
      932: 'shift_jis',
      949: 'euc-kr',
      950: 'big5',
      1250: 'windows-1250',
      1251: 'windows-1251',
      1252: 'windows-1252',
      1253: 'windows-1253',
      1254: 'windows-1254',
      1255: 'windows-1255',
      1256: 'windows-1256',
      1257: 'windows-1257',
      1258: 'windows-1258',
    };
    const encoding = encodingMap[codePage] || 'utf8';
    return new TextDecoder(encoding).decode(buffer);
  } catch {
    return buffer.toString('utf8');
  }
}

function resolveWindowsClaudeExecutablePath(
  configuredPath: string,
  deps: Required<ResolveClaudeCodeExecutablePathDependencies>,
): string {
  const pathApi = getPathApi(deps.platform);
  const extension = pathApi.extname(configuredPath).toLowerCase();
  const explicitPath = isPathLike(configuredPath) || pathApi.isAbsolute(configuredPath);

  if (CLAUDE_SCRIPT_EXTENSIONS.has(extension)) {
    return configuredPath;
  }

  if (explicitPath && extension === '.exe') {
    return configuredPath;
  }

  if (explicitPath) {
    // npm bin wrappers (e.g. node_modules/.bin/claude) resolve to the
    // real binary one directory level up from .bin.
    if (!pathApi.isAbsolute(configuredPath) || pathApi.basename(pathApi.dirname(configuredPath)) === '.bin') {
      const binCandidate = pathApi.resolve(pathApi.dirname(configuredPath), '..', ...CLAUDE_WRAPPER_SEGMENTS);
      if (deps.existsSync(binCandidate)) {
        return binCandidate;
      }
    }

    return resolveClaudeWrapperBinary(configuredPath, deps) ?? configuredPath;
  }

  try {
    // where.exe outputs in the system ANSI code page (not UTF-8) on
    // non-UTF-8 Windows locales (Chinese, Japanese, Korean, etc.).
    // Decode with the system code page so non-ASCII paths resolve correctly.
    const ansiCodePage = readWindowsAnsiCodePage(deps.execFileSync) || 1252;
    const stdoutBuf: Buffer = deps.execFileSync('where.exe', [configuredPath], {
      encoding: 'buffer',
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
    }) as Buffer;
    const stdout = decodeWithCodePage(stdoutBuf, ansiCodePage);
    const candidates = stdout
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter(Boolean);

    for (const candidate of candidates) {
      if (pathApi.extname(candidate).toLowerCase() === '.exe') {
        return candidate;
      }
    }

    for (const candidate of candidates) {
      // npm .bin wrappers need to resolve up one directory
      if (pathApi.basename(pathApi.dirname(candidate)) === '.bin') {
        const binCandidate = pathApi.resolve(pathApi.dirname(candidate), '..', ...CLAUDE_WRAPPER_SEGMENTS);
        if (deps.existsSync(binCandidate)) {
          return binCandidate;
        }
      }
      const resolved = resolveClaudeWrapperBinary(candidate, deps);
      if (resolved) {
        return resolved;
      }
    }
  } catch {
    return configuredPath;
  }

  return configuredPath;
}

export function resolveClaudeCodeExecutablePath(
  configuredPath: string | undefined = process.env.CLAUDE_CLI_PATH,
  dependencies: ResolveClaudeCodeExecutablePathDependencies = {},
): string {
  const deps: Required<ResolveClaudeCodeExecutablePathDependencies> = {
    execFileSync: dependencies.execFileSync ?? execFileSync,
    existsSync: dependencies.existsSync ?? fs.existsSync,
    platform: dependencies.platform ?? process.platform,
    readFileSync: dependencies.readFileSync ?? fs.readFileSync,
  };

  const normalizedPath = stripWrappingQuotes(configuredPath || DEFAULT_CLAUDE_COMMAND);
  if (deps.platform !== 'win32') {
    return normalizedPath;
  }

  return resolveWindowsClaudeExecutablePath(normalizedPath, deps);
}
