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
let raggio = 3000; // default 3 km

/*************************************************
 * GESTIONE RAGGIO (TENDINA)
 *************************************************/
const radiusSelect = document.getElementById("radius");
if (radiusSelect) {
  raggio = Number(radiusSelect.value);

  radiusSelect.addEventListener("change", e => {
    raggio = Number(e.target.value);
  });
}

/*************************************************
 * FUNZIONE PRINCIPALE: CARICA BAGNI
 *************************************************/
function caricaBagni(lat, lon) {
  // pulizia layer precedenti
  if (layerBagni) map.removeLayer(layerBagni);
  if (markerCentro) map.removeLayer(markerCentro);

  // marker punto di ricerca
  markerCentro = L.circleMarker([lat, lon], {
    radius: 8,
    color: "red",
    fillColor: "red",
    fillOpacity: 0.6
  })
    .addTo(map)
    .bindPopup("📍 Punto di ricerca")
    .openPopup();

  map.setView([lat, lon], 15);

  document.getElementById("status").innerText =
    `🔄 Caricamento bagni (raggio ${raggio / 1000} km)…`;

  const query = `
[out:json][timeout:25];
(
  node["amenity"="toilets"](around:${raggio},${lat},${lon});
);
out body;
`;

  fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "data=" + encodeURIComponent(query)
  })
    .then(res => {
      if (!res.ok) throw new Error("Errore Overpass");
      return res.json();
    })
    .then(data => mostraBagni(data))
    .catch(err => {
      console.error("OVERPASS ERROR:", err);
      document.getElementById("status").innerText =
        "❌ Errore nel caricamento dei bagni";
    });
}

/*************************************************
 * MOSTRA BAGNI SULLA MAPPA
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
 * PULSANTE: USA GPS
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
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      caricaBagni(lat, lon);
    },
    err => {
      console.error("GEO ERROR:", err);
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
 * PULSANTE: SCEGLI SULLA MAPPA
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
  const { lat, lng } = e.latlng;
  caricaBagni(lat, lng);
});
