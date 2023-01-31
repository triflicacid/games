import express from 'express';
import MarkdownIt from 'markdown-it';
import fs from 'fs';
import { getInfo } from './games.js';

export const router = express.Router();
export default router;

router.get('/games', (req, res) => {
  res.redirect("/");
});

// Help: render README.md document for each game
router.get('/help/:name/', (req, res) => {
  const md = new MarkdownIt();
  const name = req.params.name, mdPath = `public/games/${name}/README.md`;
  if (fs.existsSync(mdPath)) {
    const game = getInfo()[name];
    const buff = fs.readFileSync(mdPath);
    const mdhtml = md.render(buff.toString(), { html: true });
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="shortcut icon" href="/assets/help.png" type="image/png">
    <link rel="stylesheet" href="/assets/github-markdown-dark.css">
    <style type="text/css">body{margin:0;width:100vw;height:100vh;}.markdown-body{min-width:100%;min-height:100%;}</style>
    <title>${game.name}</title>
</head>
<body>
    <div class="markdown-body">${mdhtml}</div>
</body>
</html>`;
    res.send(html);
  } else {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/assets/index.css">
    <title>Not Found</title>
</head>
<body>
    <h1>404 Not Found</h1>
    <p>Unknown game identifier \`${name}'</p>
    <span>Queried path: <code>${mdPath}</code></span>
</body>
</html>`;
    res.send(html);
  }
});