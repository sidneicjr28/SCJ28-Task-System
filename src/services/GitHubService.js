const fs = require('fs');
const path = require('path');
const db = require('../../database');
const projectRepo = require('../repositories/ProjectRepository');
const taskRepo = require('../repositories/TaskRepository');

const settingsPath = path.join(process.cwd(), 'settings.json');

class GitHubService {
  getSettings() {
    try {
      if (fs.existsSync(settingsPath)) {
        const raw = fs.readFileSync(settingsPath, 'utf8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error reading settings.json:', err);
    }
    return {};
  }

  saveSettings(newSettings) {
    try {
      const current = this.getSettings();
      const merged = { ...current, ...newSettings };
      fs.writeFileSync(settingsPath, JSON.stringify(merged, null, 2), 'utf8');
      return merged;
    } catch (err) {
      console.error('Error writing settings.json:', err);
      throw err;
    }
  }

  saveConfig({ client_id, client_secret }) {
    try {
      const envPath = path.join(process.cwd(), '.env');
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }

      const lines = envContent.split('\n');
      let hasId = false;
      let hasSecret = false;

      const newLines = lines.map(line => {
        if (line.startsWith('GITHUB_CLIENT_ID=')) {
          hasId = true;
          return `GITHUB_CLIENT_ID=${client_id || ''}`;
        }
        if (line.startsWith('GITHUB_CLIENT_SECRET=')) {
          hasSecret = true;
          return `GITHUB_CLIENT_SECRET=${client_secret || ''}`;
        }
        return line;
      });

      if (!hasId) newLines.push(`GITHUB_CLIENT_ID=${client_id || ''}`);
      if (!hasSecret) newLines.push(`GITHUB_CLIENT_SECRET=${client_secret || ''}`);

      fs.writeFileSync(envPath, newLines.join('\n'), 'utf8');

      if (client_id) process.env.GITHUB_CLIENT_ID = client_id;
      if (client_secret) process.env.GITHUB_CLIENT_SECRET = client_secret;

      return { success: true };
    } catch (err) {
      console.error('Error saving config to .env:', err);
      throw err;
    }
  }

