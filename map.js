const map = L.map("map");

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

// Posizione utente
map.locate({ setView: true, maxZoom: 16 });

map.on("locationerror", () => {
  map.setView([45.4642, 9.19], 13);
});

// Carica bagni
fetch("./toilets.geojson")
  .then(res => res.json())
  .then(data => {
    const layerBagni = L.geoJSON(data, {
      onEachFeature: (feature, layer) => {
        layer.bindPopup("🚻 Bagno pubblico");
      }
    }).addTo(map);

    // 🔥 QUESTA È LA RIGA CHE MANCAVA
    map.fitBounds(layerBagni.getBounds());
  });
