# test-site-docs-3

Repositorio de contenido neutral para la documentación de **test-site-docs-3**.

## Estructura

- `/docs/`: páginas Markdown/MDX portables del Site.
- `/static/`: assets estáticos referenciables desde la documentación publicada.

## Contrato de contenido

Este repositorio usa frontmatter neutral para facilitar la publicación con distintos motores de documentación:

```yaml
title: Título visible de la página
description: Resumen breve para SEO y listados
label: Etiqueta corta para navegación
order: Posición relativa en la navegación
hidden: false
```

Las admonitions usan sintaxis `remark-directive`:

```md
:::tip
This is a tip
:::
```

Empieza en [`/docs/index.md`](/docs/index.md).
