// CommonJS helper to keep Playwright test import simple without tsconfig changes.
function parseScalar(s) {
  const t = String(s).trim();
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (/^-?\d+$/.test(t)) return Number(t);
  if (/^-?\d+\.\d+$/.test(t)) return Number(t);
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1);
  return t;
}

function parseYamlLite(input) {
  const trimmed = input.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return JSON.parse(trimmed);

  const lines = input.split(/\r?\n/);
  const root = {};
  const stack = [{ indent: -1, value: root }];

  for (const raw of lines) {
    const line = raw.replace(/\t/g, '    ');
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const indent = (line.match(/^ */) || [''])[0].length;
    while (stack.length && indent <= stack[stack.length - 1].indent) stack.pop();
    const parent = stack[stack.length - 1].value;

    if (line.trim().startsWith('- ')) {
      const itemText = line.trim().slice(2);
      if (!Array.isArray(parent.__list)) parent.__list = [];
      if (itemText.includes(':')) {
        const obj = {};
        parent.__list.push(obj);
        stack.push({ indent, value: obj });
        const parts = itemText.split(/:(.*)/);
        obj[parts[0].trim()] = parseScalar(parts[1] ?? '');
      } else {
        parent.__list.push(parseScalar(itemText));
      }
      continue;
    }

    const m = line.trim().match(/^([^:]+):(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    const rest = (m[2] ?? '').trim();

    if (rest === '') {
      const obj = {};
      parent[key] = obj;
      stack.push({ indent, value: obj });
    } else {
      parent[key] = parseScalar(rest);
    }
  }

  const normalize = (node) => {
    if (node && typeof node === 'object') {
      if (Array.isArray(node.__list) && Object.keys(node).length === 1) return node.__list.map(normalize);
      for (const k of Object.keys(node)) node[k] = normalize(node[k]);
      if (node.__list) {
        node.items = node.__list.map(normalize);
        delete node.__list;
      }
    }
    return node;
  };

  return normalize(root);
}

module.exports = { parseYamlLite };
