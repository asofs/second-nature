// to run script, call node generate-post.js drafts/computers.md when in second-nature

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

marked.setOptions({ breaks: true, gfm: true });

const input = process.argv[2];
if (!input) {
  console.log('Usage: node generate-post.js drafts/your-post.md');
  process.exit(1);
}

const raw = fs.readFileSync(input, 'utf-8');
const lines = raw.split('\n');

// Parse header fields
let title = '';
let subtitle = '';
let image = '';
const bodyLines = [];
let inBody = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (!inBody) {
    if (line.startsWith('TITLE:')) {
      title = line.replace('TITLE:', '').trim();
      continue;
    }
    if (line.startsWith('SUBTITLE:')) {
      subtitle = line.replace('SUBTITLE:', '').trim();
      continue;
    }
    if (line.startsWith('IMAGE:')) {
      image = line.replace('IMAGE:', '').trim();
      continue;
    }
    // First non-header, non-empty line starts the body
    if (line.trim() === '') continue;
    inBody = true;
  }

  bodyLines.push(line);
}

// Process body: split into blocks by special tags vs markdown content
const bodyContent = bodyLines.join('\n');
const blocks = bodyContent.split('\n\n');
const bodyParts = [];

for (const block of blocks) {
  const trimmed = block.trim();
  if (!trimmed) continue;

  // Check for [IMAGE: path, width%]
  const imageMatch = trimmed.match(/^\[IMAGE:\s*(.+?),\s*(\d+)%\]$/);
  if (imageMatch) {
    const imgPath = imageMatch[1].trim().replace(/^\.\.\//, '../../');
    const width = imageMatch[2];
    bodyParts.push(
      `    <div class="article-img" style="width: ${width}%;">\n` +
      `      <img class="tape" src="../../tape.png">\n` +
      `      <img src="${imgPath}" alt="">\n` +
      `    </div>`
    );
    continue;
  }

  // Check for [QUOTE: text]
  const quoteMatch = trimmed.match(/^\[QUOTE:\s*(.+)\]$/s);
  if (quoteMatch) {
    bodyParts.push(`    <blockquote>${quoteMatch[1].trim()}</blockquote>`);
    continue;
  }

  // Parse as markdown
  const htmlBlock = marked(trimmed).trim();
  // Indent each line for clean formatting
  const indented = htmlBlock.split('\n').map(l => '    ' + l).join('\n');
  bodyParts.push(indented);
}

const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const outputDir = path.join('posts', slug);
const outputPath = path.join(outputDir, 'index.html');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Second Nature</title>
<link rel="stylesheet" href="../../styles.css">
</head>
<body>

<nav>
  <a href="../../index.html">archive</a>
  <a href="../../about.html">about</a>
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

// Add card to index.html (skip if already exists)
const indexPath = 'index.html';
let indexHtml = fs.readFileSync(indexPath, 'utf-8');

const cardImage = image || `${slug}.png`;

if (indexHtml.includes(`href="posts/${slug}/"`)) {
  console.log(`\u2713 Overwrote ${outputPath}`);
  console.log(`\u2014 Card already exists in index.html, skipped`);
} else {
  const cardBlock = `
    <a class="card" href="posts/${slug}/">
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
}

console.log(`\u2192 Don't forget to add your image to images/${cardImage}`);
