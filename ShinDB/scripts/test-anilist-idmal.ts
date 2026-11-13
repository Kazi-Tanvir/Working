import dns from "node:dns";
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {}

async function run() {
  const query = `
    query ($idMalIn: [Int]) {
      Page(page: 1, perPage: 50) {
        media(idMal_in: $idMalIn) {
          id
          idMal
          type
          title {
            english
            romaji
            native
          }
        }
      }
    }
  `;

  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { idMalIn: [52034] },
    }),
  });

  const json = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(json, null, 2));
}

run().catch(console.error);

