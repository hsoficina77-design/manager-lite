// Instalar o boxOS no aparelho — a parte que roda antes do React (ver
// components/ui/InstalarApp.tsx). Fica fora do componente porque o layout, que é do
// servidor, precisa do texto do script.

import type { Produto } from "@/lib/produto";

/** Avisa a tela que o navegador mudou de ideia: liberou a instalação ou já instalou. */
export const EVENTO_INSTALAR = "boxos:instalar";

/**
 * Aplicado no `<head>`, antes do React.
 *
 * O Chrome avisa que dá para instalar uma vez por carregamento de página, e pode avisar
 * antes de a tela terminar de montar — ou numa tela que não é o Início. O aviso fica
 * guardado na janela até alguém tocar em "Instalar". O `preventDefault` segura a
 * barrinha do próprio Chrome no Android, para o convite ser um só: o do boxOS.
 *
 * Também registra o service worker: sem ele, o Chrome do celular nunca dá esse aviso —
 * só deixa instalar pelo menu ⋮. Depois do `load`, para não disputar a rede com a
 * primeira tela. Cada produto tem o seu (public/sw.js e public/sw-pecapeca.js): o que
 * muda é a tela "Sem internet", com a marca do app instalado.
 */
export function scriptInstalar(produto: Produto): string {
  const sw = produto === "peca-peca" ? "/sw-pecapeca.js" : "/sw.js";
  return `(function(){addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__boxosInstalar=e;dispatchEvent(new Event("${EVENTO_INSTALAR}"))});addEventListener("appinstalled",function(){window.__boxosInstalar=null;window.__boxosInstalado=true;dispatchEvent(new Event("${EVENTO_INSTALAR}"))});if("serviceWorker"in navigator){addEventListener("load",function(){navigator.serviceWorker.register("${sw}",{updateViaCache:"none"}).catch(function(){})})}})();`;
}
