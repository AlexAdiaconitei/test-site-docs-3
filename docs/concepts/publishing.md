---
title: Flujo de publicación
description: Cómo se convierte el contenido neutral en un Site publicado.
label: Publicación
order: 2
hidden: false
---

# Flujo de publicación

Un build de publicación toma el contenido de este repositorio, lo copia al workspace de la plantilla y genera un artefacto estático.

## Pasos esperados

1. Leer el contenido desde la raíz `/docs`.
2. Copiar assets desde `/static` si existe.
3. Aplicar la plantilla de publicación seleccionada.
4. Ejecutar el build del motor.
5. Publicar el resultado.

:::warning
Si añades sintaxis específica de un motor, valida que el adaptador pueda convertirla o que el Site seguirá usando ese motor.
:::

Sigue con la [primera edición guiada](../guides/first-edit.md).
