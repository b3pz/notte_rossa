#!/usr/bin/env python3
"""
NOTTE ROSSA — build.py
Unisce i file di js/ in un unico <script> dentro index.html
(togliendo import/export), partendo da index.src.html.

Perché: i moduli ES6 (<script type="module">) non funzionano
aprendo il file dal computer (file://). Un unico script sì.

Uso:  python3 tools/build.py
"""
import os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ordine di dipendenza
ORDER = [
    'sprite_manifest', 'sprites', 'input', 'audio', 'camera', 'collision',
    'dialogue', 'player', 'items', 'inventory', 'weapons', 'enemy',
    'events', 'ui', 'save', 'rooms', 'game', 'main',
]

def strip_modules(src):
    out = []
    for line in src.splitlines():
        if re.match(r'^\s*import\s.*from\s+[\'"].*[\'"];?\s*$', line):
            continue
        line = re.sub(r'^export\s+(const|let|class|function)\s', r'\1 ', line)
        out.append(line)
    return '\n'.join(out)

def main():
    parts = []
    for name in ORDER:
        path = os.path.join(ROOT, 'js', name + '.js')
        with open(path, encoding='utf-8') as fh:
            parts.append(f'/* ───── {name}.js ───── */\n' + strip_modules(fh.read()))
    bundle = '\n\n'.join(parts)
    if re.search(r'^\s*(import|export)\s', bundle, re.M):
        sys.exit('ERRORE: import/export rimasti nel bundle')

    # controllo di sintassi con node, se disponibile
    tmp = os.path.join(ROOT, 'tools', '.bundle_check.js')
    with open(tmp, 'w', encoding='utf-8') as fh:
        fh.write(bundle)
    try:
        r = subprocess.run(['node', '--check', tmp], capture_output=True, text=True)
        if r.returncode != 0:
            sys.exit('ERRORE di sintassi nel bundle:\n' + r.stderr)
    except FileNotFoundError:
        print('(node non trovato: salto il controllo di sintassi)')
    finally:
        os.remove(tmp)

    with open(os.path.join(ROOT, 'index.src.html'), encoding='utf-8') as fh:
        html = fh.read()
    html = html.replace('/*__BUNDLE__*/', bundle.replace('</script>', '<\\/script>'))
    with open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8') as fh:
        fh.write(html)
    print(f'index.html scritto — {len(bundle.splitlines())} righe di JS, {len(html)//1024} KB')

if __name__ == '__main__':
    main()
