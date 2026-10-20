export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

/**
 * Se ejecuta en el <head> antes de pintar la página para evitar el parpadeo:
 * usa la elección guardada o, si no hay, la preferencia del sistema.
 * Mientras el usuario no elija, sigue los cambios del sistema en vivo.
 */
export const themeInitScript = `(function(){try{
var k=${JSON.stringify(THEME_STORAGE_KEY)},d=document.documentElement,m=matchMedia("(prefers-color-scheme: dark)");
function apply(){var s=localStorage.getItem(k);d.dataset.theme=s==="light"||s==="dark"?s:(m.matches?"dark":"light");}
apply();m.addEventListener("change",function(){if(!localStorage.getItem(k))apply();});
}catch(e){}})();`;
