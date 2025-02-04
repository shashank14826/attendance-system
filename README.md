# Student Attendance Monitoring Platform

A secure and efficient user authentication system built with React, Supabase, and Tailwind CSS.

## Features

- User registration with email verification
- Secure login with email and password
- Password reset functionality
- Profile management
- Session management
- Responsive UI with Tailwind CSS

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account and project

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory based on `.env.example`:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Supabase Setup

1. Create a new Supabase project
2. Enable Email Auth provider in Authentication settings
3. Configure email templates for verification and password reset
4. Copy your project URL and anon key to the `.env` file

## Project Structure

- `/src`
  - `/components`
    - `/auth` - Authentication components
    - `/profile` - Profile management components
  - `/contexts` - React Context providers
  - `/config` - Configuration files

## Security Features

- Email verification required for new accounts
- Secure password hashing (handled by Supabase)
- Protected routes for authenticated users
- Automatic session management
- Secure password reset flow

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
