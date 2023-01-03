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
    const html = `<html><head><title>${game.name}</title><link rel="shortcut icon" href="/assets/help.png" type="image/png"><link rel="stylesheet" href="/assets/github-markdown-dark.css"><style>body{margin:0;}.markdown-body{min-width:100%;min-height:100%;}</style></head><body><div class="markdown-body">${mdhtml}</div></body></html>`;
    res.send(html);
  } else {
    res.send(`<h1>404 Not Found</h1><p>Unknown game identifier \`${name}'</p><span>Queried path: <code>${mdPath}</code></span>`);
  }
});