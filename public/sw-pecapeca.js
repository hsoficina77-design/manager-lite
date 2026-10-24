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
<meta name="theme-color" content="#2563EB">
<title>Sem internet · Peça Peça</title>
<style>
  html, body { margin: 0; height: 100%; background: #0F1B33; color: #F5F6F7;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  main { min-height: 100%; box-sizing: border-box; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 16px; padding: 24px 16px; text-align: center; }
  h1 { margin: 8px 0 0; font-size: 22px; }
  p { margin: 0; max-width: 22rem; color: #B7C2D6; line-height: 1.5; }
  button { margin-top: 8px; min-height: 48px; padding: 0 28px; border: 0; border-radius: 12px;
    background: #2563EB; color: #FFFFFF; font: inherit; font-weight: 600; font-size: 16px; }
</style>
</head>
<body>
<main>
  <svg width="72" height="72" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#2563EB"/><g transform="translate(8 8) scale(2)" fill="none" stroke="#FFFFFF" stroke-width="2.1" stroke-linejoin="round"><path d="M12 2.5 20.2 7.25v9.5L12 21.5l-8.2-4.75v-9.5Z"/><circle cx="12" cy="12" r="3.6"/></g></svg>
  <h1>Sem internet</h1>
  <p>O Peça Peça precisa de internet para abrir. Confira o Wi-Fi ou os dados do celular e tente de novo.</p>
  <button type="button" onclick="location.reload()">Tentar de novo</button>
</main>
<script>addEventListener("online", function () { location.reload(); });</script>
</body>
</html>`;
