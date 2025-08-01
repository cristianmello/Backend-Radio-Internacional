# Back-end para Realidad Nacional

Este repositorio contiene el código fuente de la API RESTful para la aplicación de Realidad Nacional. Sirve como el cerebro de la aplicación, gestionando la base de datos, la lógica de negocio, la autenticación y el almacenamiento de archivos.

Está construido con **Node.js**, **Express.js** y **Sequelize** como ORM, y está diseñado para ser desplegado en Railway.

## ✨ Características Principales

- **API RESTful Completa:** Endpoints para la gestión (CRUD) de Artículos, Audios, Shorts, Anuncios, Categorías, Secciones y Comentarios.
- **Autenticación y Autorización:** Sistema robusto basado en JSON Web Tokens (JWT), incluyendo tokens de acceso y de refresco.
- **Gestión de Roles:** Sistema de permisos para diferentes tipos de usuarios (Superadmin, Admin, Editor, etc.).
- **Gestión de Archivos:** Subida, optimización y servicio de imágenes y audios a través de un CDN externo (BunnyCDN).
- **Capa de Caché:** Integración con Redis para cachear respuestas de la API y mejorar el rendimiento.
- **Logging Detallado:** Registros de acciones importantes (inicios de sesión, cambios de perfil, errores) y la capacidad de exportarlos a CSV.
- **CI/CD:** Sitemap auto-generado y otras tareas automatizadas mediante GitHub Actions.

## 🛠️ Stack Tecnológico

- **Entorno de ejecución:** Node.js
- **Framework:** Express.js
- **Base de Datos:** MySQL (o la base de datos SQL que uses) con Sequelize como ORM.
- **Caché:** Redis
- **Almacenamiento de Archivos:** BunnyCDN
- **Autenticación:** JSON Web Tokens (JWT)
- **Despliegue:** Railway, Docker

## 🚀 Cómo Empezar

Sigue estos pasos para levantar el servidor en un entorno local.

### Requisitos Previos

- Node.js (v18 o superior)
- npm (o el gestor de paquetes de tu preferencia)
- Una instancia de PostgreSQL y Redis corriendo localmente o en la nube.

### Instalación

1.  **Clona el repositorio** y navega a la carpeta del back-end:
    ```bash
    git clone https://github.com/tu-usuario/tu-repositorio-backend.git
    cd tu-repositorio-backend
    ```

2.  **Instala las dependencias:**
    ```bash
    npm install
    ```

3.  **Configura las variables de entorno:**
    - Busca el archivo `.env.example` (si no existe, créalo).
    - Crea una copia y renómbrala a `.env`.
    - Llena los valores requeridos. Deberías tener algo similar a esto:
      ```env
      ACCESS_TOKEN_SECRET=valor_del_token
      REFRESH_TOKEN_SECRET=valor_del_refresh_token

      ACCESS_TOKEN_EXPIRES_IN=1h o algún otro valor
      REFRESH_TOKEN_EXPIRES_IN=7d o algún otro valor
      # Configuración del Servidor
      
      NODE_ENV=development
      PORT=
      CLIENT_URL=
      
      # Base de Datos (Sequelize)
      DB_USER=tu_usuario
      DB_PASSWORD=tu_contraseña
      DB_HOST=localhost
      DB_NAME=radio_db
      DB_PORT=puerto_db
      MYSQL_URL=

      # Autenticación
      JWT_SECRET=tu_secreto_muy_largo_para_jwt
      JWT_REFRESH_SECRET=otro_secreto_muy_largo_para_refresh

      # Redis
      REDIS_URL=redis://...

      # BunnyCDN
      BUNNY_STORAGE_ZONE=tu_zona_de_bunny
      BUNNY_STORAGE_PASSWORD=tu_password_de_bunny
      BUNNY_STORAGE_HOST=valor_host_bunny

      # Email
      SMTP_HOST=smtp.example.com
      SMTP_PORT=
      SMTP_USER=tu_email
      SMTP_PASS=tu_contraseña_de_email
      SMTP_FROM_NAME=
      SMTP_FROM_ADDRESS=

      LOG_LEVEL=info
      DB_LOGGING=true

      SITEMAP_SECRET=valor_genera_el_sitemap.xml
      ```

### Configuración de la Base de Datos

Una vez configurado tu archivo `.env`, ejecuta los siguientes comandos para preparar la base de datos:

1.  **Ejecuta las migraciones** para crear las tablas:
    ```bash
    npx sequelize-cli db:migrate
    ```

2.  **(Opcional) Ejecuta los seeders** para poblar la base de datos con datos iniciales (como los roles y el superadmin):
    ```bash
    npx sequelize-cli db:seed:all
    ```

### Iniciar el Servidor

- Para iniciar en **modo desarrollo** (con recarga automática):
  ```bash
  npm run dev