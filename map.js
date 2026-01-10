/*************************************************
 * MAPPA BASE
 *************************************************/
const map = L.map("map").setView([41.9028, 12.4964], 12); // fallback Roma

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

/*************************************************
 * TEST DEBUG H3
 *************************************************/
console.log('H3 disponibile?', typeof h3 !== 'undefined');
if (typeof h3 !== 'undefined') {
  console.log('Versione H3:', h3.h3GetResolution ? 'v3' : 'v4');
  console.log('Oggetto H3:', h3);
}

/*************************************************
 * VARIABILI GLOBALI
 *************************************************/
let raggio = 3000;                // metri
let puntoRicerca = null;          // { lat, lon }
let modalitaSceltaMappa = false;
let categoriaSelezionata = "toilets";

let markerPreview = null;         // punto selezionato
let circlePreview = null;         // cerchio raggio
let layerRisultati = null;        // marker risultati

/*************************************************
 * CONFIGURAZIONE CATEGORIE
 *************************************************/
const categorie = {
  toilets: {
    nome: "Bagni pubblici",
    emoji: "🚻",
    tag: 'amenity="toilets"',
    popup: (tags) => {
      let info = "<strong>🚻 Bagno pubblico</strong><br>";
      if (tags.name) info += `${tags.name}<br>`;
      if (tags.wheelchair === "yes") info += "♿ Accessibile<br>";
      if (tags.fee === "yes") info += "💰 A pagamento<br>";
      if (tags.fee === "no") info += "✅ Gratis<br>";
      return info;
    }
  },
  cinema: {
    nome: "Cinema",
    emoji: "🎬",
    tag: 'amenity="cinema"',
    popup: (tags) => {
      let info = `<strong>🎬 ${tags.name || 'Cinema'}</strong><br>`;
      if (tags["addr:street"]) info += `📍 ${tags["addr:street"]}<br>`;
      if (tags.phone) info += `📞 ${tags.phone}<br>`;
      if (tags.website) info += `🌐 <a href="${tags.website}" target="_blank">Sito web</a><br>`;
      return info;
    }
  },
  restaurant: {
    nome: "Ristoranti",
    emoji: "🍽️",
    tag: 'amenity="restaurant"',
    popup: (tags) => {
      let info = `<strong>🍽️ ${tags.name || 'Ristorante'}</strong><br>`;
      if (tags.cuisine) info += `🍴 Cucina: ${tags.cuisine}<br>`;
      if (tags["addr:street"]) info += `📍 ${tags["addr:street"]}<br>`;
      if (tags.phone) info += `📞 ${tags.phone}<br>`;
      if (tags.website) info += `🌐 <a href="${tags.website}" target="_blank">Sito web</a><br>`;
      return info;
    }
  },
  pharmacy: {
    nome: "Farmacie",
    emoji: "💊",
    tag: 'amenity="pharmacy"',
    popup: (tags) => {
      let info = `<strong>💊 ${tags.name || 'Farmacia'}</strong><br>`;
      if (tags["addr:street"]) info += `📍 ${tags["addr:street"]}<br>`;
      if (tags.opening_hours) info += `🕐 ${tags.opening_hours}<br>`;
      if (tags.phone) info += `📞 ${tags.phone}<br>`;
      return info;
    }
  },
  hospital: {
    nome: "Ospedali",
    emoji: "🏥",
    tag: 'amenity="hospital"',
    popup: (tags) => {
      let info = `<strong>🏥 ${tags.name || 'Ospedale'}</strong><br>`;
      if (tags["addr:street"]) info += `📍 ${tags["addr:street"]}<br>`;
      if (tags.phone) info += `📞 ${tags.phone}<br>`;
      if (tags.emergency === "yes") info += `🚨 Pronto soccorso<br>`;
      return info;
    }
  },
  fuel: {
    nome: "Distributori",
    emoji: "⛽",
    tag: 'amenity="fuel"',
    popup: (tags) => {
      let info = `<strong>⛽ ${tags.name || tags.brand || 'Distributore'}</strong><br>`;
      if (tags["addr:street"]) info += `📍 ${tags["addr:street"]}<br>`;
      if (tags.opening_hours) info += `🕐 ${tags.opening_hours}<br>`;
      return info;
    }
  },
  atm: {
    nome: "Bancomat",
    emoji: "🏧",
    tag: 'amenity="atm"',
    popup: (tags) => {
      let info = "<strong>🏧 Bancomat</strong><br>";
      if (tags.operator) info += `🏦 ${tags.operator}<br>`;
      if (tags["addr:street"]) info += `📍 ${tags["addr:street"]}<br>`;
      return info;
    }
  },
  parking: {
    nome: "Parcheggi",
    emoji: "🅿️",
    tag: 'amenity="parking"',
    popup: (tags) => {
      let info = `<strong>🅿️ ${tags.name || 'Parcheggio'}</strong><br>`;
      if (tags.fee === "yes") info += "💰 A pagamento<br>";
      if (tags.fee === "no") info += "✅ Gratis<br>";
      if (tags.capacity) info += `📊 Posti: ${tags.capacity}<br>`;
      return info;
    }
  },
  cafe: {
    nome: "Bar/Caffè",
    emoji: "☕",
    tag: 'amenity="cafe"',
    popup: (tags) => {
      let info = `<strong>☕ ${tags.name || 'Bar'}</strong><br>`;
      if (tags["addr:street"]) info += `📍 ${tags["addr:street"]}<br>`;
      if (tags.phone) info += `📞 ${tags.phone}<br>`;
      if (tags.outdoor_seating === "yes") info += `🪑 Posti esterni<br>`;
      return info;
    }
  },
  supermarket: {
    nome: "Supermercati",
    emoji: "🛒",
    tag: 'shop="supermarket"',
    popup: (tags) => {
      let info = `<strong>🛒 ${tags.name || 'Supermercato'}</strong><br>`;
      if (tags["addr:street"]) info += `📍 ${tags["addr:street"]}<br>`;
      if (tags.opening_hours) info += `🕐 ${tags.opening_hours}<br>`;
      if (tags.phone) info += `📞 ${tags.phone}<br>`;
      return info;
    }
  }
};

