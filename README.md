# Proyecto Walkthrough 3D

## Descripción

Este proyecto permite recorrer un espacio 3D escaneado desde el navegador utilizando un archivo `.glb` exportado desde herramientas como:

- Polycam
- Luma AI
- Scaniverse

El proyecto está desarrollado con:

- Three.js
- Vite

Permite:

### Navegación Desktop
- WASD
- Flechas
- Mouse

### Navegación Mobile
- Joystick izquierdo → movimiento
- Touch derecho → cámara/mirada

---

# Requisitos Previos

Antes de ejecutar el proyecto es NECESARIO instalar:

## 1. Node.js

Descargar e instalar:

https://nodejs.org/en/download

### IMPORTANTE

Instalar la versión:

- LTS (Long Term Support)

Durante la instalación:
- dejar todas las opciones por defecto.

---

# Verificar Instalación

Abrir una terminal y ejecutar:

```bash
node -v
```

Debería aparecer algo como:

```bash
v22.x.x
```

Luego verificar npm:

```bash
npm -v
```

---

# Descargar el Proyecto

## Opción A — Descargar ZIP desde GitHub

1. Entrar al repositorio.
2. Click en:
   - `Code`
   - `Download ZIP`
3. Extraer la carpeta.

---

## Opción B — Clonar con Git (usuarios técnicos)

```bash
git clone URL_DEL_REPO
```

---

# Abrir el Proyecto

Abrir una terminal dentro de la carpeta del proyecto.

Ejemplo:

```bash
cd polycam-walkthrough
```

---

# Instalar Dependencias

Ejecutar:

```bash
npm install
```

Esto descargará automáticamente todas las librerías necesarias.

---

# Ejecutar el Proyecto en Local

Ejecutar:

```bash
npm run dev
```

Luego aparecerá algo similar a:

```bash
Local: http://localhost:5173/
```

Abrir ese link en el navegador.

---

# Controles

## Desktop

| Acción | Control |
|---|---|
| Moverse | WASD / Flechas |
| Mirar | Mouse |
| Salir del modo navegación | ESC |

---

## Mobile

| Acción | Control |
|---|---|
| Moverse | Joystick izquierdo |
| Mirar | Arrastrar lado derecho |

---

# Reemplazar el Modelo 3D

El archivo 3D utilizado por el proyecto se encuentra en:

```bash
/public/model.glb
```

Para usar otro espacio:

1. Exportar un `.glb` desde Polycam.
2. Reemplazar el archivo existente.
3. Mantener el nombre:

```bash
model.glb
```

4. Reiniciar el servidor:

```bash
npm run dev
```

---

# Exportar desde Polycam

Recomendaciones:

### Formato
- `.glb`

### Calidad
- medium o low

Porque archivos muy pesados pueden generar:
- baja performance,
- problemas en mobile,
- tiempos largos de carga.

---

# Deploy en Vercel

El proyecto puede publicarse fácilmente utilizando:

https://vercel.com

---

# Deploy Paso a Paso

## 1. Crear cuenta en Vercel

Ingresar con:
- GitHub
- Google
- o email.

---

## 2. Subir el proyecto a GitHub

Crear un repositorio y subir:
- código,
- assets,
- `model.glb`.

---

## 3. Importar el repositorio en Vercel

En Vercel:

- `Add New`
- `Project`
- seleccionar el repositorio.

---

## 4. Configuración

Vercel detectará automáticamente Vite.

No modificar nada.

Simplemente presionar:

```bash
Deploy
```

---

# Resultado

Vercel generará automáticamente una URL similar a:

```bash
https://nombre-del-proyecto.vercel.app
```

Y el recorrido 3D quedará navegable desde:
- desktop,
- tablet,
- mobile.

---

# Tecnologías Utilizadas

- Three.js
- Vite
- GLTFLoader
- PointerLockControls

---

# Objetivo del MVP

Este proyecto funciona como:
- experiencia inmersiva web,
- walkthrough arquitectónico,
- exploración artística,
- prototipo interactivo,
- visualización espacial navegable.

La idea es poder reemplazar fácilmente el modelo `.glb` para reutilizar el sistema con distintos espacios escaneados.