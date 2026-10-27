// Peça Peça — service worker. O mesmo do boxOS (public/sw.js), com a tela "Sem
// internet" na marca do Peça Peça: é o app que fica instalado no endereço dele.
//
// Existe por dois motivos:
//
//   1. Instalar com um toque no celular. O Chrome do Android só oferece a instalação
//      para site com service worker que responde às requisições.
//   2. Sem internet, o app instalado mostra "Sem internet" em vez do dinossauro do Chrome.
//
// E de propósito NÃO guarda nada: nenhuma tela, nenhum dado da API. Cotação, preço,
// pedido — tudo vem sempre do servidor. Só a abertura de tela (navegação) passa por
// aqui; o resto (API, imagens, scripts) vai direto para a rede.

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    (async () => {
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (evento) => {
  if (evento.request.mode !== "navigate") return;

  evento.respondWith(
    (async () => {
      try {
        const adiantada = await evento.preloadResponse;
        if (adiantada) return adiantada;
        return await fetch(evento.request);
      } catch {
        // Só falha de rede cai aqui; erro do servidor (500, 404) passa como veio.
        return new Response(SEM_INTERNET, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
    })()
  );
});

// Tudo embutido (ícone, estilo): sem internet, nada daqui pode vir da rede.
const SEM_INTERNET = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0B1F4D">
<title>Sem internet · Peça Peça</title>
<style>
  html, body { margin: 0; height: 100%; background: #0B1F4D; color: #EAF1FE;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  main { min-height: 100%; box-sizing: border-box; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 16px; padding: 24px 16px; text-align: center; }
  h1 { margin: 8px 0 0; font-size: 22px; }
  p { margin: 0; max-width: 22rem; color: #B0BED8; line-height: 1.5; }
  button { margin-top: 8px; min-height: 48px; padding: 0 28px; border: 0; border-radius: 12px;
    background: #2563EB; color: #FFFFFF; font: inherit; font-weight: 600; font-size: 16px; }
</style>
</head>
<body>
<main>
  <svg width="72" height="72" viewBox="0 0 300 300" aria-hidden="true"><rect width="300" height="300" rx="67" fill="#2563EB"/><g transform="translate(45 45) scale(1.75) translate(1 -3.5)" stroke-linejoin="round"><path d="M44 42L60 14.3L92 14.3L108 42L92 69.7L104 82L76 69.7L60 69.7Z" fill="#A3E635" stroke="#A3E635" stroke-width="6"/><path d="M10 66L29 33.1L67 33.1L86 66L67 98.9L48 98.9L18 113L29 98.9Z" fill="#2563EB" stroke="#2563EB" stroke-width="16"/><path d="M10 66L29 33.1L67 33.1L86 66L67 98.9L48 98.9L18 113L29 98.9Z" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="6"/><circle cx="48" cy="66" r="14" fill="#2563EB"/></g></svg>
  <h1>Sem internet</h1>
  <p>O Peça Peça precisa de internet para abrir. Confira o Wi-Fi ou os dados do celular e tente de novo.</p>
  <button type="button" onclick="location.reload()">Tentar de novo</button>
</main>
<script>addEventListener("online", function () { location.reload(); });</script>
</body>
</html>`;