/*************************************************
 * FUNZIONI CURSORE
 *************************************************/
function abilitaCursoreSelezione() {
  map.getContainer().classList.add("map-select-mode");
}

function disabilitaCursoreSelezione() {
  map.getContainer().classList.remove("map-select-mode");
}

/*************************************************
 * GESTIONE CATEGORIA
 *************************************************/
const categorySelect = document.getElementById("category");
if (categorySelect) {
  categoriaSelezionata = categorySelect.value;

  categorySelect.addEventListener("change", e => {
    categoriaSelezionata = e.target.value;
    
    const cat = categorie[categoriaSelezionata];
    
    // Aggiorna titolo pagina
    const pageTitle = document.getElementById("page-title");
    if (pageTitle) {
      pageTitle.textContent = `${cat.emoji} ${cat.nome}`;
    }
    
    document.getElementById("status").innerText =
      `Categoria: ${cat.nome} – seleziona posizione e avvia ricerca`;
  });
}

/*************************************************
 * RAGGIO (TENDINA)
 *************************************************/
const radiusSelect = document.getElementById("radius");
if (radiusSelect) {
  raggio = Number(radiusSelect.value);

  radiusSelect.addEventListener("change", e => {
    raggio = Number(e.target.value);

    if (puntoRicerca) {
      mostraAnteprima(puntoRicerca.lat, puntoRicerca.lon);
    }

    document.getElementById("status").innerText =
      `Raggio impostato a ${raggio / 1000} km – premi Avvia ricerca`;
  });
}

/*************************************************
 * ANTEPRIMA: PUNTO + ESAGONI H3
 *************************************************/
