#!/usr/bin/env python3
"""
Percorre tutta la storia usando le funzioni di gioco (raccogli, porte, dialoghi).
Serve a verificare che non ci siano vicoli ciechi e che il finale sia raggiungibile.
I nemici vengono eliminati all'ingresso di ogni stanza (qui si testa la logica, non il combattimento).
Uso: python3 tools/test_story.py [--novial]
"""
import os, sys, time, json
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NOVIAL = '--novial' in sys.argv
OUT = '/tmp'

STEPS = [
  ('use', 'document_ticket'), ('door', 'wagon_to_platform'),
  ('waitflag', 'phone_ringing'), ('use', 'public_phone'), ('waitflag', 'intro_complete'),
  ('door', 'platform_to_hall'),
  ('use', 'locker_flashlight'), ('use', 'notice_board'), ('door', 'hall_to_storage'),
  ('use', 'shelf_pistol'), ('use', 'crate_key'), ('use', 'document_note_storage'), ('use', 'guard_body'),
  ('door', 'storage_to_hall'), ('door', 'hall_to_control'),
  ('npc', 'carmine'), ('waitflag', 'carmine_talked'), ('use', 'shutter_lever'), ('waitflag', 'shutter_open'),
  ('use', 'doc_turni'), ('door', 'control_to_hall'), ('door', 'hall_to_exit'),
  ('use', 'exit_map'), ('use', 'police_body'), ('door', 'exit_to_city'),
  ('door', 'street_to_shop'), ('use', 'shop_safe'), ('expect_no_item', 'fuse'),
  ('use', 'shop_crowbar'), ('use', 'shop_meds'), ('use', 'shop_note'), ('door', 'shop_to_street'),
  ('door', 'street_to_apartment'), ('use', 'apt_diary'), ('use', 'apt_key'), ('door', 'apt_to_street'),
  ('door', 'street_to_shop'), ('use', 'shop_safe'), ('expect_item', 'fuse'), ('door', 'shop_to_street'),
  ('door', 'street_to_alley'), ('door', 'alley_to_hospital'),
  ('use', 'hosp_cart'), ('door', 'corr_to_morgue'), ('expect_room', 'hospital_corridor'),
  ('door', 'corr_to_ward'),
  ('use', 'ward_locker'), ('use', 'ward_badge'), ('use', 'ward_notes'), ('door', 'ward_to_corr'),
  ('door', 'corr_to_surgery'), ('vial', 'surg_fridge'), ('use', 'surg_protocol'), ('door', 'surg_to_corr'),
  ('door', 'corr_to_morgue'), ('use', 'morgue_report'), ('door', 'morgue_to_metro'),
  ('use', 'metro_notice'), ('door', 'mi_to_banchina'), ('use', 'mb_log'), ('door', 'mb_to_tunnel'),
  ('use', 'tunnel_notebook'), ('door', 'tunnel_to_gen'),
  ('door', 'gen_to_maint'), ('door', 'maint_to_safe'), ('expect_room', 'stanza_manutenzione'),
  ('door', 'maint_to_gen'),
  ('use', 'generator'), ('waitflag', 'power_on'), ('door', 'gen_to_maint'),
  ('use', 'maint_locker'), ('use', 'maint_bench'), ('door', 'maint_to_safe'),
  ('use', 'safe_recorder'), ('use', 'safe_shelf'), ('door', 'safe_to_lab'),
  ('door', 'li_to_corr'), ('use', 'lc_log'), ('door', 'lc_to_server'), ('door', 'server_to_core'),
  ('expect_room', 'sala_server'), ('door', 'server_to_lc'),
  ('door', 'lc_to_bio'), ('use', 'bio_usb'), ('door', 'bio_to_corr'), ('door', 'lc_to_server'),
  ('use', 'server_doc'), ('use', 'server_upload'), ('waitflag', 'data_sent'), ('door', 'server_to_core'),
  ('npc', 'elena'), ('waitflag', 'elena_talked'), ('use', 'core_letter'), ('door', 'core_to_port'),
  ('door', 'port_to_pier'), ('use', 'the_boat'), ('waitending', ''),
]

JS_HELPERS = r'''
window.__auto = setInterval(() => {
  const g = window._notteRossa; if (!g) return;
  if (g.dialogue.isActive()) { g.dialogue.advance(); g.dialogue.advance(); }
  const doc = document.getElementById('document-screen');
  if (!doc.classList.contains('hidden')) g.ui.closeTopOverlay();
  const save = document.getElementById('save-screen');
  if (!save.classList.contains('hidden')) g.ui.closeTopOverlay();
}, 60);
window.__kill = () => { const g = window._notteRossa; for (const e of g.enemyManager.enemies) { if (e.alive) { e.hp = 0; e.alive = false; e.state = 'DEAD'; g.enemyManager.onEnemyKilled(e); } } };
'''

