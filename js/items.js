/* =============================================
   NOTTE ROSSA — items.js
   Definizione oggetti e documenti
   ============================================= */

export const ITEMS = {
  flashlight: {
    id: 'flashlight', name: 'Torcia', icon: '🔦',
    description: 'Una torcia portatile. Illumina le zone buie.',
    type: 'tool', stackable: false, equippable: true, usable: false,
  },
  pistol: {
    id: 'pistol', name: 'Pistola', icon: '🔫',
    description: 'Una pistola calibro 9mm. 6 colpi nel caricatore.',
    type: 'weapon', weaponId: 'pistol', stackable: false, equippable: true, usable: false,
  },
  ammo_pistol_small: {
    id: 'ammo_pistol_small', name: 'Munizioni 9mm', icon: '🔹',
    description: 'Una scatola di munizioni per pistola. 12 colpi.',
    type: 'ammo', ammoType: 'pistol', ammoCount: 12,
    stackable: true, maxStack: 48, equippable: false, usable: true,
  },
  medikit_small: {
    id: 'medikit_small', name: 'Medikit', icon: '🩹',
    description: 'Kit di pronto soccorso. Ripristina 40 HP.',
    type: 'heal', healAmount: 40,
    stackable: true, maxStack: 5, equippable: false, usable: true,
  },
  key_control: {
    id: 'key_control', name: 'Chiave controllo', icon: '🔑',
    description: 'Una chiave metallica. Etichetta: "SALA CONTROLLO".',
    type: 'key', keyId: 'key_control', stackable: false, equippable: false, usable: false,
  },
  battery: {
    id: 'battery', name: 'Batteria', icon: '🔋',
    description: 'Batteria AA. Ricarica la torcia del 50%.',
    type: 'battery', chargeAmount: 50,
    stackable: true, maxStack: 4, equippable: false, usable: true,
  },
};

export const DOCUMENTS = {
  doc_ticket: {
    id:    'doc_ticket',
    title: 'Biglietto ferroviario',
    date:  '14 ottobre',
    text:
`Treno 847 — Partenza 21:55
Destinazione: Porto Salvo Centrale

Valido solo per il giorno indicato.

—

Sul retro, a penna:
"Non dovevi venire."`,
  },

  doc_storage_note: {
    id:    'doc_storage_note',
    title: 'Nota interna',
    date:  '12 ottobre',
    text:
`PROMEMORIA PERSONALE DEL DEPOSITO

Turno serale — responsabile Carmine

Pistola di servizio: riposta nell'armadio B3.
Munizioni nella cassa sotto lo scaffale.

Se stai leggendo questo non sei Carmine.
Prendi tutto e non fermarti.

Ripeto: NON FERMARTI.`,
  },
};
