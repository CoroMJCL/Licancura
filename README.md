# Mármoles Licancura — Sitio web corporativo

Sitio web moderno y premium para Mármoles Licancura, con panel de administración, cotizador online, carrusel de proyectos y base de datos en Supabase.

## Stack

- **Frontend:** HTML + CSS + JS vanilla (sin frameworks, sin build)
- **Base de datos:** Supabase (PostgreSQL en la nube)
- **Imágenes:** Supabase Storage
- **Auth:** Supabase Auth (email/contraseña)
- **Deploy:** Vercel
- **Repo:** GitHub

---

## Estructura de archivos

```
licancura/
├── index.html          ← Sitio principal
├── css/
│   ├── main.css        ← Estilos del sitio público
│   └── admin.css       ← Estilos del panel admin
├── js/
│   ├── config.js       ← Credenciales Supabase
│   ├── main.js         ← Lógica sitio público
│   └── admin.js        ← Panel de administración
├── sql/
│   └── setup.sql       ← Script para crear tablas en Supabase
├── vercel.json
├── .gitignore
└── README.md
```

---

## Setup paso a paso

### 1. Crear tablas en Supabase

1. Ve a [supabase.com](https://supabase.com) → tu proyecto
2. Menú izquierdo → **SQL Editor** → **New query**
3. Pega el contenido de `sql/setup.sql`
4. Haz clic en **Run**

Esto crea todas las tablas, datos iniciales, políticas RLS y el bucket de imágenes.

### 2. Crear usuario administrador

1. En Supabase → menú izquierdo → **Authentication** → **Users**
2. Clic en **Add user** → **Create new user**
3. Ingresa el email y contraseña del administrador
4. Guarda esas credenciales — las usarás para entrar al panel

### 3. Subir a GitHub

```bash
git init
git add .
git commit -m "Initial commit — Mármoles Licancura"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/licancura.git
git push -u origin main
```

### 4. Deploy en Vercel

1. Ve a [vercel.com](https://vercel.com) → **New Project**
2. Importa el repositorio de GitHub
3. Framework Preset: **Other**
4. Haz clic en **Deploy**

Vercel detecta el `vercel.json` automáticamente. Cada push a `main` hace deploy automático.

### 5. Abrir CodeSandbox (opcional, para editar online)

1. Ve a [codesandbox.io](https://codesandbox.io)
2. **Import from GitHub** → pega la URL de tu repositorio
3. Edita y los cambios se sincronizan con GitHub

---

## Uso del panel de administración

El ícono de administrador está en la **esquina inferior izquierda** del sitio.

Desde el panel puedes:

| Sección | Qué puedes hacer |
|---|---|
| **Contenido** | Editar textos de Nosotros, estadísticas (800+, 20 años…), nombre y descripción de servicios |
| **Precios** | Agregar/editar/eliminar materiales, tipos de trabajo y acabados con sus precios |
| **Proyectos** | Agregar proyectos con foto (subida directa o URL), eliminar proyectos |
| **Cotizaciones** | Ver historial de todas las cotizaciones realizadas en el sitio |
| **Mensajes** | Ver mensajes del formulario de contacto, marcar como leídos |
| **Configuración** | Cambiar WhatsApp, teléfono, email, dirección y horario |

---

## Datos que guarda la base de datos

| Tabla | Qué guarda |
|---|---|
| `textos` | Contenido editable (títulos, párrafos, frases) |
| `estadisticas` | Números del sitio (800+ proyectos, 20 años…) |
| `servicios` | Los 4 servicios con nombre y descripción |
| `proyectos` | Cada proyecto con foto, categoría y descripción |
| `materiales` | Materiales con precio base por m² |
| `tipos_trabajo` | Tipos de trabajo con factor multiplicador |
| `acabados` | Acabados con costo extra por m² |
| `cotizaciones` | Cada cotización hecha en el sitio (anónima) |
| `contactos` | Mensajes del formulario de contacto |
| `configuracion` | WhatsApp, teléfono, email, dirección, horario |

---

## Cambiar el número de WhatsApp

Desde el panel admin → **Configuración** → campo WhatsApp.
Formato: solo números con código de país, sin `+`. Ejemplo: `56912345678`

---

## Agregar fotos reales a proyectos

Desde el panel admin → **Proyectos** → **Agregar nuevo proyecto**:
- Arrastra o selecciona una imagen JPG/PNG/WEBP (se sube a Supabase Storage automáticamente)
- O pega una URL de imagen externa

---

## Licencia

Uso privado — Mármoles Licancura © 2025
