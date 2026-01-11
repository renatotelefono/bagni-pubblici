/*************************************************
 * MAPPA BASE
 *************************************************/
const map = L.map("map").setView([41.9028, 12.4964], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

/*************************************************
 * VARIABILI GLOBALI
 *************************************************/
let raggio = 3000;
let puntoRicerca = null;
let modalitaSceltaMappa = false;
let religioneSelezionata = "christian_catholic";

let markerPreview = null;
let circlePreview = null;
let layerRisultati = null;

/*************************************************
 * CONFIGURAZIONE RELIGIONI
 *************************************************/
const religioni = {
  christian_catholic: {
    nome: "Chiese Cattoliche",
    emoji: "⛪",
    query: 'amenity="place_of_worship"][religion="christian"][denomination="catholic"]',
    popup: (tags) => {
      let info = `<strong>⛪ ${tags.name || 'Chiesa Cattolica'}</strong><br>`;
      if (tags["addr:street"]) info += `📍 ${tags["addr:street"]}<br>`;
      if (tags.denomination) info += `Denominazione: ${tags.denomination}<br>`;
      if (tags.service_times) info += `⏰ ${tags.service_times}<br>`;
      if (tags.website) info += `🌐 <a href="${tags.website}" target="_blank">Sito web</a><br>`;
      return info;
    }
  },
  christian_orthodox: {
    nome: "Chiese Ortodosse",
    emoji: "☦️",
    query: 'amenity="place_of_worship"][religion="christian"][denomination="orthodox"]',
    popup: (tags) => {
      let info = `<strong>☦️ ${tags.name || 'Chiesa Ortodossa'}</strong><br>`;
      if (tags["addr:street"]) info += `📍 ${tags["addr:street"]}<br>`;
      if (tags.denomination) info += `Denominazione: ${tags.denomination}<br>`;
      if (tags.service_times) info += `⏰ ${tags.service_times}<br>`;
      if (tags.website) info += `🌐 <a href="${tags.website}" target="_blank">Sito web</a><br>`;
      return info;
    }
  },
  christian_protestant: {
    nome: "Chiese Protestanti",
    emoji: "✝️",
    query: 'amenity="place_of_worship"][religion="christian"][denomination~"protestant|lutheran|evangelical|baptist|methodist|pentecostal"]',
    popup: (tags) => {
      let info = `<strong>✝️ ${tags.name || 'Chiesa Protestante'}</strong><br>`;
      if (tags["addr:street"]) info += `📍 ${tags["addr:street"]}<br>`;
      if (tags.denomination) info += `Denominazione: ${tags.denomination}<br>`;
      if (tags.service_times) info += `⏰ ${tags.service_times}<br>`;
      if (tags.website) info += `🌐 <a href="${tags.website}" target="_blank">Sito web</a><br>`;
      return info;
    }
  },
  christian: {
    nome: "Chiese Cristiane",
    emoji: "✝️",
    query: 'amenity="place_of_worship"][religion="christian"]',
    popup: (tags) => {
      let info = `<strong>✝️ ${tags.name || 'Chiesa Cristiana'}</strong><br>`;
      if (tags["addr:street"]) info += `📍 ${tags["addr:street"]}<br>`;
      if (tags.denomination) info += `Denominazione: ${tags.denomination}<br>`;
      if (tags.service_times) info += `⏰ ${tags.service_times}<br>`;
      if (tags.website) info += `🌐 <a href="${tags.website}" target="_blank">Sito web</a><br>`;
      return info;
    }
  },
  muslim: {
    nome: "Moschee",
    emoji: "🕌",
    query: 'amenity="place_of_worship"][religion="muslim"]',
    popup: (tags) => {
      let info = `<strong>🕌 ${tags.name || 'Moschea'}</strong><br>`;
      if (tags["addr:street"]) info += `📍 ${tags["addr:street"]}<br>`;
      if (tags.service_times) info += `⏰ ${tags.service_times}<br>`;
      if (tags.website) info += `🌐 <a href="${tags.website}" target="_blank">Sito web</a><br>`;
      return info;
    }
  },
  jewish: {
    nome: "Sinagoghe",
    emoji: "🕍",
    query: 'amenity="place_of_worship"][religion="jewish"]',
    popup: (tags) => {
      let info = `<strong>🕍 ${tags.name || 'Sinagoga'}</strong><br>`;
      if (tags["addr:street"]) info += `📍 ${tags["addr:street"]}<br>`;
      if (tags.service_times) info += `⏰ ${tags.service_times}<br>`;
      if (tags.website) info += `🌐 <a href="${tags.website}" target="_blank">Sito web</a><br>`;
      return info;
    }
  },
  buddhist: {
    nome: "Templi Buddhisti",
    emoji: "🛕",
    query: 'amenity="place_of_worship"][religion="buddhist"]',
    popup: (tags) => {
      let info = `<strong>🛕 ${tags.name || 'Tempio Buddhista'}</strong><br>`;
      if (tags["addr:street"]) info += `📍 ${tags["addr:street"]}<br>`;
      if (tags.service_times) info += `⏰ ${tags.service_times}<br>`;
      if (tags.website) info += `🌐 <a href="${tags.website}" target="_blank">Sito web</a><br>`;
      return info;
    }
  },
  hindu: {
    nome: "Templi Hindu",
    emoji: "🕉️",
    query: 'amenity="place_of_worship"][religion="hindu"]',
    popup: (tags) => {
      let info = `<strong>🕉️ ${tags.name || 'Tempio Hindu'}</strong><br>`;
      if (tags["addr:street"]) info += `📍 ${tags["addr:street"]}<br>`;
      if (tags.service_times) info += `⏰ ${tags.service_times}<br>`;
      if (tags.website) info += `🌐 <a href="${tags.website}" target="_blank">Sito web</a><br>`;
      return info;
    }
  },
  all: {
    nome: "Tutti i luoghi di culto",
    emoji: "🙏",
    query: 'amenity="place_of_worship"]',
    popup: (tags) => {
      let emoji = "🙏";
      if (tags.religion === "christian") emoji = "✝️";
      else if (tags.religion === "muslim") emoji = "🕌";
      else if (tags.religion === "jewish") emoji = "🕍";
      else if (tags.religion === "buddhist") emoji = "🛕";
      else if (tags.religion === "hindu") emoji = "🕉️";
      
      let info = `<strong>${emoji} ${tags.name || 'Luogo di culto'}</strong><br>`;
      if (tags.religion) info += `Religione: ${tags.religion}<br>`;
      if (tags.denomination) info += `Denominazione: ${tags.denomination}<br>`;
      if (tags["addr:street"]) info += `📍 ${tags["addr:street"]}<br>`;
      if (tags.service_times) info += `⏰ ${tags.service_times}<br>`;
      if (tags.website) info += `🌐 <a href="${tags.website}" target="_blank">Sito web</a><br>`;
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
 * GESTIONE RELIGIONE
 *************************************************/
const religionSelect = document.getElementById("religion");
if (religionSelect) {
  religioneSelezionata = religionSelect.value;

  religionSelect.addEventListener("change", e => {
    religioneSelezionata = e.target.value;
    
    const rel = religioni[religioneSelezionata];
    
    const pageTitle = document.getElementById("page-title");
    if (pageTitle) {
      pageTitle.textContent = `${rel.emoji} ${rel.nome}`;
    }
    
    document.getElementById("status").innerText =
      `${rel.nome} — seleziona posizione e avvia ricerca`;
  });
}

/*************************************************
 * RAGGIO
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
 * ANTEPRIMA - SEMPLICE CERCHIO
 *************************************************/
function mostraAnteprima(lat, lon) {
  if (markerPreview) map.removeLayer(markerPreview);
  if (circlePreview) map.removeLayer(circlePreview);

  // Marker punto centrale
  markerPreview = L.circleMarker([lat, lon], {
    radius: 8,
    color: "red",
    fillColor: "red",
    fillOpacity: 0.9
  })
    .addTo(map)
    .bindPopup("📍 Punto selezionato")
    .openPopup();

  // Cerchio raggio
  circlePreview = L.circle([lat, lon], {
    radius: raggio,
    color: "orange",
    fillColor: "orange",
    fillOpacity: 0.1,
    weight: 2
  }).addTo(map);

  map.setView([lat, lon], 13);
}

/*************************************************
 * RICERCA OVERPASS
 *************************************************/
function avviaRicerca() {
  if (!puntoRicerca) {
    document.getElementById("status").innerText =
      "⚠️ Seleziona una posizione o usa il GPS";
    return;
  }

  if (layerRisultati) map.removeLayer(layerRisultati);

  const rel = religioni[religioneSelezionata];

  document.getElementById("status").innerText =
    `🔄 Ricerca ${rel.nome} (${raggio / 1000} km)…`;

  const { lat, lon } = puntoRicerca;

  // Query ottimizzata per evitare duplicati
  const query = `
[out:json][timeout:25];
(
  way[${rel.query}(around:${raggio},${lat},${lon});
  relation[${rel.query}(around:${raggio},${lat},${lon});
);
out center;
`;

  const endpoints = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter"
  ];

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
 * MOSTRA RISULTATI - SOLO MARKER
 *************************************************/
function mostraRisultati(data) {
  if (markerPreview) map.removeLayer(markerPreview);
  if (circlePreview) map.removeLayer(circlePreview);
  if (layerRisultati) map.removeLayer(layerRisultati);
  
  layerRisultati = L.layerGroup();
  
  const rel = religioni[religioneSelezionata];

  if (data.elements.length === 0) {
    document.getElementById("status").innerText =
      `${rel.emoji} Nessun risultato trovato`;
    return;
  }

  // Mantieni il marker del punto di ricerca
  if (puntoRicerca) {
    markerPreview = L.circleMarker([puntoRicerca.lat, puntoRicerca.lon], {
      radius: 8,
      color: "red",
      fillColor: "red",
      fillOpacity: 0.9
    })
      .addTo(map)
      .bindPopup("📍 Punto di ricerca");

    // Cerchio raggio
    circlePreview = L.circle([puntoRicerca.lat, puntoRicerca.lon], {
      radius: raggio,
      color: "orange",
      fillColor: "orange",
      fillOpacity: 0.1,
      weight: 2
    }).addTo(map);
  }

  let risultatiMostrati = 0;

  // CircleMarker stile Overpass Turbo
  data.elements.forEach(el => {
    if (!el.center || !el.center.lat || !el.center.lon) return;
    
    risultatiMostrati++;

    // Cerchio blu con bordo bianco come Overpass
    L.circleMarker([el.center.lat, el.center.lon], {
      radius: 8,
      color: "white",
      weight: 2,
      fillColor: "#7092ff",
      fillOpacity: 1
    })
      .bindPopup(rel.popup(el.tags || {}))
      .addTo(layerRisultati);
  });
  
  layerRisultati.addTo(map);

  document.getElementById("status").innerText =
    `${rel.emoji} Trovati ${risultatiMostrati} risultati`;
}

/*************************************************
 * PULSANTI
 *************************************************/
document.getElementById("btn-gps").addEventListener("click", () => {
  modalitaSceltaMappa = false;

  // Rimuove selezione attuale
  if (markerPreview) map.removeLayer(markerPreview);
  if (circlePreview) map.removeLayer(circlePreview);
  if (layerRisultati) map.removeLayer(layerRisultati);
  
  puntoRicerca = null;

  document.getElementById("status").innerText = "📡 Richiesta posizione GPS…";

  if (!("geolocation" in navigator)) {
    document.getElementById("status").innerText = "❌ Geolocalizzazione non supportata";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      puntoRicerca = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude
      };

      mostraAnteprima(puntoRicerca.lat, puntoRicerca.lon);

      document.getElementById("status").innerText = "📍 Posizione acquisita — premi Avvia ricerca";
    },
    () => {
      document.getElementById("status").innerText = "❌ Posizione non concessa";
    },
    {
      enableHighAccuracy: true,
      timeout: 10000
    }
  );
});

document.getElementById("btn-map").addEventListener("click", () => {
  modalitaSceltaMappa = true;
  abilitaCursoreSelezione();

  // Rimuove selezione attuale
  if (markerPreview) map.removeLayer(markerPreview);
  if (circlePreview) map.removeLayer(circlePreview);
  if (layerRisultati) map.removeLayer(layerRisultati);
  
  puntoRicerca = null;

  document.getElementById("status").innerText = "🗺️ Tocca un punto sulla mappa";
});

map.on("click", e => {
  if (!modalitaSceltaMappa) return;

  modalitaSceltaMappa = false;
  disabilitaCursoreSelezione();
  
  puntoRicerca = {
    lat: e.latlng.lat,
    lon: e.latlng.lng
  };

  mostraAnteprima(puntoRicerca.lat, puntoRicerca.lon);

  document.getElementById("status").innerText = "📍 Punto selezionato — premi Avvia ricerca";
});

document.getElementById("btn-search").addEventListener("click", () => {
  avviaRicerca();
});