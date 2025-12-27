// --- Part 1: Imports, setup, CORS, BMKG stations list ---
const express = require("express");
const cors = require("cors");
const cheerio = require("cheerio");

const app = express();
const PORT = process.env.PORT || 3000;

// Allow your GitHub Pages frontend to call the API
app.use(cors({ origin: "https://scelactrine.github.io" }));

// --- BMKG Cisadane + Rainfall stations list ---
const bmkgStations = [
  { station: "CH Serpong", code: "36.74.01.1009" },
  { station: "CH Rancamaya", code: "32.71.01.1010" },
  { station: "CH Rumpin (Bogor)", code: "32.01.18.2001" },
  { station: "CH Genteng (Bogor)", code: "32.71.01.1014" },
  { station: "CH Dramaga (Bogor)", code: "32.01.30.2008" },
  { station: "CH Kebun Raya Bogor (Paledang)", code: "32.71.03.1002" },
  { station: "CH Taman Sari (Bogor)", code: "32.01.31.2004" },
  { station: "CH Parung (Bogor)", code: "32.01.33.2002" },
  { station: "CH Ciomas (Bogor)", code: "32.01.29.2005" },
  { station: "Pasirjaya (Cigombong, Bogor)", code: "32.01.38.2007" },
  { station: "Bojong Murni (Ciawi, Bogor)", code: "32.01.24.2010" },
  { station: "Neglasari (Kota Tangerang)", code: "36.71.10.1001" },
  { station: "Karacak (Leuwiliang, Bogor)", code: "32.01.14.2005" },
  { station: "Bunar (Cigudeg, Bogor)", code: "32.01.22.2003" },
  { station: "Cigudeg (Bogor)", code: "32.01.22.2002" },
  { station: "Rengasjajar (Cigudeg, Bogor)", code: "32.01.22.2008" },
  { station: "Sukaraksa (Cigudeg, Bogor)", code: "32.01.22.2011" },
  { station: "Tegalega (Cigudeg, Bogor)", code: "32.01.22.2015" },
  { station: "Ranca Bungur (Bogor)", code: "32.01.34.2004" },
  { station: "Bantarjaya (Ranca Bungur, Bogor)", code: "32.01.34.2001" },
  { station: "Mekarsari (Ranca Bungur, Bogor)", code: "32.01.34.2005" },
  { station: "Bantarsari (Ranca Bungur, Bogor)", code: "32.01.34.2002" },
  { station: "Bantar Karet (Nanggung, Bogor)", code: "32.01.21.2004" }
];

// Endpoint to list BMKG stations
app.get("/bmkg/stations", (req, res) => {
  res.json(bmkgStations);
});
// --- Part 2: BMKG current conditions endpoint ---
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
      temp: currentBlock.find("p.font-bold").first().text().trim(),
      weather: currentBlock.find("p.text-black-primary").first().text().trim(),
      location: currentBlock.find("p.text-gray-primary").first().text().trim(),
      humidity: currentBlock.find("p:contains('Kelembapan') span.font-bold").text().trim(),
      windSpeed: currentBlock.find("p:contains('Kecepatan Angin') span.font-bold").text().trim(),
      windDirection: currentBlock.find("p:contains('Arah Angin') span.font-bold").text().trim(),
      visibility: currentBlock.find("p:contains('Jarak Pandang') span.font-bold").text().trim()
    };

    res.json(forecast);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching BMKG data");
  }
});
// --- Part 3: Telemetry endpoint – Cisadane PDAs ---
app.get("/telemetry", async (req, res) => {
  try {
    const url = "https://sdatelemetry.com/newfms/datapda.php";
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const norm = (str) =>
      String(str).toLowerCase().replace(/[^\w ]+/g, " ").replace(/\s+/g, " ").trim();

    const cisadaneCanonical = [
      { canonical: "Cisadane Hulu", weight: 1, location: "Bogor highlands (headwaters)", aliases: ["cisadane hulu", "hulu cisadane", "pda hulu cisadane", "sg cisadane hulu"] },
      { canonical: "Genteng", weight: 2, location: "Bogor uplands", aliases: ["genteng", "pda genteng", "genteng (bogor)"] },
      { canonical: "Batubeulah", weight: 3, location: "Bogor region", aliases: ["batubeulah", "batu beulah", "pda batubeulah"] },
      { canonical: "Cianten", weight: 4, location: "Bogor tributary", aliases: ["cianten", "pda cianten", "s cianten", "sungai cianten"] },
      { canonical: "Cibereum", weight: 5, location: "Bogor tributary", aliases: ["cibereum", "ci bereum", "pda cibereum"] },
      { canonical: "Ciampea", weight: 6, location: "Bogor tributary", aliases: ["ciampea", "pda ciampea"] },
      { canonical: "Cibogo", weight: 7, location: "Bogor midstream tributary", aliases: ["cibogo", "pda cibogo"] },
      { canonical: "Babakan", weight: 8, location: "Bogor city midstream", aliases: ["babakan", "pda babakan"] },
      { canonical: "Serpong", weight: 9, location: "Tangerang downstream", aliases: ["serpong", "pda serpong"] },
      { canonical: "Pasar Baru (Pintu Air 10)", weight: 10, location: "Tangerang floodgate / estuary", aliases: ["pasar baru", "bdg pasar baru", "pintu air 10", "pi 10", "pda pasar baru", "pasar baru / pi 10"] }
    ];

    const aliasIndex = new Map();
    cisadaneCanonical.forEach((entry) => {
      entry.aliases.forEach((alias) => aliasIndex.set(norm(alias), entry));
    });

    function matchCanonical(rawName) {
      const n = norm(rawName);
      if (aliasIndex.has(n)) return aliasIndex.get(n);
      for (const [aliasKey, entry] of aliasIndex.entries()) {
        if (n.includes(aliasKey)) return entry;
      }
      return null;
    }

    const stations = [];
    $("ul.features_list_detailed li").each((i, el) => {
      const rawName = $(el).find("h4 a").text().trim();
      const updateMatch = $(el).text().match(/WAKTU UPDATE\s*:\s*([^\n<]+)/i);
      const tmaText = $(el).find("strong").text().trim();
      const tma = tmaText.replace(/^\s*TMA\s*:\s*/i, "").trim();
      const statusText = $(el).find("i").text().trim();
      const status = statusText.replace(/^\s*STATUS\s*:\s*/i, "").trim();

      const entry = matchCanonical(rawName);
      if (entry) {
        stations.push({
          name: entry.canonical,
          location: entry.location,
          update: updateMatch ? updateMatch[1].trim() : "",
          tma,
          status,
          weight: entry.weight,
          rawName
        });
      }
    });

    stations.sort((a, b) => a.weight - b.weight || a.name.localeCompare(b.name));
    res.json({ stations });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching telemetry data");
  }
});
// --- Part 4: Root route + app.listen ---
// Root route for Render health check
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server ready at http://localhost:${PORT}`);
});
