# FlowDesk · videos con Remotion

Proyecto independiente (no es parte de los workspaces de npm ni del despliegue en Vercel).

```bash
cd video
npm install
npm run studio   # editor visual en el navegador (http://localhost:3000)
npm run render   # genera out/flowdesk-promo.mp4 (1920x1080, 30 fps)
npm run render:tiktok  # genera out/flowdesk-tiktok.mp4 (1080x1920, anuncio vertical con música)
npm run still    # genera out/poster.png
```

- `src/Root.tsx` registra las composiciones; `src/FlowDeskPromo.tsx` es el video promocional (escenas: logo,
  titular, tablero con un lead que llega y un trato que se gana, funciones y llamado a la acción).
- `src/tiktok/`: anuncio vertical de 42 s. Los cortes caen en los beats de la canción (`beats.ts`, detectados con
  librosa). El audio va en `public/audio/billy.mp3` y no se sube al repositorio: cópialo ahí antes de renderizar.
- `src/theme.ts` copia los colores de `client/tailwind.config.js`. La fuente Inter va en `public/fonts` para que el
  render no dependa de internet.
- Remotion es gratis para personas y empresas de hasta 3 personas; empresas más grandes necesitan una licencia de
  empresa (remotion.dev/license).