  getOAuthConfig() {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...vals] = trimmed.split('=');
            if (key) {
              const val = vals.join('=').trim().replace(/^["']|["']$/g, '');
              if (val) {
                process.env[key.trim()] = val;
              }
            }
          }
        });
      } catch (err) {
        console.error('Error reading .env in getOAuthConfig:', err);
      }
    }

    const settings = this.getSettings();
    const clientId = (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_ID.trim()) || (settings.github_client_id && settings.github_client_id.trim()) || '';
    const clientSecret = (process.env.GITHUB_CLIENT_SECRET && process.env.GITHUB_CLIENT_SECRET.trim()) || (settings.github_client_secret && settings.github_client_secret.trim()) || '';

    return {
      clientId,
      clientSecret,
      accessToken: process.env.GITHUB_ACCESS_TOKEN || settings.github_access_token || null,
      user: settings.github_user || null
    };
  }

  getAuthUrl(redirectUri) {
    const config = this.getOAuthConfig();
    if (!config.clientId) {
      throw new Error('GitHub OAuth Client ID is not configured. Please set GITHUB_CLIENT_ID or save Client ID in settings.');
    }
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      scope: 'repo read:project project',
      state: Math.random().toString(36).substring(2)
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code, redirectUri) {
    const config = this.getOAuthConfig();
    if (!config.clientId || !config.clientSecret) {
      throw new Error('GitHub OAuth Client ID or Client Secret missing');
    }

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: redirectUri
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error_description || data.error);
    }

    const accessToken = data.access_token;
    
    // Fetch GitHub User Info
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'SCJ28-Task-System'
      }
    });
    const userData = await userRes.json();

    this.saveSettings({
      github_access_token: accessToken,
      github_user: {
        login: userData.login,
        name: userData.name,
        avatar_url: userData.avatar_url,
        html_url: userData.html_url
      }
    });

    return { accessToken, user: userData };
  }

  async disconnect() {
    this.saveSettings({
      github_access_token: null,
      github_user: null
    });
    return { success: true };
  }

  async fetchBoardData(projectId) {
    const project = projectRepo.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    if (!project.github_repo) {
      return {
        configured: false,
        message: 'No GitHub repository linked to this project yet.'
      };
    }

    const config = this.getOAuthConfig();
    const headers = {
      'User-Agent': 'SCJ28-Task-System',
      'Accept': 'application/vnd.github.v3+json'
    };
    if (config.accessToken) {
      headers['Authorization'] = `Bearer ${config.accessToken}`;
    }

    const [owner, repo] = project.github_repo.split('/');
    if (!owner || !repo) {
      throw new Error('Invalid repository format. Expected "owner/repo"');
    }

    // Fetch repository issues (up to 100 open issues)
    const issuesUrl = `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=100&sort=updated`;
    const issuesRes = await fetch(issuesUrl, { headers });
    
    if (!issuesRes.ok) {
      const errText = await issuesRes.text();
      throw new Error(`GitHub API Error (${issuesRes.status}): ${errText}`);
    }

    const rawIssues = await issuesRes.json();
    
    // Filter out pull requests (GitHub API includes PRs in issues list)
    const issues = rawIssues.filter(item => !item.pull_request).map(issue => {
      // Check if this issue is already imported into local tasks
      const localTask = db.prepare('SELECT id, status FROM tasks WHERE github_issue_id = ?').get(issue.id);
      
      let status = 'todo';
      if (issue.state === 'closed') {
        status = 'done';
      } else if (issue.assignees && issue.assignees.length > 0) {
        status = 'in_progress';
      }

      return {
        id: issue.id,
        number: issue.number,
        title: issue.title,
        body: issue.body,
        state: issue.state,
        html_url: issue.html_url,
        labels: issue.labels ? issue.labels.map(l => ({ name: l.name, color: l.color })) : [],
        assignees: issue.assignees ? issue.assignees.map(a => ({ login: a.login, avatar_url: a.avatar_url })) : [],
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        status: status,
        is_imported: !!localTask,
        local_task_id: localTask ? localTask.id : null
      };
    });

    return {
      configured: true,
      repo: project.github_repo,
      project_id: project.github_project_id,
      issues
    };
  }

  async createIssue(projectId, { title, body, labels }) {
    const project = projectRepo.findById(projectId);
    if (!project || !project.github_repo) {
      throw new Error('Project has no GitHub repository configured');
    }

    const config = this.getOAuthConfig();
    if (!config.accessToken) {
      throw new Error('GitHub account is not connected. Please authenticate via OAuth first.');
    }

    const [owner, repo] = project.github_repo.split('/');
    const url = `https://api.github.com/repos/${owner}/${repo}/issues`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'User-Agent': 'SCJ28-Task-System',
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({ title, body, labels })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to create issue: ${errText}`);
    }

    return await response.json();
  }

  async importIssueToTask(projectId, issueData) {
    const { id: issue_id, number: issue_number, title, body, html_url, status } = issueData;

    // Check if task already imported
    const existing = db.prepare('SELECT * FROM tasks WHERE github_issue_id = ?').get(issue_id);
    if (existing) {
      return existing;
    }

    const mappedStatus = status === 'closed' || status === 'done' ? 'done' : 'todo';

    const insertStmt = db.prepare(`
      INSERT INTO tasks (project_id, title, description, status, priority, github_issue_id, github_issue_number, github_issue_url)
      VALUES (?, ?, ?, ?, 3, ?, ?, ?)
    `);

    const info = insertStmt.run(
      projectId,
      `[#${issue_number}] ${title}`,
      body || '',
      mappedStatus,
      issue_id,
      issue_number,
      html_url
    );

    return taskRepo.findById(info.lastInsertRowid);
  }
}

module.exports = new GitHubService();
