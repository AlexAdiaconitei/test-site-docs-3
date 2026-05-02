---
title: Arquitectura de contenido
description: Relación entre contenido neutral, assets estáticos y plantillas de publicación.
label: Arquitectura
order: 1
hidden: false
---

# Arquitectura de contenido

El repositorio conectado contiene contenido neutral. La publicación combina ese contenido con una plantilla técnica durante el build.

```txt
Repositorio conectado
├── docs/       páginas Markdown/MDX neutrales
└── static/     assets portables
```

## Separación de responsabilidades

- El contenido describe el producto o servicio.
- La plantilla define el aspecto visual y la integración con el motor.
- El adaptador transforma el contrato neutral cuando es necesario.

Consulta también el [flujo de publicación](./publishing.md).
