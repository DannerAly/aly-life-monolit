export interface EmojiCategory {
  name: string;
  emojis: string[];
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    name: 'Frecuentes',
    emojis: [
      '🎯', '💪', '📚', '💼', '🚀', '⭐', '🔥', '💡',
      '❤️', '✅', '💰', '📈', '🏠', '🎓', '⚡', '🌟',
    ],
  },
  {
    name: 'Caras',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
      '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗',
      '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭',
      '🤫', '🤔', '🫡', '🤐', '🤨', '😐', '😑', '😶',
      '😏', '😒', '🙄', '😬', '😮‍💨', '🤥', '😌', '😔',
      '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
      '🥴', '😵', '🤯', '🥱', '😤', '😡', '🤬', '😈',
      '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻',
      '👽', '🤖', '😺', '😸', '😹', '😻', '😼', '😽',
    ],
  },
  {
    name: 'Personas',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏',
      '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
      '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜',
      '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅',
      '🤳', '💃', '🕺', '👫', '👬', '👭', '🧑‍💻', '👨‍💻',
      '👩‍💻', '👨‍🔬', '👩‍🔬', '👨‍🎨', '👩‍🎨', '👨‍🍳', '👩‍🍳', '👷',
    ],
  },
  {
    name: 'Naturaleza',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
      '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
      '🐧', '🐦', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴',
      '🦋', '🐛', '🐝', '🐞', '🦀', '🐠', '🐬', '🐳',
      '🌸', '💐', '🌹', '🌻', '🌺', '🌷', '🌱', '🪴',
      '🌲', '🌳', '🍀', '🍁', '🍂', '🌿', '🌍', '🌎',
      '🌏', '🌈', '☀️', '🌤️', '⛅', '🌧️', '⛈️', '❄️',
    ],
  },
  {
    name: 'Comida',
    emojis: [
      '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐',
      '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🥦',
      '🥬', '🥒', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠',
      '🍞', '🥐', '🥖', '🧀', '🥚', '🍳', '🥞', '🧇',
      '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪',
      '🌮', '🌯', '🥗', '🍜', '🍝', '🍣', '🍱', '🥘',
      '☕', '🍵', '🧃', '🥤', '🍺', '🍷', '🥂', '🧁',
      '🍰', '🎂', '🍩', '🍪', '🍫', '🍬', '🍭', '🍿',
    ],
  },
  {
    name: 'Deportes',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
      '🥏', '🎱', '🏓', '🏸', '🏒', '🥊', '🥋', '🎿',
      '⛷️', '🏂', '🏋️', '🤸', '🤽', '🚴', '🏊', '🤺',
      '🧘', '🏃', '🚶', '🧗', '🏇', '🏌️', '🤾', '⛳',
      '🎯', '🎳', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️',
    ],
  },
  {
    name: 'Viajes',
    emojis: [
      '🚗', '🚕', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒',
      '🛻', '🚚', '🚛', '🚜', '🛵', '🏍️', '🚲', '🛴',
      '✈️', '🛩️', '🚀', '🛸', '🚁', '⛵', '🚢', '🛳️',
      '🏖️', '🏕️', '🏔️', '🗻', '🌋', '🏜️', '🗼', '🗽',
      '🏛️', '⛩️', '🕌', '🏰', '🏯', '🎪', '🎢', '🎡',
    ],
  },
  {
    name: 'Objetos',
    emojis: [
      '⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '💾',
      '📷', '📹', '🎥', '📺', '📻', '🎙️', '🎧', '🎤',
      '🔔', '📢', '📣', '🔊', '🔉', '🔈', '🔇', '💡',
      '🔦', '🕯️', '📕', '📗', '📘', '📙', '📓', '📔',
      '📒', '📝', '✏️', '🖊️', '🖋️', '📎', '📌', '📍',
      '✂️', '🗑️', '🔧', '🔨', '⛏️', '🔩', '⚙️', '🧰',
      '💊', '🩹', '🩺', '💉', '🔬', '🔭', '📡', '🛰️',
    ],
  },
  {
    name: 'Símbolos',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
      '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☯️',
      '✡️', '🔯', '♈', '♉', '♊', '♋', '♌', '♍',
      '✅', '❌', '❓', '❗', '‼️', '⁉️', '💯', '🔴',
      '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤',
      '🔶', '🔷', '🔸', '🔹', '▪️', '▫️', '◾', '◽',
      '⬛', '⬜', '🏴', '🏳️', '🏁', '🚩', '🎌', '🏳️‍🌈',
    ],
  },
  {
    name: 'Finanzas',
    emojis: [
      '💰', '💵', '💴', '💶', '💷', '💸', '💳', '🏧',
      '💹', '📈', '📉', '📊', '🏦', '🧾', '💎', '👛',
      '👜', '🛒', '🏪', '🏬', '🏢', '🏗️', '🏘️', '📦',
    ],
  },
];

