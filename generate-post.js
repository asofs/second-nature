const fs = require('fs');
const path = require('path');

const input = process.argv[2];
if (!input) {
  console.log('Usage: node generate-post.js drafts/your-post.md');
  process.exit(1);
}

const raw = fs.readFileSync(input, 'utf-8');
const lines = raw.split('\n');

let title = '';
let subtitle = '';
let image = '';
const bodyParts = [];

let i = 0;
while (i < lines.length) {
  const line = lines[i];

  if (line.startsWith('TITLE:')) {
    title = line.replace('TITLE:', '').trim();
    i++;
    continue;
  }

  if (line.startsWith('SUBTITLE:')) {
    subtitle = line.replace('SUBTITLE:', '').trim();
    i++;
    continue;
  }

  if (line.startsWith('IMAGE:')) {
    image = line.replace('IMAGE:', '').trim();
    i++;
    continue;
  }

  const imageMatch = line.match(/^\[IMAGE:\s*(.+?),\s*(\d+)%\]$/);
  if (imageMatch) {
    const imgPath = imageMatch[1].trim();
    const width = imageMatch[2];
    bodyParts.push(
      `    <div class="article-img" style="width: ${width}%;">` +
      `\n      <img class="tape" src="../tape.png">` +
      `\n      <img src="${imgPath}" alt="">` +
      `\n    </div>`
    );
    i++;
    continue;
  }

  const quoteMatch = line.match(/^\[QUOTE:\s*(.+)\]$/);
  if (quoteMatch) {
    bodyParts.push(`    <blockquote>${quoteMatch[1].trim()}</blockquote>`);
    i++;
    continue;
  }

  if (line.trim() === '') {
    i++;
    continue;
  }

  // Collect paragraph lines
  let para = '';
  while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('TITLE:') && !lines[i].startsWith('SUBTITLE:') && !lines[i].startsWith('IMAGE:') && !lines[i].match(/^\[IMAGE:/) && !lines[i].match(/^\[QUOTE:/)) {
    para += (para ? ' ' : '') + lines[i].trim();
    i++;
  }
  if (para) {
    bodyParts.push(`    <p>${para}</p>`);
  }
}

const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const outputPath = path.join('posts', `${slug}.html`);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Second Nature</title>
<link rel="stylesheet" href="../styles.css">
</head>
<body>

<nav>
  <a href="../index.html">archive</a>
  <a href="../about.html">about</a>
</nav>

<div class="article-view">

  <div class="article-header">
    <h1>${title}</h1>
    <p class="subtitle">${subtitle}</p>
  </div>

  <div class="article-body">
${bodyParts.join('\n\n')}
  </div>
</div>

</body>
</html>
`;

fs.writeFileSync(outputPath, html);

// Add card to index.html
const indexPath = 'index.html';
let indexHtml = fs.readFileSync(indexPath, 'utf-8');

const cardImage = image || `${slug}.png`;
const cardBlock = `
    <a class="card" href="posts/${slug}.html">
      <div class="card-wrapper">
        <img class="tape" src="tape.png">
        <div class="card-paper">
          <img class="card-img" src="images/${cardImage}" alt="${title.toLowerCase()}">
        </div>
      </div>
      <span class="card-title">${title.toLowerCase()}</span>
    </a>
`;

const marker = '<!-- ADD NEW CARDS HERE, AT THE TOP OF THIS LIST -->';
indexHtml = indexHtml.replace(marker, marker + '\n' + cardBlock);
fs.writeFileSync(indexPath, indexHtml);

console.log(`\u2713 Created ${outputPath}`);
console.log(`\u2713 Added card to index.html`);
console.log(`\u2192 Don't forget to add your image to images/${cardImage}`);
