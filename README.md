# Bakaninha — Frontend

Cardápio digital + painel admin (React + React Router).

## Stack
- **React 18** + **react-router-dom 6** (CRA / `react-scripts`)
- **Axios** para HTTP
- Estilos puros (CSS + tokens em `src/styles/global.css`)

---

## Desenvolvimento local

### Pré-requisitos
- Node.js 20+
- Backend rodando em `http://localhost:3001` (veja `../backend/README.md`)

### Setup

```bash
npm install
cp .env.example .env
npm start
```

App em `http://localhost:3000`.

### Variáveis (`.env`)

| Var | Padrão | O que faz |
|---|---|---|
| `REACT_APP_API_URL` | `http://localhost:3001` | URL base da API |
| `REACT_APP_ADMIN_PATH` | `painel-bk-2026` | Slug da rota admin (sem `/`) |

> ⚠️ Variáveis CRA precisam começar com `REACT_APP_`. Mudanças exigem **reinício** do `npm start`.

### Rota admin
A rota admin **não está mais em `/adm`**. Default vai pra `/painel-bk-2026/login`. Pode mudar o slug pelo env `REACT_APP_ADMIN_PATH`.

### Credenciais padrão
Definidas no backend (`.env`). Em dev: `bakaninha@admin.com` / `bakana2026!`.

---

## Deploy na Netlify

### Pelo painel
1. **Add new site → Import an existing project → GitHub**, selecione `givasz/bakaninha-frontend`.
2. **Build settings** (já vem do `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `build`
3. **Environment variables** (Site settings → Build & deploy → Environment):
   - `REACT_APP_API_URL=https://api.bakaninha.seu-dominio.com`
   - `REACT_APP_ADMIN_PATH=painel-bk-2026` *(troque se quiser uma rota diferente)*
4. **Deploy**.

URL provisória: `https://bakaninha.netlify.app`.

### Pelo CLI
```bash
npm install -g netlify-cli
netlify login
netlify init   # vincula ao site
netlify deploy --prod
```

### Importante
- O `netlify.toml` já inclui o redirect SPA (`/* → /index.html 200`) — sem ele, recarregar `/marmita` ou `/checkout` daria 404.
- O `public/_redirects` é um fallback redundante para o mesmo redirect.
- `CI=false` no build evita que warnings do CRA virem erros.

### Atualizações
Push na branch `main` (ou `master`) dispara redeploy automático.

---

## Estrutura

```
src/
├── App.js              # Rotas + providers
├── pages/
│   ├── MenuPage.js     # Home (cardápio)
│   ├── MarmitaPage.js  # Montagem da marmita
│   ├── CheckoutPage.js # Finalização do pedido
│   ├── LoginPage.js    # Login admin
│   └── AdminPage.js    # Painel admin
├── components/
│   ├── Navbar.js
│   ├── CartDrawer.js
│   ├── ItemModal.js
│   └── admin/          # Componentes do painel
├── context/
│   ├── AuthContext.js
│   ├── CartContext.js
│   ├── ConfirmContext.js
│   └── ToastContext.js
└── styles/global.css   # Tokens + utilities
```
