const githubService = require('../services/GitHubService');

class GitHubController {
  getAuthUrl(req, res) {
    try {
      const redirectUri = `${req.protocol}://${req.get('host')}/api/github/callback`;
      const url = githubService.getAuthUrl(redirectUri);
      res.json({ url });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async handleCallback(req, res) {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(400).send('Authorization code is missing');
      }
      const redirectUri = `${req.protocol}://${req.get('host')}/api/github/callback`;
      await githubService.exchangeCodeForToken(code, redirectUri);
      
      // Redirect back to main application frontend
      res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>GitHub Connected</title></head>
        <body style="background:#0a0a0a;color:#fff;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;">
          <div style="text-align:center;">
            <h2>GitHub Account Connected Successfully!</h2>
            <p>Closing window and returning to SCJ28...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GITHUB_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
          </div>
        </body>
        </html>
      `);
    } catch (err) {
      res.status(500).send(`Authentication Failed: ${err.message}`);
    }
  }

  getStatus(req, res) {
    try {
      const config = githubService.getOAuthConfig();
      res.json({
        connected: !!config.accessToken,
        user: config.user,
        hasClientId: !!config.clientId
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async disconnect(req, res) {
    try {
      const result = await githubService.disconnect();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async saveConfig(req, res) {
    try {
      const { client_id, client_secret } = req.body;
      const updated = githubService.saveSettings({
        github_client_id: client_id,
        github_client_secret: client_secret
      });
      res.json({ success: true, hasClientId: !!updated.github_client_id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getBoardData(req, res) {
    try {
      const { projectId } = req.params;
      const data = await githubService.fetchBoardData(projectId);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async createIssue(req, res) {
    try {
      const { projectId } = req.params;
      const { title, body, labels } = req.body;
      if (!title) {
        return res.status(400).json({ error: 'Issue title is required' });
      }
      const newIssue = await githubService.createIssue(projectId, { title, body, labels });
      res.status(201).json(newIssue);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async importTask(req, res) {
    try {
      const { projectId } = req.params;
      const issueData = req.body;
      if (!issueData || !issueData.id) {
        return res.status(400).json({ error: 'Valid issue data is required' });
      }
      const task = await githubService.importIssueToTask(projectId, issueData);
      res.status(201).json(task);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new GitHubController();
