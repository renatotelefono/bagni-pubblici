/*************************************************
 * MAPPA BASE
 *************************************************/
const map = L.map("map").setView([41.9028, 12.4964], 12); // fallback Roma

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

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
      `Categoria: ${cat.nome} — seleziona posizione e avvia ricerca`;
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
      `Raggio impostato a ${raggio / 1000} km — premi Avvia ricerca`;
  });
}

/*************************************************
 * ANTEPRIMA: PUNTO + CERCHIO
 *************************************************/
function mostraAnteprima(lat, lon) {
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

  // cerchio raggio
  circlePreview = L.circle([lat, lon], {
    radius: raggio,
    color: "orange",
    fillColor: "orange",
    fillOpacity: 0.15
  }).addTo(map);

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
 * MOSTRA RISULTATI
 *************************************************/
function mostraRisultati(data) {
  layerRisultati = L.layerGroup();
  
  const cat = categorie[categoriaSelezionata];

  data.elements.forEach(el => {
    if (!el.lat || !el.lon) return;

    const popup = cat.popup(el.tags || {});

    const icon = L.divIcon({
      html: cat.emoji,
      className: 'custom-icon',
      iconSize: [30, 30]
    });

    L.marker([el.lat, el.lon], { icon })
      .bindPopup(popup)
      .addTo(layerRisultati);
  });

  layerRisultati.addTo(map);

  document.getElementById("status").innerText =
    `${cat.emoji} ${cat.nome} trovati: ${data.elements.length}`;
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
        "📍 Posizione acquisita — premi Avvia ricerca";
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
    "📍 Punto selezionato — premi Avvia ricerca";
});

/*************************************************
 * PULSANTE AVVIA RICERCA
 *************************************************/
document.getElementById("btn-search").addEventListener("click", () => {
  avviaRicerca();
});