/**
 * Minimal YAML parser for our generated registry YAML.
 * Supports: mappings, nested mappings, lists, strings, numbers, booleans.
 * Limitations: no fancy YAML tags, no anchors, no multiline literals.
 * If you use advanced YAML, add dependency 'yaml' and replace with YAML.parse.
 */
export function parse(input) {
  // Heuristic: if file looks like JSON, parse JSON.
  const trimmed = input.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return JSON.parse(trimmed);

  const lines = input.split(/\r?\n/);
  const root = {};
  const stack = [{ indent: -1, value: root }];

  const parseScalar = (s) => {
    const t = s.trim();
    if (t === "true") return true;
    if (t === "false") return false;
    if (/^-?\d+$/.test(t)) return Number(t);
    if (/^-?\d+\.\d+$/.test(t)) return Number(t);
    // strip quotes if any
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1);
    return t;
  };

  for (const raw of lines) {
    const line = raw.replace(/\t/g, "    ");
    if (!line.trim() || line.trim().startsWith("#")) continue;

    const indent = line.match(/^ */)[0].length;
    while (stack.length && indent <= stack[stack.length - 1].indent) stack.pop();
    const parent = stack[stack.length - 1].value;

    if (line.trim().startsWith("- ")) {
      // list item
      const itemText = line.trim().slice(2);
      if (!Array.isArray(parent.__list)) parent.__list = [];
      if (itemText.includes(":")) {
        const obj = {};
        parent.__list.push(obj);
        stack.push({ indent, value: obj });
        const [k, v] = itemText.split(/:(.*)/).slice(0, 2);
        obj[k.trim()] = parseScalar(v ?? "");
      } else {
        parent.__list.push(parseScalar(itemText));
      }
      continue;
    }

    const m = line.trim().match(/^([^:]+):(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    const rest = (m[2] ?? "").trim();

    if (rest === "") {
      // start nested object
      const obj = {};
      parent[key] = obj;
      stack.push({ indent, value: obj });
    } else {
      parent[key] = parseScalar(rest);
    }
  }

  // Post-process: convert any {__list:[...]} placeholders into actual arrays
  const normalize = (node) => {
    if (node && typeof node === "object") {
      if (Array.isArray(node.__list) && Object.keys(node).length === 1) return node.__list.map(normalize);
      for (const k of Object.keys(node)) {
        node[k] = normalize(node[k]);
      }
      if (node.__list) {
        // If both map keys and list exist, keep list under 'items'
        node.items = node.__list.map(normalize);
        delete node.__list;
      }
    }
    return node;
  };

  return normalize(root);
}
