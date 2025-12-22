/*************************************************
 * MAPPA BASE
 *************************************************/
const map = L.map("map").setView([41.9028, 12.4964], 12); // Roma fallback

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

/*************************************************
 * VARIABILI GLOBALI
 *************************************************/
let layerBagni = null;
let markerCentro = null;
let modalitaSceltaMappa = false;
let raggio = 3000;

// punto selezionato (GPS o mappa)
let puntoRicerca = null;

/*************************************************
 * RAGGIO
 *************************************************/
const radiusSelect = document.getElementById("radius");
raggio = Number(radiusSelect.value);

radiusSelect.addEventListener("change", e => {
  raggio = Number(e.target.value);
  document.getElementById("status").innerText =
    `Raggio impostato a ${raggio / 1000} km (premi Avvia ricerca)`;
});

/*************************************************
 * FUNZIONE OVERPASS
 *************************************************/
function eseguiRicerca() {
  if (!puntoRicerca) {
    document.getElementById("status").innerText =
      "⚠️ Seleziona una posizione o usa il GPS";
    return;
  }

  const { lat, lon } = puntoRicerca;

  if (layerBagni) map.removeLayer(layerBagni);
  if (markerCentro) map.removeLayer(markerCentro);

  markerCentro = L.circleMarker([lat, lon], {
    radius: 8,
    color: "red",
    fillOpacity: 0.6
  })
    .addTo(map)
    .bindPopup("📍 Punto di ricerca")
    .openPopup();

  map.setView([lat, lon], 15);

  document.getElementById("status").innerText =
    `🔄 Ricerca in corso (${raggio / 1000} km)…`;

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

  fetch(endpoints[0], {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "data=" + encodeURIComponent(query)
  })
    .then(r => {
      if (!r.ok) throw new Error();
      return r.json();
    })
    .then(data => mostraBagni(data))
    .catch(() => {
      fetch(endpoints[1], {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "data=" + encodeURIComponent(query)
      })
        .then(r => r.json())
        .then(data => mostraBagni(data))
        .catch(() => {
          document.getElementById("status").innerText =
            "❌ Servizio non disponibile, riprova";
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

    L.marker([el.lat, el.lon])
      .bindPopup("🚻 Bagno pubblico")
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

  navigator.geolocation.getCurrentPosition(
    pos => {
      puntoRicerca = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude
      };

      document.getElementById("status").innerText =
        "📍 Posizione acquisita (premi Avvia ricerca)";
    },
    () => {
      document.getElementById("status").innerText =
        "❌ Posizione non concessa";
    }
  );
});

/*************************************************
 * PULSANTE MAPPA
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

  document.getElementById("status").innerText =
    "📍 Punto selezionato (premi Avvia ricerca)";
});

/*************************************************
 * PULSANTE AVVIA RICERCA
 *************************************************/
document.getElementById("btn-search").addEventListener("click", () => {
  eseguiRicerca();
});
