// --- Part 1: Imports, setup, CORS, BMKG stations list ---
const express = require("express");
const cors = require("cors");
const cheerio = require("cheerio");

const app = express();
const PORT = process.env.PORT || 3000;

// Allow both the user page and the repo page
app.use(cors({
  origin: [
    "https://scelactrine.github.io",
    "https://scelactrine.github.io/sg2-dashboard"
  ]
}));




// --- BMKG Cisadane + Rainfall stations list ---
// Add cluster + andil fields so frontend can group and show relevancy
const bmkgStations = [
  // Hulu (Upstream – Bogor Highlands, closest to headwaters)
  { station: "ciawi-2001", code: "32.01.24.2001", cluster: "HULU", andil: "Sangat besar" },
  { station: "ciawi-2002", code: "32.01.24.2002", cluster: "HULU", andil: "Sangat besar" },
  { station: "ciawi-2003", code: "32.01.24.2003", cluster: "HULU", andil: "Sangat besar" },
  { station: "caringin-2001", code: "32.01.27.2001", cluster: "HULU", andil: "Besar" },
  { station: "caringin-2002", code: "32.01.27.2002", cluster: "HULU", andil: "Besar" },
  { station: "caringin-2003", code: "32.01.27.2003", cluster: "HULU", andil: "Besar" },
  { station: "cigombong-2001", code: "32.01.28.2001", cluster: "HULU", andil: "Besar" },
  { station: "cijeruk-2001", code: "32.01.29.2001", cluster: "HULU", andil: "Sedang" },
  { station: "dramaga-2001", code: "32.01.30.2001", cluster: "HULU", andil: "Sedang" },
  { station: "ciomas-2001", code: "32.01.31.2001", cluster: "HULU", andil: "Sedang" },
  { station: "tamansari-2001", code: "32.01.32.2001", cluster: "HULU", andil: "Sedang" },
  { station: "rancabungur-2001", code: "32.01.33.2001", cluster: "HULU", andil: "Sedang" },
  { station: "sempur-1006", code: "32.71.01.1006", cluster: "HULU", andil: "Kecil" },
  { station: "babakan-1005", code: "32.71.01.1005", cluster: "HULU", andil: "Kecil" },
  { station: "panaragan-1009", code: "32.71.01.1009", cluster: "HULU", andil: "Kecil" },
  { station: "tegallega-1007", code: "32.71.01.1007", cluster: "HULU", andil: "Kecil" },
  { station: "CH Rancamaya", code: "32.71.01.1010", cluster: "HULU", andil: "Besar" },
  { station: "CH Genteng (Bogor)", code: "32.71.01.1014", cluster: "HULU", andil: "Sedang" },
  { station: "CH Dramaga (Bogor)", code: "32.01.30.2008", cluster: "HULU", andil: "Sedang" },
  { station: "CH Kebun Raya Bogor (Paledang)", code: "32.71.03.1002", cluster: "HULU", andil: "Kecil" },
  { station: "CH Taman Sari (Bogor)", code: "32.01.31.2004", cluster: "HULU", andil: "Sedang" },
  { station: "CH Ciomas (Bogor)", code: "32.01.29.2005", cluster: "HULU", andil: "Sedang" },
  { station: "Pasirjaya (Cigombong, Bogor)", code: "32.01.38.2007", cluster: "HULU", andil: "Besar" },
  { station: "Bojong Murni (Ciawi, Bogor)", code: "32.01.24.2010", cluster: "HULU", andil: "Sangat besar" },
  { station: "Karacak (Leuwiliang, Bogor)", code: "32.01.14.2005", cluster: "HULU", andil: "Sedang" },
  { station: "Bantar Karet (Nanggung, Bogor)", code: "32.01.21.2004", cluster: "HULU", andil: "Sedang" },
  // Tengah (Midstream – Bogor/Tangerang transition)
  { station: "parung-2001", code: "32.01.10.2001", cluster: "TENGAH", andil: "Sedang" },
  { station: "warujaya-2004", code: "32.01.10.2004", cluster: "TENGAH", andil: "Sedang" },
  { station: "pamegarsari-2006", code: "32.01.10.2006", cluster: "TENGAH", andil: "Sedang" },
  { station: "gunungsindur-2001", code: "32.01.11.2001", cluster: "TENGAH", andil: "Sedang" },
  { station: "pengasinan-2003", code: "32.01.11.2003", cluster: "TENGAH", andil: "Sedang" },
  { station: "CH Rumpin (Bogor)", code: "32.01.18.2001", cluster: "TENGAH", andil: "Besar" },
  { station: "CH Parung (Bogor)", code: "32.01.33.2002", cluster: "TENGAH", andil: "Sedang" },
  { station: "Bantarjaya (Ranca Bungur, Bogor)", code: "32.01.34.2001", cluster: "TENGAH", andil: "Sedang" },
  { station: "Mekarsari (Ranca Bungur, Bogor)", code: "32.01.34.2005", cluster: "TENGAH", andil: "Sedang" },
  { station: "Ranca Bungur (Bogor)", code: "32.01.34.2004", cluster: "TENGAH", andil: "Sedang" },
  { station: "Bantarsari (Ranca Bungur, Bogor)", code: "32.01.34.2002", cluster: "TENGAH", andil: "Sedang" },
  { station: "Cigudeg (Bogor)", code: "32.01.22.2002", cluster: "TENGAH", andil: "Sedang" },
  { station: "Bunar (Cigudeg, Bogor)", code: "32.01.22.2003", cluster: "TENGAH", andil: "Sedang" },
  { station: "Sukaraksa (Cigudeg, Bogor)", code: "32.01.22.2011", cluster: "TENGAH", andil: "Sedang" },
  { station: "Tegalega (Cigudeg, Bogor)", code: "32.01.22.2015", cluster: "TENGAH", andil: "Sedang" },
  { station: "Rengasjajar (Cigudeg, Bogor)", code: "32.01.22.2008", cluster: "TENGAH", andil: "Sedang" },
  // Hilir (Downstream – Tangerang)
  { station: "CH Serpong", code: "36.74.01.1009", cluster: "HILIR", andil: "Kecil" },
  { station: "Neglasari (Kota Tangerang)", code: "36.71.10.1001", cluster: "HILIR", andil: "Sangat kecil" },
  { station: "buaran-1006", code: "36.74.01.1006", cluster: "HILIR", andil: "Sangat kecil" },
  { station: "cisauk-2001", code: "36.03.23.2001", cluster: "HILIR", andil: "Kecil" },
  { station: "suradita-2005", code: "36.03.23.2005", cluster: "HILIR", andil: "Kecil" },
  { station: "pagedangan-2001", code: "36.03.22.2001", cluster: "HILIR", andil: "Kecil" },
  { station: "karangtengah-1002", code: "36.71.05.1002", cluster: "HILIR", andil: "Sangat kecil" },
  { station: "pamulang-2001", code: "36.03.19.2001", cluster: "HILIR", andil: "Kecil" },
  { station: "setu-2001", code: "36.03.20.2001", cluster: "HILIR", andil: "Kecil" },
  { station: "muncul-2001", code: "36.03.21.2001", cluster: "HILIR", andil: "Kecil" }
];
// Endpoint to list BMKG stations
app.get("/bmkg/stations", (req, res) => {
  res.json(bmkgStations);
});

// --- BMKG current conditions endpoint ---
app.get("/bmkg", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing ?code= parameter");

  try {
    const url = `https://www.bmkg.go.id/cuaca/prakiraan-cuaca/${code}`;
    const response = await fetch(url);
    const html = await response.text();

    const $ = cheerio.load(html);
    const currentBlock = $(".mt-6.md\\:mt-0");

    const forecast = {
      weather: currentBlock.find("p.text-black-primary").first().text().trim(),
      update: new Date().toLocaleString("id-ID")
    };

    res.json(forecast);
  } catch (err) {
    console.error("BMKG fetch error:", err);
    res.status(500).send("Error fetching BMKG data");
  }
});

// --- Root route + app.listen ---
app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.listen(PORT, () => {
  console.log(`Server ready at http://localhost:${PORT}`);
});