def main():
    log, errors = [], []
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--allow-file-access-from-files'])
        pg = b.new_page(viewport={'width': 1280, 'height': 720})
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append(m.text) if m.type in ('error', 'warning') else None)
        pg.goto('file://' + os.path.join(ROOT, 'index.html'))
        time.sleep(1.5)
        pg.click('#btn-nuova')
        time.sleep(3.5)
        pg.evaluate(JS_HELPERS)
        pg.evaluate("() => { window._notteRossa.player.takeDamage = () => false; }")
        time.sleep(1)

        def room():  return pg.evaluate('window._notteRossa.roomManager.current.id')
        def idle():
            for _ in range(200):
                busy = pg.evaluate('''() => { const g = window._notteRossa;
                    return g._transitioning || g.events.isRunning() || g.dialogue.isActive(); }''')
                if not busy: return
                time.sleep(0.1)
        ok = True
        for kind, arg in STEPS:
            idle()
            pg.evaluate('window.__kill()')
            if kind in ('use', 'vial'):
                if kind == 'vial' and NOVIAL:
                    log.append(f'SALTO {arg} (prova senza provetta)'); continue
                res = pg.evaluate(f'''() => {{ const g = window._notteRossa; const h = g.roomManager.current.hotspots.find(h => h.id === '{arg}');
                    if (!h) return 'MANCANTE in ' + g.roomManager.current.id;
                    if (!g.roomManager.visible(h)) return 'NON VISIBILE';
                    if (g.roomManager.isPicked(h.id)) return 'GIÀ PRESO';
                    g.player.x = h.x + h.w/2 - g.player.width/2;
                    const n = g.roomManager.nearest(g.player);
                    if (!n || n.obj !== h) return 'NON È IL PIÙ VICINO: ' + (n && n.obj.id);
                    g._useHotspot(h); return 'ok'; }}''')
            elif kind == 'door':
                res = pg.evaluate(f'''() => {{ const g = window._notteRossa; const d = g.roomManager.current.doors.find(d => d.id === '{arg}');
                    if (!d) return 'MANCANTE in ' + g.roomManager.current.id;
                    if (!d.edge) {{ g.player.x = d.x + d.w/2 - g.player.width/2;
                      const n = g.roomManager.nearest(g.player); if (!n || n.obj !== d) return 'NON È IL PIÙ VICINO: ' + (n && n.obj.id); }}
                    return g._tryDoor(d) ? 'ok' : 'bloccata'; }}''')
                time.sleep(0.9)
            elif kind == 'npc':
                res = pg.evaluate(f'''() => {{ const g = window._notteRossa; const n = g.roomManager.current.npcs.find(n => n.id === '{arg}');
                    if (!n) return 'MANCANTE'; g.events.trigger(n.event); return 'ok'; }}''')
            elif kind == 'waitflag':
                for _ in range(300):
                    if pg.evaluate(f"!!window._notteRossa.events.getFlag('{arg}')"): break
                    time.sleep(0.1)
                res = 'ok' if pg.evaluate(f"!!window._notteRossa.events.getFlag('{arg}')") else 'FLAG MAI IMPOSTATO'
            elif kind == 'expect_item':
                res = 'ok' if pg.evaluate(f"window._notteRossa.inventory.hasItem('{arg}')") else 'OGGETTO ASSENTE'
            elif kind == 'expect_no_item':
                res = 'ok' if not pg.evaluate(f"window._notteRossa.inventory.hasItem('{arg}')") else 'OGGETTO PRESENTE (non doveva)'
            elif kind == 'expect_room':
                time.sleep(0.5)
                res = 'ok' if room() == arg else f'SONO IN {room()}'
            elif kind == 'waitending':
                for _ in range(100):
                    if pg.evaluate("!document.getElementById('ending-screen').classList.contains('hidden')"): break
                    time.sleep(0.1)
                res = pg.evaluate("document.getElementById('ending-title').textContent") or 'FINALE NON MOSTRATO'
                pg.screenshot(path=f'{OUT}/ending.png')
            line = f'{kind:14s} {arg:24s} [{room()}] -> {res}'
            log.append(line)
            expected_block = (kind == 'door' and arg in ('corr_to_morgue', 'maint_to_safe', 'server_to_core') and res == 'bloccata'
                              and any(s[0] == 'expect_room' for s in STEPS))
            if res not in ('ok',) and not res.startswith('FINALE') and not expected_block:
                if not (kind == 'use' and arg == 'shop_safe' and res == 'ok'):
                    log.append('   ^^^ PROBLEMA')
                    if kind != 'use' or arg != 'shop_safe':
                        pass
        inv = pg.evaluate("window._notteRossa.inventory.getSlots().filter(Boolean).map(s => s.id + 'x' + s.qty)")
        docs = pg.evaluate("window._notteRossa.inventory.getDocuments().length")
        b.close()
    print('\n'.join(log))
    print('\ninventario finale:', inv)
    print('documenti:', docs)
    print('errori console:', errors or 'nessuno')

if __name__ == '__main__':
    main()
