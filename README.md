# Las veinticinco noches

Calendario literario responsive, con Supabase para relatos y registro mínimo de aperturas.

## Configuración pendiente
En Supabase Dashboard → Project Settings → Edge Functions → Secrets, añade:
- `EDITOR_KEY`: clave privada larga (32+ caracteres), solo para ti.
- `EDITOR_SESSION_SECRET`: otra cadena aleatoria distinta (32+ caracteres).

No compartas estos secretos por chat ni los incluyas en GitHub. La función usa `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` del entorno de Supabase; nunca se exponen al navegador.

## Publicar
1. Sube `index.html`, `styles.css`, `app.js` y `.github/workflows/deploy.yml` a la raíz del repositorio `Mark08bb/las-veinticinco-noches`.
2. GitHub → Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. El flujo publicará al hacer push a `main`. URL habitual: `https://mark08bb.github.io/las-veinticinco-noches/`.

## Contenido
Las 25 puertas tienen títulos y sinopsis precargados. Los textos completos están pendientes de escritura. Los relatos solo son consultables cuando `is_published=true` y ha llegado `opens_at`. El registro guarda solo el número de puerta y la fecha/hora.
