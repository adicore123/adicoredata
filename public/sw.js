/* Service Worker — כל התפקיד שלו הוא לקלוט קבצים ששותפו מוואטסאפ (Web Share Target)
   ולהעביר אותם לטופס ההעלאה דרך Cache Storage. לא נשמר כאן שום מטמון של האפליציה. */

const SHARE_CACHE = "share-target";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === "POST" && url.pathname === "/share-target") {
    event.respondWith(handleShare(event.request));
  }
});

async function handleShare(request) {
  const form = await request.formData();
  const files = form.getAll("files").filter((f) => f instanceof File);
  const cache = await caches.open(SHARE_CACHE);

  await Promise.all([
    cache.put(
      "/shared-count",
      jsonResponse({ count: files.length, title: form.get("title") || form.get("text") || "" }),
    ),
    ...files.map((file, i) =>
      cache.put(
        `/shared-file-${i}`,
        new Response(file, {
          headers: { "content-type": file.type, "x-file-name": encodeURIComponent(file.name) },
        }),
      ),
    ),
  ]);

  return Response.redirect("/upload?from=share", 303);
}

function jsonResponse(obj) {
  return new Response(JSON.stringify(obj), {
    headers: { "content-type": "application/json" },
  });
}
