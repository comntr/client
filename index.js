const CONFIG_URL = 'config.json';
const UHASH_REGEX = /^[0-9a-f]{40}$/;

window.onload = async () => {
  log.i('DOM loaded.');

  const uhash = location.hash.slice(1).toLowerCase();
  log.i('URL hash:', uhash);
  if (!UHASH_REGEX.test(uhash))
    throw new Error('Invalid URL hash.');
  
  log.i('Loading config from', CONFIG_URL);
  const config = await (await fetch(CONFIG_URL)).json();
  log.i('Config:', config);
  
  const srvurl = config.server + '/' + uhash;
  log.i('Fetching comments snapshot from', srvurl);
  // const folderId = await (await fetch(srvurl)).text();
  const folderId = 'QmYGw1DiYo94kfSKGQfC83Jxt7w54gnuwoyBre2x3Wz3pc';
  log.i('Comments snapshot:', folderId);

  log.i('Loading IPFS script...');
  await loadScript(config.ipfs.src);
  log.i('Initializing IPFS node...');
  const ipfs = new Ipfs;
  window.ipfs = ipfs;
  await new Promise((resolve, reject) => {
    ipfs.on('ready', resolve);
    ipfs.on('error', reject);
  });
  
  log.i('Fetching comments from IPFS...');
  const files = await ipfs.get(folderId);
  log.i('Parsing comments...');
  const comments = files.map(file => [
    file.path,
    file.content.toString('utf8'),
  ]);

  log.i('Rendering comments:', comments);
  for (let [id, text] of comments) {
    const box = renderComment(id, text);
    document.body.appendChild(box);
  }

  log.i('Done.');
};

function renderComment(id, text) {
  const box = document.createElement('div');
  const title = document.createElement('div');
  const body = document.createElement('div');
  box.className = 'comment';
  title.className = 'title';
  body.className = 'body';
  title.textContent = id;
  body.textContent = text;
  return box;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function log(...args) {
  console.log(...args);
}

log.i = (...args) => console.info(...args);
log.w = (...args) => console.warn(...args);
log.e = (...args) => console.error(...args);
