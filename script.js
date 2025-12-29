// Conditions relevant to water level rise
const alertConditions = [
  "Hujan Ringan",
  "Hujan Sedang",
  "Hujan Lebat",
  "Hujan Petir",
  "Hujan Lokal",
  "Hujan Disertai Angin",
  "Angin Kencang"
];

// Fetch the list of BMKG stations and render them grouped by cluster
async function loadStations() {
  const table = document.getElementById("bmkg");

  try {
    const response = await fetch("https://sg2-dashboard.onrender.com/bmkg/stations");
    const stations = await response.json();

    // Clear old rows except header
    table.querySelectorAll("tr:not(:first-child)").forEach((row) => row.remove());

    // Define cluster order
    const clusters = [
      { name: "HULU", css: "cluster-hulu" },
      { name: "TENGAH", css: "cluster-tengah" },
      { name: "HILIR", css: "cluster-hilir" }
    ];

    for (const cluster of clusters) {
      // Add cluster header row
      const headerRow = document.createElement("tr");
      headerRow.className = `cluster-header ${cluster.css}`;
      headerRow.innerHTML = `<td colspan="4">${cluster.name}</td>`;
      table.appendChild(headerRow);

      // Filter stations for this cluster
      const clusterStations = stations.filter(st => st.cluster === cluster.name);

      for (const st of clusterStations) {
        // Fetch current weather for each station
        const forecastRes = await fetch(`https://sg2-dashboard.onrender.com/bmkg?code=${st.code}`);
        const forecast = await forecastRes.json();

        const row = document.createElement("tr");

        // Highlight if condition is relevant to water level rise
        if (alertConditions.includes(forecast.weather)) {
          row.classList.add("row-alert");
        }

        row.innerHTML = `
          <td>${st.station}</td>
          <td>${forecast.update || "-"}</td>
          <td>${forecast.weather || "-"}</td>
          <td>${st.andil}</td>
        `;
        table.appendChild(row);
      }
    }
  } catch (err) {
    console.error("Error loading stations:", err);
  }
}

// Initial load
loadStations();

// Refresh data every 5 minutes
setInterval(loadStations, 5 * 60 * 1000);
