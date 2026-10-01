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
    'sprite_manifest', 'sprites', 'skin', 'input', 'audio', 'camera', 'collision',
    'dialogue', 'player', 'items', 'inventory', 'weapons', 'enemy',
    'events', 'citymap', 'ui', 'save', 'rooms_data', 'rooms', 'editor', 'touch', 'game', 'main',
]

def strip_modules(src):
    out = []
    for line in src.splitlines():
        if re.match(r'^\s*import\s.*from\s+[\'"].*[\'"];?\s*$', line):
            continue
        if re.match(r'^\s*export\s*\{[^}]*\}\s*;?\s*$', line):   # export { X };
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
    # suoni presenti in assets/audio (il gioco carica solo questi)
    adir = os.path.join(ROOT, 'assets', 'audio')
    present = sorted(f[:-4] for f in os.listdir(adir) if f.endswith('.mp3')) if os.path.isdir(adir) else []
    bundle = bundle.replace('/*__AUDIO_FILES__*/null', repr(present).replace("'", '"'))
    # immagini dell'interfaccia e degli effetti presenti (js/skin.js carica solo queste)
    ui = []
    for sub in ('ui', 'fx', 'fonts'):
        d = os.path.join(ROOT, 'assets', sub)
        if os.path.isdir(d):
            ui += [f'assets/{sub}/{f}' for f in sorted(os.listdir(d)) if f.endswith(('.png', '.woff2', '.ttf'))]
    bundle = bundle.replace('/*__UI_FILES__*/null', repr(ui).replace("'", '"'))
    bgd = os.path.join(ROOT, 'assets', 'backgrounds', 'v2')
    bgs = [f'assets/backgrounds/v2/{f}' for f in sorted(os.listdir(bgd)) if f.endswith('.png')]
    bundle = bundle.replace('/*__BG_FILES__*/null', repr(bgs).replace("'", '"'))
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
