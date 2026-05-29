import { redirect } from 'next/navigation';

// TODO: redirect to /apply for borrowers, /dashboard for ops roles based on stored role
export default function RootPage() {
  redirect('/login');
}
