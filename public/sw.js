// boxOS — service worker.
//
// Existe por dois motivos:
//
//   1. Instalar com um toque no celular. O Chrome do Android só oferece a instalação
//      (o aviso que acende o cartão "Instale o boxOS" no Início) para site com service
//      worker que responde às requisições. Sem ele, só dava pelo menu ⋮.
//   2. Sem internet, o app instalado mostra "Sem internet" em vez do dinossauro do Chrome.
//
// E de propósito NÃO guarda nada: nenhuma tela, nenhum dado da API. Valor de OS, fiado,
// estoque — tudo vem sempre do servidor, como antes. Só a abertura de tela (navegação)
// passa por aqui; o resto (API, imagens, scripts) vai direto para a rede.
//
// Para desligar um dia: troque este arquivo por um que chame
// `self.registration.unregister()` no "activate".

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    (async () => {
      // A tela começa a carregar enquanto o service worker acorda, em vez de esperar por ele.
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
<meta name="theme-color" content="#1E2329">
<title>Sem internet · boxOS</title>
<style>
  html, body { margin: 0; height: 100%; background: #1E2329; color: #F5F6F7;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  main { min-height: 100%; box-sizing: border-box; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 16px; padding: 24px 16px; text-align: center; }
  h1 { margin: 8px 0 0; font-size: 22px; }
  p { margin: 0; max-width: 22rem; color: #B7BDC4; line-height: 1.5; }
  button { margin-top: 8px; min-height: 48px; padding: 0 28px; border: 0; border-radius: 12px;
    background: #F2A900; color: #1E2329; font: inherit; font-weight: 600; font-size: 16px; }
</style>
</head>
<body>
<main>
  <svg width="72" height="72" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#2A3038"/><g transform="translate(9.3 11.5) scale(0.63)"><path d="M2 54 V11 Q2 3 10 3 H62 Q70 3 70 11 V54 L63 58 V10 H9 V58 Z" fill="#F2A900"/><g fill="#FFFFFF"><rect x="15" y="18" width="4.5" height="38"/><rect x="52.5" y="18" width="4.5" height="38"/><rect x="13.5" y="16" width="7.5" height="3.5" rx="1"/><rect x="51" y="16" width="7.5" height="3.5" rx="1"/><rect x="12.5" y="54.5" width="9.5" height="3.5" rx="1"/><rect x="50" y="54.5" width="9.5" height="3.5" rx="1"/><rect x="19" y="38" width="9" height="3.8" rx="1"/><rect x="44" y="38" width="9" height="3.8" rx="1"/><rect x="24.2" y="35" width="4" height="5.5" rx="0.8"/><rect x="43.8" y="35" width="4" height="5.5" rx="0.8"/></g><circle cx="36" cy="27.3" r="8.5" fill="none" stroke="#F2A900" stroke-width="6"/></g></svg>
  <h1>Sem internet</h1>
  <p>O boxOS precisa de internet para abrir. Confira o Wi-Fi ou os dados do celular e tente de novo.</p>
  <button type="button" onclick="location.reload()">Tentar de novo</button>
</main>
<script>addEventListener("online", function () { location.reload(); });</script>
</body>
</html>`;
