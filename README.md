# SmsCode - A proprietary SMS verification code and number receiving platform

[中文说明](./README-zh.md)

SmsCode is a Vue 3 frontend application for SMS verification code and phone number services. It is designed for number rental, SMS code receiving, package subscription, order management, balance management, and OpenAPI integration scenarios.

The complete product consists of a backend service, an admin frontend, and this user-facing frontend. The backend handles business logic, the admin frontend manages platform operations, and this frontend provides the user portal and console.


![banner](./docs/banner.png)

## Notes

- This repository only open-sources the user-facing frontend code. Backend and admin frontend code are not included. For the complete source code, please contact t.me/@AnyGzking.
- Built with Vue 3 + Composition API and Vite 6.
- Written in TypeScript for better type safety.
- Styled with Tailwind CSS, with responsive layout and dark mode support.
- Uses Radix Vue and shadcn-vue style components for the UI layer.
- Uses Vue Router 4 for SPA routing and navigation guards.

## Overview

This project provides public pages and an authenticated business console, including:

- Account sign-in, sign-up, password reset, and captcha verification
- Number rental: receive numbers, release numbers, and blacklist numbers
- Package subscription: package orders, subscription plans, and subscribed number management
- Order management: my orders, order download, and expense statistics
- Account center: balance center, profile, appearance settings, and OpenAPI configuration
- API documentation page for external system integration
- Multi-language support, dark mode, responsive layout, and sidebar navigation

## Tech Stack

- **Framework**: Vue 3 + Composition API
- **Build Tool**: Vite 6
- **Language**: TypeScript
- **Router**: Vue Router 4
- **State Management**: Pinia
- **HTTP Client**: Axios
- **UI Components**: shadcn-vue, Radix Vue
- **Styling**: Tailwind CSS
- **Table**: TanStack Vue Table
- **Internationalization**: Vue I18n
- **Icons**: Lucide Vue Next, Iconify
- **Utilities**: VueUse, Zod, Vee-Validate

## Getting Started

### Requirements

Recommended environment:

- Node.js 18+
- pnpm 9+

### Install Dependencies

```bash
pnpm install
```

### Start Development Server

```bash
pnpm run dev
```

### Production Build

```bash
pnpm run build
```

### Preview Production Build

```bash
pnpm run preview
```

## Available Scripts

- `pnpm run dev`: start the Vite development server
- `pnpm run build`: run TypeScript checks and create a production build
- `pnpm run preview`: preview the production build locally

## Core Features

### Authentication

- Account/password sign-in
- Account registration
- Password reset
- Captcha verification
- Fetch user information after successful login
- URL token login: `?act=admin_login&token=xxx&refreshToken=xxx#/`
- Remember password option

### Number Rental

- Filter numbers by project, country, and message type
- Get numbers and poll SMS verification codes
- Display phone number, country code, port, PKEY, and related metadata
- Release numbers and add numbers to blacklist
- Display country prices, user prices, and channel prices

### Package Subscription

- View package orders
- Subscribe to packages
- Manage subscribed numbers
- Display package order status and time information

### Order Management

- My orders list
- Filter by country, project, status, phone number, order number, and time range
- Display order number, country, project, phone, ICCID/IMSI, price, status, code, SMS content, source, and time information
- Export orders and manage download tasks
- Expense statistics

### Account and Settings

- Profile page
- Appearance settings
- Balance center
- Header balance display with quick recharge entry
- OpenAPI configuration
- API documentation entry

### Internationalization and Theme

- Multi-language switching
- Light and dark mode
- Responsive sidebar layout

## Routes

### Public Routes

- `/`: home page
- `/api`: API documentation
- `/blog`: blog
- `/help`: help center
- `/about`: about
- `/sign-in`: sign in
- `/sign-up`: sign up
- `/reset-password`: reset password

### Console Routes

- `/app/dashboard`: dashboard
- `/app/number-rental/receive-number`: receive number
- `/app/number-rental/release-number`: release number
- `/app/number-rental/blacklist-number`: blacklist number
- `/app/package-subscription/package-orders`: package orders
- `/app/package-subscription/subscribe-plan`: subscribe plan
- `/app/package-subscription/number-management`: number management
- `/app/order-management/my-orders`: my orders
- `/app/order-management/order-download`: order download
- `/app/order-management/expense-statistics`: expense statistics
- `/app/settings/profile`: profile
- `/app/settings/appearance`: appearance
- `/app/settings/balance`: balance center
- `/app/settings/openapi`: OpenAPI configuration

## Project Structure

```text
src/
├── api/                 # API request wrappers
├── components/          # Reusable components
│   └── ui/              # Base UI components
├── composables/         # Vue composables
├── layouts/             # Layout components
├── lib/                 # Utilities, status codes, HTTP wrapper
├── locales/             # I18n messages
├── plugins/             # Plugin configuration
├── router/              # Router configuration
├── store/               # Pinia stores
├── typings/             # TypeScript declarations
├── views/               # Page components
├── App.vue              # Root component
└── main.ts              # Application entry
```

## Development Notes

- The router uses `createWebHashHistory()`.
- Authentication state is managed with Pinia and `localStorage`.
- User information is restored or refreshed when the app starts.
- Public system configuration is initialized before rendering the app.
- Page caching is controlled by `keep-alive` and route component names.

## Screenshots

### Public Pages

![Public Screenshot 1](./docs/ScreenShot_2026-06-17_133625_912.png)
![Public Screenshot 2](./docs/ScreenShot_2026-06-17_133703_606.png)
![Public Screenshot 3](./docs/ScreenShot_2026-06-17_133717_213.png)
![Public Screenshot 4](./docs/ScreenShot_2026-06-17_133729_451.png)
![Public Screenshot 5](./docs/ScreenShot_2026-06-17_133741_527.png)
![Public Screenshot 6](./docs/ScreenShot_2026-06-17_133754_759.png)
![Public Screenshot 7](./docs/ScreenShot_2026-06-17_133826_885.png)
![Public Screenshot 8](./docs/ScreenShot_2026-06-17_133850_229.png)
![Public Screenshot 9](./docs/ScreenShot_2026-06-17_133907_214.png)
![Public Screenshot 10](./docs/ScreenShot_2026-06-17_133916_584.png)
![Public Screenshot 11](./docs/ScreenShot_2026-06-17_133939_145.png)
![Public Screenshot 12](./docs/ScreenShot_2026-06-17_133952_288.png)

### User Console

![Console Screenshot 1](./docs/backed/ScreenShot_2026-06-17_134104_189.png)
![Console Screenshot 2](./docs/backed/ScreenShot_2026-06-17_134116_713.png)
![Console Screenshot 3](./docs/backed/ScreenShot_2026-06-17_134127_402.png)
![Console Screenshot 4](./docs/backed/ScreenShot_2026-06-17_134144_262.png)
![Console Screenshot 5](./docs/backed/ScreenShot_2026-06-17_140059_282.png)
![Console Screenshot 6](./docs/backed/ScreenShot_2026-06-17_140131_222.png)

## License

Private Project.
