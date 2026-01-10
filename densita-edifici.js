/*************************************************
 * MAPPA BASE
 *************************************************/
const map = L.map("map").setView([41.9028, 12.4964], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

console.log('H3 disponibile?', typeof h3 !== 'undefined');

/*************************************************
 * VARIABILI GLOBALI
 *************************************************/
let raggio = 5000;
let resolution = 8;
let puntoRicerca = null;
let modalitaSceltaMappa = false;

let markerPreview = null;
let circlePreview = null;
let layerRisultati = null;

/*************************************************
 * GESTIONE CONTROLLI
 *************************************************/
const resolutionSelect = document.getElementById("resolution");
if (resolutionSelect) {
  resolution = Number(resolutionSelect.value);
  
  resolutionSelect.addEventListener("change", e => {
    resolution = Number(e.target.value);
    if (puntoRicerca) {
      mostraAnteprima(puntoRicerca.lat, puntoRicerca.lon);
    }
  });
}

const radiusSelect = document.getElementById("radius");
if (radiusSelect) {
  raggio = Number(radiusSelect.value);

  radiusSelect.addEventListener("change", e => {
    raggio = Number(e.target.value);
    if (puntoRicerca) {
      mostraAnteprima(puntoRicerca.lat, puntoRicerca.lon);
    }
  });
}

/*************************************************
 * ANTEPRIMA
 *************************************************/
function mostraAnteprima(lat, lon) {
  if (markerPreview) map.removeLayer(markerPreview);
  if (circlePreview) map.removeLayer(circlePreview);

  markerPreview = L.circleMarker([lat, lon], {
    radius: 8,
    color: "blue",
    fillColor: "blue",
    fillOpacity: 0.9
  })
    .addTo(map)
    .bindPopup("📍 Centro analisi")
    .openPopup();

  // Cerchio di anteprima
  circlePreview = L.circle([lat, lon], {
    radius: raggio,
    color: "blue",
    fillColor: "blue",
    fillOpacity: 0.1,
    weight: 2
  }).addTo(map);

  map.setView([lat, lon], 13);
  
  document.getElementById("status").innerText =
    `📍 Area selezionata — premi Analizza area`;
}

/*************************************************
 * QUERY OVERPASS PER EDIFICI
 *************************************************/
function avviaAnalisi() {
  if (!puntoRicerca) {
    document.getElementById("status").innerText =
      "⚠️ Seleziona prima una posizione";
    return;
  }

  if (layerRisultati) map.removeLayer(layerRisultati);

  document.getElementById("status").innerText =
    `🔄 Analisi in corso (${raggio / 1000} km)…`;

  const { lat, lon } = puntoRicerca;

  // Query per tutti gli edifici nell'area
  const query = `
[out:json][timeout:60];
(
  way["building"](around:${raggio},${lat},${lon});
  relation["building"](around:${raggio},${lat},${lon});
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
    .then(data => analizzaDensita(data))
    .catch(() => {
      fetchOverpass(endpoints[1])
        .then(r => r.json())
        .then(data => analizzaDensita(data))
        .catch(() => {
          document.getElementById("status").innerText =
            "❌ Errore durante l'analisi";
        });
    });
}

/*************************************************
 * ANALISI DENSITÀ CON H3
 *************************************************/
function analizzaDensita(data) {
  console.log('Edifici ricevuti:', data.elements.length);

  if (markerPreview) map.removeLayer(markerPreview);
  if (circlePreview) map.removeLayer(circlePreview);
  
  layerRisultati = L.layerGroup();

  if (data.elements.length === 0) {
    document.getElementById("status").innerText =
      "📊 Nessun edificio trovato nell'area";
    return;
  }

  // Conta edifici per cella H3
  const cellCounts = {};
  
  data.elements.forEach(el => {
    let lat, lon;
    
    // Gestisci diversi formati di coordinate
    if (el.lat && el.lon) {
      lat = el.lat;
      lon = el.lon;
    } else if (el.center) {
      lat = el.center.lat;
      lon = el.center.lon;
    } else {
      return;
    }

    const h3Index = h3.latLngToCell(lat, lon, resolution);
    cellCounts[h3Index] = (cellCounts[h3Index] || 0) + 1;
  });

  console.log('Celle con edifici:', Object.keys(cellCounts).length);

  // Trova min e max per statistiche
  const counts = Object.values(cellCounts);
  const maxCount = Math.max(...counts);
  const minCount = Math.min(...counts);
  const avgCount = (counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(1);

  // Funzione per determinare colore in base alla densità
  function getColor(count) {
    if (count <= 5) return "#1a9641";      // verde scuro
    if (count <= 15) return "#a6d96a";     // verde chiaro
    if (count <= 30) return "#ffffbf";     // giallo
    if (count <= 50) return "#fdae61";     // arancione
    return "#d7191c";                       // rosso
  }

  // Disegna esagoni
  Object.entries(cellCounts).forEach(([hexId, count]) => {
    const boundary = h3.cellToBoundary(hexId);
    const leafletBoundary = boundary.map(coord => [coord[0], coord[1]]);
    
    const color = getColor(count);
    
    const hexPolygon = L.polygon(leafletBoundary, {
      color: color,
      fillColor: color,
      fillOpacity: 0.6,
      weight: 1
    });

    hexPolygon.bindPopup(`
      <strong>🏘️ Densità Edifici</strong><br>
      Edifici in questa cella: <strong>${count}</strong><br>
      ${count > 30 ? '🔴 Area molto antropizzata' : 
        count > 15 ? '🟠 Area moderatamente antropizzata' : 
        '🟢 Area poco antropizzata'}
    `);

    hexPolygon.addTo(layerRisultati);
  });

  layerRisultati.addTo(map);

  // Aggiungi marker centrale
  markerPreview = L.circleMarker([puntoRicerca.lat, puntoRicerca.lon], {
    radius: 6,
    color: "black",
    fillColor: "white",
    fillOpacity: 1,
    weight: 2
  })
    .addTo(map)
    .bindPopup("📍 Centro analisi");

  // Aggiorna statistiche
  document.getElementById("status").innerText =
    `✅ Analisi completata: ${data.elements.length} edifici in ${Object.keys(cellCounts).length} celle`;

  document.getElementById("stats").innerHTML = `
    <strong>Statistiche:</strong><br>
    Max: ${maxCount} edifici/cella<br>
    Min: ${minCount} edifici/cella<br>
    Media: ${avgCount} edifici/cella
  `;
}

/*************************************************
 * PULSANTE GPS
 *************************************************/
document.getElementById("btn-gps").addEventListener("click", () => {
  modalitaSceltaMappa = false;
  document.getElementById("status").innerText = "📡 Richiesta posizione GPS…";

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
    },
    () => {
      document.getElementById("status").innerText = "❌ Posizione non concessa";
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

/*************************************************
 * PULSANTE SCELTA MAPPA
 *************************************************/
document.getElementById("btn-map").addEventListener("click", () => {
  modalitaSceltaMappa = true;
  document.getElementById("status").innerText = "🗺️ Clicca sulla mappa";
});

/*************************************************
 * CLICK SULLA MAPPA
 *************************************************/
map.on("click", e => {
  if (!modalitaSceltaMappa) return;

  modalitaSceltaMappa = false;
  
  puntoRicerca = {
    lat: e.latlng.lat,
    lon: e.latlng.lng
  };

  mostraAnteprima(puntoRicerca.lat, puntoRicerca.lon);
});

/*************************************************
 * PULSANTE ANALIZZA
 *************************************************/
document.getElementById("btn-search").addEventListener("click", () => {
  avviaAnalisi();
});