function mostraAnteprima(lat, lon) {
  console.log('=== MOSTRA ANTEPRIMA ===');
  console.log('Lat:', lat, 'Lon:', lon, 'Raggio:', raggio);
  
  // rimuove anteprima precedente
  if (markerPreview) map.removeLayer(markerPreview);
  if (circlePreview) map.removeLayer(circlePreview);

  // marker punto
  markerPreview = L.circleMarker([lat, lon], {
    radius: 8,
    color: "orange",
    fillColor: "orange",
    fillOpacity: 0.9
  })
    .addTo(map)
    .bindPopup("📍 Punto selezionato")
    .openPopup();

  // Determina risoluzione H3 in base al raggio
  let resolution;
  if (raggio <= 1000) {
    resolution = 9;
  } else if (raggio <= 3000) {
    resolution = 8;
  } else {
    resolution = 7;
  }
  
  console.log('Risoluzione H3:', resolution);
  
  try {
    // Ottieni cella H3 centrale
    const h3Index = h3.latLngToCell(lat, lon, resolution);
    console.log('H3 Index:', h3Index);
    
    // Calcola quanti anelli servono
    const avgEdgeLength = h3.getHexagonEdgeLengthAvg(resolution, h3.UNITS.m);
    const k = Math.ceil(raggio / avgEdgeLength);
    console.log('Edge length:', avgEdgeLength, 'K-ring:', k);
    
    // Ottieni celle nel raggio
    const hexagons = h3.gridDisk(h3Index, k);
    console.log('Numero esagoni:', hexagons.length);

    // Disegna esagoni
    circlePreview = L.layerGroup();
    
    hexagons.forEach((hex, index) => {
      const boundary = h3.cellToBoundary(hex);
      const leafletBoundary = boundary.map(coord => [coord[0], coord[1]]);
      
      const polygon = L.polygon(leafletBoundary, {
        color: "orange",
        fillColor: "orange",
        fillOpacity: 0.15,
        weight: 2
      });
      
      polygon.addTo(circlePreview);
    });
    
    console.log('Esagoni disegnati:', hexagons.length);
    circlePreview.addTo(map);
    console.log('Layer aggiunto alla mappa');
    
  } catch (error) {
    console.error('Errore H3:', error);
    console.error('Stack:', error.stack);
  }

  map.setView([lat, lon], 15);
}

/*************************************************
 * ESECUZIONE RICERCA (OVERPASS)
 *************************************************/
function avviaRicerca() {
  if (!puntoRicerca) {
    document.getElementById("status").innerText =
      "⚠️ Seleziona una posizione o usa il GPS";
    return;
  }

  // pulisce risultati precedenti
  if (layerRisultati) map.removeLayer(layerRisultati);

  const cat = categorie[categoriaSelezionata];

  document.getElementById("status").innerText =
    `🔄 Ricerca ${cat.nome} (${raggio / 1000} km)…`;

  const { lat, lon } = puntoRicerca;

  const query = `
[out:json][timeout:25];
(
  node[${cat.tag}](around:${raggio},${lat},${lon});
  way[${cat.tag}](around:${raggio},${lat},${lon});
);
out body;
`;

  const endpoints = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter"
  ];

  // funzione fetch generica
  function fetchOverpass(url) {
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "data=" + encodeURIComponent(query)
    });
  }

  fetchOverpass(endpoints[0])
    .then(r => {
      if (!r.ok) throw new Error();
      return r.json();
    })
    .then(data => mostraRisultati(data))
    .catch(() => {
      // fallback
      fetchOverpass(endpoints[1])
        .then(r => r.json())
        .then(data => mostraRisultati(data))
        .catch(() => {
          document.getElementById("status").innerText =
            "❌ Servizio temporaneamente non disponibile";
        });
    });
}

/*************************************************
 * MOSTRA RISULTATI CON CLUSTERING H3
 *************************************************/
