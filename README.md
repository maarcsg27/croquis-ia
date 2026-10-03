# ROOMIA · Tu habitación, a tu manera

> **Genera ideas de decoración y distribución en cada habitación de casa.**

ROOMIA es una aplicación web interactiva que te permite dibujar el croquis o plano de cualquier estancia de tu hogar, introducir medidas reales y elementos fijos de obra, y obtener al instante propuestas de interiorismo optimizadas con Inteligencia Artificial, renders 3D fotorrealistas y recomendaciones de productos reales para comprar.

---

## 🚀 Flujo de Trabajo

1. **📐 1. Croquis / Boceto:**
   Dibuja sobre una cuadrícula profesional e intuitiva la forma de tu habitación (líneas rectas, rectángulos o curvas Bézier).

2. **📏 2. Medidas Reales:**
   Añade las cotas exactas de tus paredes. El motor de escala ajusta automáticamente las proporciones y la geometría.

3. **🚪 3. Elementos Fijos y Obra:**
   Coloca puertas (simples, dobles, correderas), ventanas, balconeras, radiadores, chimeneas, armarios empotrados, columnas, tomas de corriente y puntos de TV.

4. **✨ 4. Distribución e Ideas con IA:**
   Describe lo que necesitas (sofá, mesa de comedor, almacenaje...) y selecciona tu estilo favorito (Nórdico, Japandi, Moderno, Minimalista...). La IA genera:
   - Distribuciones en plano 2D a escala con paleta cromática.
   - **Renders 3D fotorrealistas** en perspectiva o vista aérea isométrica.
   - Refinamiento continuo con tus comentarios y sugerencias.

5. **🛍️ 5. Personal Shopper de Productos:**
   Encuentra muebles y artículos reales parecidos en tiendas online (IKEA, Maisons du Monde, Kave Home, Leroy Merlin, Amazon...) con enlace directo de compra y precio orientativo.

---

## 🛠️ Tecnologías

- **Framework:** Next.js 16 (App Router, Turbopack, TypeScript)
- **Estilos:** Tailwind CSS v4 & Lucide Icons
- **Inteligencia Artificial:** Google Gemini API (`gemini-3.8-flash`, `gemini-3.1-flash-image`, Google Search Grounding)
- **Base de Datos:** Neon Postgres / Vercel Postgres (`@neondatabase/serverless`) + soporte offline con LocalStorage
- **Despliegue:** Vercel (CI/CD automático desde GitHub)

---

## 📦 Variables de Entorno

Configura en tu archivo `.env.local` o en Vercel (*Settings* → *Environment Variables*):

```env
# Clave gratuita de Google Gemini (https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=tu_gemini_api_key_aqui

# Base de datos Postgres (Opcional, activa persistencia en nube)
DATABASE_URL=postgresql://usuario:password@ep-ejemplo.neon.tech/neondb?sslmode=require
```

---

## 💻 Desarrollo Local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.
