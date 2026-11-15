# ehabashrafmu.github.io

Portfolio of Ehab Ashraf Muhammed, Cloud & DevOps Engineer (AWS Certified Solutions Architect – Professional).

Live at https://ehabashrafmu.github.io/

## How it's built

Plain HTML, CSS and JavaScript served by GitHub Pages. No build step and no framework.

```
.
├── index.html                      # All content, including the inline SVG architecture drawings
├── styles.css                      # Design tokens, layout, blueprint sheet styling
├── script.js                       # Nav, role rotator, copy buttons, "Trace the flow" animation
├── Ehab_Ashraf_DevOps_Engineer.pdf # CV linked from the site
└── assets/
    ├── ehab.jpg / ehab.webp        # Profile photo
    ├── og-card.png                 # Social sharing image (1200x630)
    ├── favicon.svg
    └── certs/                      # AWS certificate PDFs
```

## Editing the architecture drawings

Each project in `index.html` has an inline `<svg class="drawing">`. Nodes are `<g class="node" id="...">` and
connections are `<path class="edge" id="...">`. The numbered list under each drawing drives the animation:

```html
<li data-hops="hb-e1,hb-e2,-hb-e3" data-nodes="hb-client,hb-ingress">...</li>
```

- `data-hops`: edges the packet travels, in order. Prefix with `-` to travel an edge backwards.
- `data-nodes`: nodes to highlight during that step.

To update the CV, replace `Ehab_Ashraf_DevOps_Engineer.pdf` with a file of the same name.
