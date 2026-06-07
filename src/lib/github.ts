import https from 'https'

interface GitHubOptions {
  token?: string
  baseUrl?: string
}

function apiRequest<T>(url: string, token?: string, method = 'GET', body?: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      method,
      headers: {
        'User-Agent': 'ECHO-Developer-Studio',
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
    }

    const req = https.request(url, options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(parsed.message || `HTTP ${res.statusCode}`))
          } else {
            resolve(parsed as T)
          }
        } catch {
          reject(new Error(`Invalid JSON: ${data.slice(0, 200)}`))
        }
      })
    })

    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

export interface GitHubIssue {
  number: number
  title: string
  state: string
  labels: Array<{ name: string }>
  user: { login: string }
  created_at: string
  html_url: string
}

export interface GitHubPR {
  number: number
  title: string
  state: string
  user: { login: string }
  head: { ref: string }
  created_at: string
  html_url: string
}

export interface GitHubCIStatus {
  state: string
  statuses: Array<{ context: string; state: string; description?: string }>
}

export function getIssues(repo: string, state: 'open' | 'closed' | 'all' = 'open', token?: string): Promise<GitHubIssue[]> {
  return apiRequest<GitHubIssue[]>(`https://api.github.com/repos/${repo}/issues?state=${state}&per_page=100`, token)
}

export function getPRs(repo: string, state: 'open' | 'closed' | 'all' = 'open', token?: string): Promise<GitHubPR[]> {
  return apiRequest<GitHubPR[]>(`https://api.github.com/repos/${repo}/pulls?state=${state}&per_page=100`, token)
}

export function getCIStatus(repo: string, ref: string, token?: string): Promise<GitHubCIStatus> {
  return apiRequest<GitHubCIStatus>(`https://api.github.com/repos/${repo}/commits/${ref}/status`, token)
}

export function createIssue(repo: string, title: string, body: string, labels: string[], token?: string): Promise<GitHubIssue> {
  return apiRequest<GitHubIssue>(`https://api.github.com/repos/${repo}/issues`, token, 'POST', JSON.stringify({ title, body, labels }))
}

export function createComment(repo: string, issueNumber: number, body: string, token?: string): Promise<unknown> {
  return apiRequest<unknown>(`https://api.github.com/repos/${repo}/issues/${issueNumber}/comments`, token, 'POST', JSON.stringify({ body }))
}
