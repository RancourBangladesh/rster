import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to employee page
  // This handles non-subdomain access (localhost)
  redirect('/employee');
}