function mostraRisultati(data) {
  console.log('=== MOSTRA RISULTATI ===');
  console.log('Elementi ricevuti:', data.elements.length);
  
  // Rimuovi TUTTO: anteprima + risultati precedenti
  if (markerPreview) map.removeLayer(markerPreview);
  if (circlePreview) map.removeLayer(circlePreview);
  if (layerRisultati) map.removeLayer(layerRisultati);
  
  layerRisultati = L.layerGroup();
  
  const cat = categorie[categoriaSelezionata];

  if (data.elements.length === 0) {
    document.getElementById("status").innerText =
      `${cat.emoji} Nessun risultato trovato`;
    return;
  }

  // Determina risoluzione H3
  let resolution;
  if (raggio <= 1000) {
    resolution = 9;
  } else if (raggio <= 3000) {
    resolution = 8;
  } else {
    resolution = 7;
  }
  console.log('Risoluzione H3 per risultati:', resolution);

  // Mantieni il marker del punto selezionato
  if (puntoRicerca) {
    markerPreview = L.circleMarker([puntoRicerca.lat, puntoRicerca.lon], {
      radius: 8,
      color: "red",
      fillColor: "red",
      fillOpacity: 0.9
    })
      .addTo(map)
      .bindPopup("📍 Punto di ricerca");
  }

  // Raggruppa risultati per cella H3
  const cellGroups = {};

  data.elements.forEach(el => {
    if (!el.lat || !el.lon) return;

    const h3Index = h3.latLngToCell(el.lat, el.lon, resolution);
    
    if (!cellGroups[h3Index]) {
      cellGroups[h3Index] = [];
    }
    cellGroups[h3Index].push(el);
  });

  console.log('Celle H3 con risultati:', Object.keys(cellGroups).length);

  // Visualizza celle con risultati
  let esagoniDisegnati = 0;
  Object.entries(cellGroups).forEach(([hexId, elements]) => {
    const count = elements.length;
    
    // Disegna esagono colorato
    const boundary = h3.cellToBoundary(hexId);
    const leafletBoundary = boundary.map(coord => [coord[0], coord[1]]);
    
    // Colore in base al numero di risultati
    let color, fillOpacity;
    if (count === 1) {
      color = "#4CAF50";  // verde
      fillOpacity = 0.4;
    } else if (count <= 3) {
      color = "#FF9800";  // arancione
      fillOpacity = 0.5;
    } else {
      color = "#F44336";  // rosso
      fillOpacity = 0.6;
    }
    
    const hexPolygon = L.polygon(leafletBoundary, {
      color: color,
      fillColor: color,
      fillOpacity: fillOpacity,
      weight: 3
    });

    // Popup con dettagli
    let popup = `<div style="max-height: 300px; overflow-y: auto;">`;
    popup += `<strong>${cat.emoji} ${count} ${cat.nome} in questa zona</strong><br><hr>`;
    
    elements.forEach((el, idx) => {
      popup += cat.popup(el.tags || {});
      if (idx < elements.length - 1) popup += "<hr>";
    });
    popup += `</div>`;

    hexPolygon.bindPopup(popup);
    hexPolygon.addTo(layerRisultati);
    esagoniDisegnati++;

    // Aggiungi marker individuali
    elements.forEach(el => {
      const icon = L.divIcon({
        html: cat.emoji,
        className: 'custom-icon',
        iconSize: [30, 30]
      });

      L.marker([el.lat, el.lon], { icon })
        .bindPopup(cat.popup(el.tags || {}))
        .addTo(layerRisultati);
    });
  });

  console.log('Esagoni disegnati totali:', esagoniDisegnati);
  
  layerRisultati.addTo(map);
  console.log('Layer risultati aggiunto alla mappa');

  document.getElementById("status").innerText =
    `${cat.emoji} Trovati ${data.elements.length} risultati in ${Object.keys(cellGroups).length} zone`;
}

/*************************************************
 * PULSANTE GPS
 *************************************************/
document.getElementById("btn-gps").addEventListener("click", () => {
  modalitaSceltaMappa = false;

  document.getElementById("status").innerText =
    "📡 Richiesta posizione GPS…";

  if (!("geolocation" in navigator)) {
    document.getElementById("status").innerText =
      "❌ Geolocalizzazione non supportata";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      puntoRicerca = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude
      };

      mostraAnteprima(puntoRicerca.lat, puntoRicerca.lon);

      document.getElementById("status").innerText =
        "📍 Posizione acquisita – premi Avvia ricerca";
    },
    () => {
      document.getElementById("status").innerText =
        "❌ Posizione non concessa";
    },
    {
      enableHighAccuracy: true,
      timeout: 10000
    }
  );
});

/*************************************************
 * PULSANTE SCELTA MAPPA
 *************************************************/
document.getElementById("btn-map").addEventListener("click", () => {
  modalitaSceltaMappa = true;
  abilitaCursoreSelezione();

  document.getElementById("status").innerText =
    "🗺️ Tocca un punto sulla mappa";
});

/*************************************************
 * CLICK SULLA MAPPA
 *************************************************/
map.on("click", e => {
  if (!modalitaSceltaMappa) return;

  modalitaSceltaMappa = false;
  disabilitaCursoreSelezione();
  
  puntoRicerca = {
    lat: e.latlng.lat,
    lon: e.latlng.lng
  };

  mostraAnteprima(puntoRicerca.lat, puntoRicerca.lon);

  document.getElementById("status").innerText =
    "📍 Punto selezionato – premi Avvia ricerca";
});

/*************************************************
 * PULSANTE AVVIA RICERCA
 *************************************************/
document.getElementById("btn-search").addEventListener("click", () => {
  avviaRicerca();
});