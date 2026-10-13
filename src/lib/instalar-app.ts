// Instalar o boxOS no aparelho — a parte que roda antes do React (ver
// components/ui/InstalarApp.tsx). Fica fora do componente porque o layout, que é do
// servidor, precisa do texto do script.

/** Avisa a tela que o navegador mudou de ideia: liberou a instalação ou já instalou. */
export const EVENTO_INSTALAR = "boxos:instalar";

/**
 * Aplicado no `<head>`, antes do React.
 *
 * O Chrome avisa que dá para instalar uma vez por carregamento de página, e pode avisar
 * antes de a tela terminar de montar — ou numa tela que não é o Início. O aviso fica
 * guardado na janela até alguém tocar em "Instalar". O `preventDefault` segura a
 * barrinha do próprio Chrome no Android, para o convite ser um só: o do boxOS.
 */
export const SCRIPT_INSTALAR = `(function(){addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__boxosInstalar=e;dispatchEvent(new Event("${EVENTO_INSTALAR}"))});addEventListener("appinstalled",function(){window.__boxosInstalar=null;window.__boxosInstalado=true;dispatchEvent(new Event("${EVENTO_INSTALAR}"))})})();`;
