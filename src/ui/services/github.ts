import { Settings, TokenFile } from '../../shared/types';

const BASE = 'https://api.github.com';

export class GitHubClient {
  constructor(private settings: Settings) {}

  private headers() {
    return {
      Authorization: `Bearer ${this.settings.pat}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  private toBase64(str: string): string {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
  }

  private fromBase64(base64: string): string {
    const binary = atob(base64.replace(/\n/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  }

  async validatePat(): Promise<{ login: string }> {
    const res = await fetch(`${BASE}/user`, { headers: this.headers() });
    await throwIfError(res);
    return res.json();
  }

  async getFileContent(): Promise<{ content: TokenFile; sha: string }> {
    const { owner, repo, branch, filePath } = this.settings;
    const res = await fetch(
      `${BASE}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
      { headers: this.headers() }
    );
    if (res.status === 404) {
      return { content: {}, sha: '' };
    }
    await throwIfError(res);
    const data = await res.json();
    const decoded = this.fromBase64(data.content);
    return { content: JSON.parse(decoded), sha: data.sha };
  }

  async commitFile(
    tokens: TokenFile,
    sha: string,
    commitMessage: string
  ): Promise<{ html_url: string; newSha: string }> {
    const { owner, repo, branch, filePath } = this.settings;
    const content = this.toBase64(JSON.stringify(tokens, null, 2));
    const res = await fetch(`${BASE}/repos/${owner}/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify({ message: commitMessage, content, sha: sha || undefined, branch }),
    });
    await throwIfError(res);
    const data = await res.json();
    // content.sha is the new blob SHA — use it to avoid a second round-trip
    return { html_url: data.commit.html_url, newSha: data.content.sha as string };
  }

  async createPR(
    tokens: TokenFile,
    sha: string,
    changelog: string
  ): Promise<{ html_url: string }> {
    const { owner, repo, branch, filePath } = this.settings;
    const date = new Date().toISOString().slice(0, 10);
    const prBranch = `figma-sync/${date}`;

    // 1. Get base SHA
    const refRes = await fetch(
      `${BASE}/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      { headers: this.headers() }
    );
    await throwIfError(refRes);
    const refData = await refRes.json();
    const baseSha = refData.object.sha;

    // 2. Create branch
    const branchRes = await fetch(`${BASE}/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ ref: `refs/heads/${prBranch}`, sha: baseSha }),
    });
    await throwIfError(branchRes);

    // 3. Commit to new branch
    const content = this.toBase64(JSON.stringify(tokens, null, 2));
    await fetch(`${BASE}/repos/${owner}/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify({
        message: `chore: sync design tokens from Figma [${date}]`,
        content,
        sha: sha || undefined,
        branch: prBranch,
      }),
    });

    // 4. Create PR
    const prRes = await fetch(`${BASE}/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        title: `Design tokens sync [${date}]`,
        body: `## Changelog\n\n${changelog}`,
        head: prBranch,
        base: branch,
      }),
    });
    await throwIfError(prRes);
    const prData = await prRes.json();
    return { html_url: prData.html_url };
  }
}

async function throwIfError(res: Response) {
  if (res.ok) return;
  const body = await res.json().catch(() => ({}));
  const message = body.message ?? res.statusText;
  if (res.status === 401) throw new Error(`Ошибка авторизации: ${message}`);
  if (res.status === 403) throw new Error(`Нет доступа: ${message}. Проверьте scope PAT (repo)`);
  if (res.status === 409) throw new Error(`Конфликт SHA: ${message}. Повторите попытку.`);
  if (res.status === 429) throw new Error(`Rate limit GitHub. Подождите и повторите.`);
  throw new Error(`GitHub API error ${res.status}: ${message}`);
}
