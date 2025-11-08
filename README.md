# Brain Squared

A Next.js application with authentication and AI chatbot functionality.

## Features

- **Protected Authentication**: Chat access requires login/signup
- **Authentication Page**: Complete login and signup interface with form validation
- **Session Management**: Persistent authentication using localStorage
- **Route Protection**: Chatbot page automatically redirects unauthenticated users
- **Chatbot Interface**: Interactive chat UI for AI conversations (auth required)
- **Modern UI**: Built with Tailwind CSS and responsive design
- **TypeScript**: Fully typed for better development experience
- **Dark Mode**: Supports system dark mode preferences

## Getting Started

### Installation

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## Project Structure

```
brain_squared/
├── app/
│   ├── auth/
│   │   └── page.tsx        # Authentication page (login/signup)
│   ├── chat/
│   │   └── page.tsx        # Protected chatbot interface
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout with AuthProvider
│   └── page.tsx            # Home page
├── contexts/
│   └── AuthContext.tsx     # Authentication context and provider
├── public/                 # Static files
├── .gitignore
├── next.config.ts          # Next.js configuration
├── package.json
├── postcss.config.mjs      # PostCSS configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## Pages

### Home Page (`/`)
- Landing page with dynamic content based on auth status
- Shows user name when logged in
- Different CTAs for authenticated vs unauthenticated users
- Logout option for authenticated users

### Authentication Page (`/auth`)
- Toggle between login and signup modes
- Email and password validation
- Password confirmation for signup
- Minimum 6 character password requirement
- Error message display
- Loading state during authentication
- Auto-redirect to chat after successful login
- Social login UI (Google, GitHub - ready for integration)
- Responsive design with dark mode

### Chat Page (`/chat`) - Protected Route
- **Requires Authentication**: Redirects to `/auth` if not logged in
- Real-time chat interface
- User info display in header
- Message history with timestamps
- Auto-scroll to latest messages
- Clear chat functionality
- Logout button
- Loading indicator while processing
- Placeholder AI responses (ready for API integration)

## Customization

### Connecting to an AI API

To connect the chatbot to a real AI service, modify the `handleSubmit` function in [app/chat/page.tsx](app/chat/page.tsx):

```typescript
// Replace the setTimeout simulation with your API call
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: input }),
});
const data = await response.json();
```

### Adding Authentication Backend

The app currently uses a simple localStorage-based authentication for demo purposes. To implement a real authentication backend, modify the `login` function in [contexts/AuthContext.tsx](contexts/AuthContext.tsx):

```typescript
const login = async (email: string, password: string, name?: string): Promise<boolean> => {
  // Replace with actual API call
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });

  if (response.ok) {
    const userData = await response.json();
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    return true;
  }
  return false;
};
```

## How Authentication Works

1. **Login/Signup**: Users enter credentials on the `/auth` page
2. **Session Storage**: User data is stored in localStorage (replace with JWT/cookies in production)
3. **Protected Routes**: The `/chat` page checks authentication status
4. **Auto-Redirect**: Unauthenticated users are redirected to `/auth`
5. **Persistent Sessions**: Users remain logged in across page refreshes
6. **Logout**: Clears session data and redirects to home

## Technologies Used

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React 19 RC** - UI library

## License

MIT
