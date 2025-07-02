# Aaryavart Invoice Dashboard

A modern dashboard for managing, analyzing, and sending invoices across Aaryavart centres.

## Features

- View, search, and filter invoices by status, centre, month, and year
- Bulk operations: send multiple invoices at once
- View detailed invoice information in a dialog
- Revenue analytics: daily, monthly, quarterly, and yearly charts
- Consolidated and per-centre data views
- Built with React, Vite, TypeScript, shadcn-ui, and Tailwind CSS

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

1. **Clone the repository:**
   ```sh
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Start the development server:**
   ```sh
   npm run dev
   ```
   The app will be available at [http://localhost:8080](http://localhost:8080) by default.

### Usage

- Use the dashboard to:
  - Select centre, year, and month to view invoices
  - Search and filter invoices
  - Select multiple invoices and use the "Send Selected" button for bulk operations
  - Click "View" in the Actions column to see full invoice details
  - Switch between consolidated and per-centre data
  - Analyze revenue with interactive charts

### Project Structure

- `src/pages/Index.tsx`: Main dashboard page
- `src/components/InvoiceTable.tsx`: Invoice table with selection and actions
- `src/components/InvoiceCharts.tsx`: Revenue and analytics charts
- `src/components/ui/`: UI components (cards, dialogs, buttons, etc.)

### Technologies Used

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/) (for charts)

### Deployment

You can deploy this app to any static hosting provider (Vercel, Netlify, etc.) after running:

```sh
npm run build
```

The output will be in the `dist/` directory.

---

**Aaryavart Invoice Dashboard** — Empowering your centre's financial workflow.
