/* =============================================
   NOTTE ROSSA — items.js
   Oggetti (icona = nome in assets/sprites/cut/icons) e documenti
   ============================================= */

export const ITEMS = {
  // ── Strumenti e armi ──
  flashlight: { id: 'flashlight', name: 'Torcia', icon: 'flashlight', type: 'tool',
    description: 'Torcia a LED. [F] per accenderla. Consuma batteria e rende più facile essere visti.',
    equippable: true },
  pistol: { id: 'pistol', name: 'Pistola 9mm', icon: 'pistol', type: 'weapon', weaponId: 'pistol',
    description: 'Pistola di servizio della Polfer. Caricatore da 10 colpi.', equippable: true },
  shotgun: { id: 'shotgun', name: 'Fucile a pompa', icon: 'shotgun', type: 'weapon', weaponId: 'shotgun',
    description: 'Fucile della vigilanza dell\'ospedale. Devastante da vicino, inutile da lontano.', equippable: true },
  crowbar: { id: 'crowbar', name: 'Piede di porco', icon: 'crowbar', type: 'tool',
    description: 'Una leva d\'acciaio. Utile per le assi inchiodate.' },

  // ── Munizioni (la quantità raccolta è ammoCount) ──
  ammo_pistol_small: { id: 'ammo_pistol_small', name: 'Munizioni 9mm', icon: 'ammo_pistol', type: 'ammo',
    ammoCount: 12, stackable: true, maxStack: 99,
    description: 'Proiettili 9mm Luger. [R] per ricaricare.' },
  ammo_shells: { id: 'ammo_shells', name: 'Cartucce cal.12', icon: 'ammo_shells', type: 'ammo',
    ammoCount: 6, stackable: true, maxStack: 48,
    description: 'Cartucce per il fucile a pompa.' },

  // ── Cure ──
  medikit_small: { id: 'medikit_small', name: 'Kit medico', icon: 'medikit', type: 'heal', healAmount: 50,
    stackable: true, maxStack: 5, usable: true,
    description: 'Kit di pronto soccorso. Ripristina molta salute.' },
  bandage: { id: 'bandage', name: 'Bende', icon: 'bandage', type: 'heal', healAmount: 20,
    stackable: true, maxStack: 6, usable: true,
    description: 'Bende sterili. Ripristinano un po\' di salute.' },
  painkillers: { id: 'painkillers', name: 'Antidolorifici', icon: 'painkillers', type: 'heal', healAmount: 35,
    stackable: true, maxStack: 4, usable: true,
    description: 'Paracetamolo 500mg. Ripristina salute.' },
  battery: { id: 'battery', name: 'Batterie', icon: 'battery', type: 'battery', chargeAmount: 60,
    stackable: true, maxStack: 6, usable: true,
    description: 'Batterie per la torcia. Ricaricano il 60%.' },

  // ── Chiavi e oggetti di trama ──
  key_station: { id: 'key_station', name: 'Chiave sala controllo', icon: 'key_station', type: 'key',
    description: 'Chiave in ottone con targhetta: "SALA CONTROLLO — P.S. Centrale".' },
  fuse: { id: 'fuse', name: 'Fusibile 30A', icon: 'fuse', type: 'key',
    description: 'Un fusibile industriale ancora sigillato. Luigi lo teneva in cassaforte.' },
  key_hospital: { id: 'key_hospital', name: 'Chiave reparto', icon: 'key_hospital', type: 'key',
    description: 'Chiave con portachiavi blu. "San Rocco — Degenze 2° piano". Era di Giulia Conti.' },
  badge: { id: 'badge', name: 'Badge sala operatoria', icon: 'badge', type: 'key',
    description: 'Badge magnetico di un\'infermiera. Apre le porte chirurgiche.' },
  card: { id: 'card', name: 'Tessera laboratorio', icon: 'card', type: 'key',
    description: 'Tessera elettronica. Logo: una goccia rossa. "PROGETTO ROSSO — Livello 3".' },
  usb: { id: 'usb', name: 'Chiavetta USB', icon: 'usb', type: 'key',
    description: 'Etichetta scritta a mano: "R-0 / dati completi — E.F.".' },
  vial: { id: 'vial', name: 'Provetta R-0', icon: 'vial', type: 'key',
    description: 'Campione del ceppo originale, sigillato. Elena scriveva che è l\'unica base possibile per una cura.' },
  recorder: { id: 'recorder', name: 'Registratore', icon: 'recorder', type: 'tool', usable: true,
    description: 'Il registratore che Elena ha lasciato a Carmine. [USA] per riascoltare.' },
  city_map: { id: 'city_map', name: 'Mappa di Porto Salvo', icon: 'city_map', type: 'tool', usable: true,
    description: 'Una piantina della città. Qualcuno ha cerchiato in rosso l\'Ospedale San Rocco. [USA] per aprire la mappa.' },
  key_rusty: { id: 'key_rusty', name: 'Chiave della barca', icon: 'key_rusty', type: 'key',
    description: 'Vecchia chiave arrugginita. Il gozzo di papà, ormeggiato al molo 4.' },
};