// Flat list for backward compatibility
export const COMMON_EMOJIS = EMOJI_CATEGORIES[0].emojis;

// Search index: emoji → keywords (for search)
const EMOJI_SEARCH: Record<string, string> = {
  '😀': 'cara sonrisa feliz happy smile',
  '😍': 'amor love ojos corazones hearts',
  '😂': 'risa llorar laugh cry',
  '🤔': 'pensar think hmm',
  '😎': 'cool gafas sunglasses',
  '🥰': 'amor love cariño affection',
  '💪': 'fuerza strong musculo muscle',
  '👍': 'bien ok pulgar thumb up',
  '👎': 'mal down pulgar thumb',
  '👏': 'aplausos clap',
  '🙏': 'gracias thanks rezar pray',
  '🎯': 'meta objetivo target goal',
  '🔥': 'fuego fire hot racha streak',
  '⭐': 'estrella star favorito',
  '💡': 'idea bombilla lamp',
  '❤️': 'corazon heart amor love rojo red',
  '💰': 'dinero money plata bolsa',
  '💵': 'dolar dollar billete bill',
  '💳': 'tarjeta card credito credit',
  '📈': 'grafico chart subir up crecimiento growth',
  '📉': 'grafico chart bajar down',
  '📊': 'estadistica stats barras bars',
  '🏦': 'banco bank',
  '🧾': 'recibo receipt factura invoice',
  '💎': 'diamante diamond joya gem',
  '🏠': 'casa house home hogar',
  '🚗': 'auto car coche carro',
  '🚌': 'bus autobus transporte',
  '✈️': 'avion airplane vuelo flight viaje travel',
  '🍎': 'manzana apple fruta fruit',
  '🍔': 'hamburguesa burger comida food',
  '🍕': 'pizza comida food',
  '☕': 'cafe coffee',
  '🍺': 'cerveza beer',
  '🏋️': 'gym gimnasio pesas weights',
  '🧘': 'yoga meditacion meditation',
  '🏃': 'correr run jogging',
  '🚴': 'bicicleta bike cycling',
  '🏊': 'nadar swim natacion',
  '⚽': 'futbol football soccer',
  '🏀': 'basket basketball',
  '📚': 'libros books leer read estudio study',
  '📝': 'nota note escribir write',
  '💼': 'trabajo work maletin briefcase',
  '🎓': 'graduacion graduation estudio study',
  '🚀': 'cohete rocket lanzar launch startup',
  '🎨': 'arte art pintura paint',
  '🎵': 'musica music nota note',
  '🎸': 'guitarra guitar musica music',
  '📷': 'camara camera foto photo',
  '💻': 'computadora computer laptop',
  '📱': 'celular phone telefono mobile',
  '🔧': 'herramienta tool wrench',
  '⚙️': 'configuracion settings gear',
  '🌱': 'planta plant crecer grow',
  '🌍': 'mundo world tierra earth',
  '🐶': 'perro dog mascota pet',
  '🐱': 'gato cat mascota pet',
  '🎂': 'cumpleanos birthday pastel cake',
  '🎉': 'fiesta party celebracion celebration',
  '🎁': 'regalo gift present',
  '🏆': 'trofeo trophy premio award ganador winner',
  '🥇': 'medalla medal oro gold primero first',
  '💊': 'medicina medicine pastilla pill salud health',
  '🩺': 'doctor medico health salud',
  '🔬': 'ciencia science microscopio microscope',
  '🛒': 'compras shopping carrito cart supermercado',
  '🏪': 'tienda store shop',
  '📦': 'paquete package caja box envio shipping',
  '🧩': 'puzzle rompecabezas',
  '🌈': 'arcoiris rainbow',
  '💐': 'flores flowers bouquet ramo',
};

export function searchEmojis(query: string): string[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  const results: string[] = [];

  // Search in keyword index
  for (const [emoji, keywords] of Object.entries(EMOJI_SEARCH)) {
    if (keywords.includes(q)) {
      results.push(emoji);
    }
  }

  // Also search in all emojis by category name
  for (const cat of EMOJI_CATEGORIES) {
    if (cat.name.toLowerCase().includes(q)) {
      for (const e of cat.emojis) {
        if (!results.includes(e)) results.push(e);
      }
    }
  }

  return results.slice(0, 40);
}
