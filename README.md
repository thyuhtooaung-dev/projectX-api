# projectX API

Backend API service for projectX, an intelligent conversational AI platform built with NestJS, TypeORM, PostgreSQL, and OpenRouter.

---

## Architecture Overview

The backend is built as a modular NestJS application designed for high-concurrency streaming, reliable persistence, and clean separation of concerns.

### Technology Stack

* **Runtime**: Node.js (v20+)
* **Framework**: NestJS 11
* **Database**: PostgreSQL
* **ORM**: TypeORM with automated synchronization
* **Validation**: `class-validator` and `class-transformer`
* **AI Provider**: OpenRouter API via OpenAI SDK
* **Code Quality**: Biome 2.5 (linter and formatter)

---

## Prerequisites

* **Node.js**: v20.x or higher
* **npm**: v10.x or higher
* **PostgreSQL**: v14.x or higher running locally or remotely

---

## Environment Configuration

Create a `.env` file in the `server` root directory:

```env
# Application Port
PORT=8080

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=your_db_name

# OpenRouter Credentials
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

---

## Installation and Setup

1. Install project dependencies:
   ```bash
   npm install
   ```

2. Verify that your PostgreSQL server is active and the target database exists:
   ```sql
   CREATE DATABASE 'your_db_name';
   ```

3. Start the application in development mode:
   ```bash
   npm run start:dev
   ```
   The server will start on `http://localhost:8080`.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run start` | Run the NestJS application |
| `npm run start:dev` | Run in watch mode with automatic reloads |
| `npm run build` | Compile the TypeScript code to `dist/` |
| `npm run start:prod` | Run the compiled production build |
| `npm run lint` | Run Biome linter with unsafe fixes (`biome check --write --unsafe`) |
| `npm run format` | Format files with Biome (`biome format --write .`) |
| `npm test` | Run unit tests with Jest |
| `npm run test:e2e` | Run end-to-end tests |

---

## Code Quality Standards

This project uses **Biome** for linting and formatting.

* Check and fix lint issues:
  ```bash
  npm run lint
  ```
* Format codebase:
  ```bash
  npm run format
  ```