// paper = foglio su cui appare (assets/ui/paper_<tipo>.png):
// typed (dattiloscritto) · notebook (quaderno a mano) · clinical (modulo clinico)
// letter (carta da lettera) · ticket (biglietto) · printout (stampa da computer)
export const DOCUMENTS = {
  doc_ticket: { id: 'doc_ticket', paper: 'ticket', title: 'Biglietto ferroviario', date: '14 ottobre',
    text:
`Treno 847 — Partenza 21:55
Destinazione: Porto Salvo Centrale

Valido solo per il giorno indicato.

—

Sul retro, a penna, con la calligrafia di Elena:
"Non dovevi venire."` },

  doc_ordinanza: { id: 'doc_ordinanza', paper: 'typed', title: 'Ordinanza n. 114', date: '14 ottobre, 22:47',
    text:
`COMUNE DI PORTO SALVO — ORDINANZA CONTINGIBILE E URGENTE

A seguito di emergenza sanitaria in corso,
l'intero territorio comunale è dichiarato
ZONA ROSSA.

È vietato qualsiasi spostamento.
I cittadini restino nelle abitazioni.
Le stazioni, il porto e le vie d'accesso sono chiusi.

Non avvicinatevi a persone che mostrano
disorientamento, febbre o comportamento aggressivo.

IL SINDACO` },

  doc_storage_note: { id: 'doc_storage_note', paper: 'notebook', title: 'Nota del deposito', date: '14 ottobre',
    text:
`PROMEMORIA — turno serale, Carmine

Pistola di servizio (Polfer): armadio B3.
Munizioni nella cassa sotto lo scaffale.
La chiave della sala controllo è nella cassetta rossa.

Se stai leggendo questo non sei Carmine.
Prendi tutto e vieni su in sala controllo.
Io sono lì. Chiudo da dentro.

NON FARE RUMORE.` },

  doc_turni: { id: 'doc_turni', paper: 'typed', title: 'Registro di movimento', date: '14 ottobre',
    text:
`22:31  Treno 847 — ritardo 12'.
22:40  Ordine RFI: sospendere tutta la circolazione.
22:47  Chiusura stazione. Serranda abbassata.
22:52  L'847 NON si ferma a Porto Salvo Vecchia.
       Il macchinista non risponde.
23:10  L'847 arriva comunque. Binario 1.
       Nessuno scende tranne un passeggero.

(a matita) — è lui. il fratello della dottoressa.` },

  doc_luigi: { id: 'doc_luigi', paper: 'letter', title: 'Biglietto di Luigi', date: '14 ottobre',
    text:
`Giulia,
ho chiuso il negozio. Mia moglie ha la febbre
alta e non mi riconosce più.

Le medicine per tua madre sono in cassaforte,
insieme al fusibile di ricambio per il generatore
del condominio. La combinazione la sai.

Se non torno, prendi quello che ti serve.
— Luigi` },

  doc_diario_giulia: { id: 'doc_diario_giulia', paper: 'notebook', title: 'Diario di Giulia Conti', date: '12-14 ottobre',
    text:
`12 ott — Al San Rocco ci hanno detto di non parlare
del reparto chiuso al piano -2. La dottoressa Ferri
piangeva in spogliatoio.

13 ott — Tre pazienti con la stessa febbre. Occhi rossi.
Mordevano le cinghie.

14 ott — Luigi mi ha lasciato la combinazione della
cassaforte per le medicine di mamma:
1 - 4 - 1 - 0. Come oggi.

Stanotte torno in ospedale. Lascio qui la chiave
del reparto, non voglio che la trovino addosso a me.` },

  doc_cartella: { id: 'doc_cartella', paper: 'clinical', title: 'Cartella clinica — Pz. 0', date: '9 ottobre',
    text:
`OSPEDALE SAN ROCCO — Reparto isolamento

Paziente: ignoto, maschio, ~40 anni.
Ricoverato da: Laboratorio (piano -2).
Esposizione accidentale a campione "R".

Febbre 41,2. Iperemia congiuntivale.
Aggressività crescente, insensibilità al dolore.

Ore 03:15: il paziente ha morso l'infermiere di turno.
Ore 04:00: l'infermiere presenta gli stessi sintomi.

Firma: Dott.ssa E. Ferri` },

  doc_ricerca_elena: { id: 'doc_ricerca_elena', paper: 'notebook', title: 'Appunti della Dott.ssa Ferri', date: '13 ottobre',
    text:
`PROGETTO ROSSO — appunti personali (NON per la direzione)

Il ceppo R nasce per rigenerare i tessuti.
Funziona. Troppo bene: riscrive il sistema nervoso.

Il campione originale R-0 non è mutato.
È l'unica base possibile per un anticorpo.

La direzione vuole distruggere tutto e sigillare
la città. Io voglio far uscire i dati.
Se i dati escono, qualcuno fuori potrà fare la cura.

Luca, se mai leggerai questo: non venire.` },

  doc_formula: { id: 'doc_formula', paper: 'clinical', title: 'Protocollo campioni', date: '14 ottobre',
    text:
`CAMPIONE R-0 — conservare a 4°C
Frigo chirurgico, ripiano 2.

In caso di evacuazione, il campione va portato
fuori dalla zona rossa insieme ai dati di sequenza.
Senza entrambi, nessuna sintesi è possibile.

— E.F.` },

  doc_autopsia: { id: 'doc_autopsia', paper: 'clinical', title: 'Referto autoptico', date: '14 ottobre',
    text:
`Soggetto: infermiere, 34 anni.

Il cuore ha smesso di battere alle 05:12.
Il soggetto si è alzato dal tavolo alle 05:40.

Tessuto cerebrale: attività nei soli centri
motori e uditivi. Ipersensibilità al suono.
Alcuni soggetti "ascoltano" invece di guardare.

Consiglio a chi legge: muoviti piano.` },

  doc_avviso_metro: { id: 'doc_avviso_metro', paper: 'typed', title: 'Avviso ai viaggiatori', date: '14 ottobre',
    text:
`METRO PORTO SALVO — AVVISO

Il servizio è sospeso su tutte le linee.
La corrente è stata tolta alle 23:00 per ordine
della Protezione Civile.

Il generatore di emergenza della Linea 3 si trova
oltre il tunnel, nella sala tecnica.

(scritto sopra con il pennarello)
IL LABORATORIO È SOTTO DI NOI` },

  doc_registro_metro: { id: 'doc_registro_metro', paper: 'notebook', title: 'Registro del capotreno', date: '14 ottobre',
    text:
`23:05 — Fermati in banchina B. Niente corrente.
23:20 — Passeggeri agitati. Una signora con la febbre.
23:40 — Abbiamo chiuso la signora nell'ultima carrozza.
23:55 — Non c'è più nessuno nell'ultima carrozza.
00:10 — Vado a piedi nel tunnel verso la sala tecnica.
        Se non torno, non seguitemi.` },

  doc_taccuino: { id: 'doc_taccuino', paper: 'notebook', title: 'Taccuino di un soldato', date: '15 ottobre, 00:40',
    text:
`Ordini: sigillare gli accessi al laboratorio.
All'alba "bonifica" dall'alto.

Nessuno ci ha detto cosa c'è là sotto.
Nessuno ci ha detto che si rialzano.

Marchi è rimasto indietro. L'ho sentito
chiamarmi per mezz'ora. Poi ha smesso.` },

  doc_manuale: { id: 'doc_manuale', paper: 'printout', title: 'Manuale del generatore', date: '—',
    text:
`GENERATORE DI EMERGENZA — LINEA 3

1. Verificare il fusibile principale (30A).
   Se bruciato, sostituirlo.
2. Abbassare la leva di avvio.
3. Attendere la stabilizzazione (circa 10 secondi).

ATTENZIONE: l'avvio è molto rumoroso.` },

  doc_officina: { id: 'doc_officina', paper: 'letter', title: 'Nota in officina', date: '14 ottobre',
    text:
`Dottoressa Ferri,
come mi ha chiesto ho lasciato la sua tessera
nell'armadietto 7. La stanza blindata qui accanto
è pronta: acqua, viveri, radio.

Il laboratorio si apre solo con la corrente
del generatore. Non torni giù da sola.
— Sandro, manutenzione` },

  doc_accessi: { id: 'doc_accessi', paper: 'printout', title: 'Registro accessi', date: '15 ottobre',
    text:
`LABORATORIO — ACCESSI LIVELLO 3

14/10  21:02  Dir. Amati         USCITA
14/10  21:40  Sicurezza          USCITA
14/10  22:15  Dott.ssa E. Ferri  USCITA
15/10  01:58  Dott.ssa E. Ferri  INGRESSO
15/10  02:03  Dott.ssa E. Ferri  CAMERA CENTRALE

Nessuna uscita successiva.` },

  doc_classificato: { id: 'doc_classificato', paper: 'printout', title: 'Direttiva riservata', date: '14 ottobre',
    text:
`CLASSIFICATO — PROGETTO ROSSO

In caso di perdita di contenimento:
- interrompere ogni comunicazione verso l'esterno;
- distruggere il campione R-0;
- cancellare gli archivi di sequenza;
- procedura ALBA: sterilizzazione della zona rossa.

Nessun dato deve lasciare Porto Salvo.
— Dir. Amati` },

  doc_lettera_elena: { id: 'doc_lettera_elena', paper: 'letter', title: 'Lettera di Elena', date: '15 ottobre',
    text:
`Luca,

papà diceva che il mare di notte è rosso
se guardi le luci del porto. Aveva ragione.

La barca è al molo 4. Il serbatoio è pieno,
l'ho riempito io due giorni fa, quando ho capito.

Porta fuori quello che hai trovato.
Io resto a spegnere la luce.

Ti voglio bene.
— E.` },
};
