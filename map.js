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

let markerPreview = null;         // punto selezionato
let circlePreview = null;         // cerchio raggio
let layerBagni = null;            // marker bagni

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
  if (layerBagni) map.removeLayer(layerBagni);

  document.getElementById("status").innerText =
    `🔄 Ricerca bagni (${raggio / 1000} km)…`;

  const { lat, lon } = puntoRicerca;

  const query = `
[out:json][timeout:25];
(
  node["amenity"="toilets"](around:${raggio},${lat},${lon});
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
    .then(data => mostraBagni(data))
    .catch(() => {
      // fallback
      fetchOverpass(endpoints[1])
        .then(r => r.json())
        .then(data => mostraBagni(data))
        .catch(() => {
          document.getElementById("status").innerText =
            "❌ Servizio temporaneamente non disponibile";
        });
    });
}

/*************************************************
 * MOSTRA BAGNI
 *************************************************/
function mostraBagni(data) {
  layerBagni = L.layerGroup();

  data.elements.forEach(el => {
    if (!el.lat || !el.lon) return;

    let popup = "<strong>🚻 Bagno pubblico</strong><br>";

    if (el.tags) {
      if (el.tags.wheelchair === "yes") popup += "♿ Accessibile<br>";
      if (el.tags.fee === "yes") popup += "💰 A pagamento<br>";
      if (el.tags.fee === "no") popup += "Gratis<br>";
    }

    L.marker([el.lat, el.lon])
      .bindPopup(popup)
      .addTo(layerBagni);
  });

  layerBagni.addTo(map);

  document.getElementById("status").innerText =
    `🚻 Bagni trovati: ${data.elements.length}`;
}

/*************************************************
 * PULSANTE GPS
 *************************************************/
document.getElementById("btn-gps").addEventListener("click", () => {
  modalitaSceltaMappa = false;

  document.getElementById("status").innerText =
    "📍 Richiesta posizione GPS…";

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
  document.getElementById("status").innerText =
    "🗺️ Tocca un punto sulla mappa";
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

  document.getElementById("status").innerText =
    "📍 Punto selezionato – premi Avvia ricerca";
});

/*************************************************
 * PULSANTE AVVIA RICERCA
 *************************************************/
document.getElementById("btn-search").addEventListener("click", () => {
  avviaRicerca();
});
