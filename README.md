# descubre-funil

Funil estático (deploy no Netlify). **Leve (< 1MB)** — todo o conteúdo pesado
(vídeo, CSS, fontes, imagens) é servido via jsDelivr a partir do repo
[`descubre-assets`](https://github.com/Tulio878/descubre-assets).

## Fluxo
`/` → `enlk1/sp-1/index.html` → `page1.html` (telefone) → `page2.html` (VSL) →
`enlk1/sp-5/` (oferta) → checkout Explodely.

## Deploy Netlify
Publish directory = raiz do repo. Sem build. Entrada: `enlk1/sp-1/index.html`.
