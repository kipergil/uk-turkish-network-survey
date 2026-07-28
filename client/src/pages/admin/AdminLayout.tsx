import { SignedIn, SignedOut, SignIn, UserButton } from '@clerk/clerk-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import AdminHome from './AdminHome';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

export default function AdminLayout() {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Admin</CardTitle>
          <CardDescription>
            Clerk is not configured. Set <code>VITE_CLERK_PUBLISHABLE_KEY</code> to enable /admin.
            Day-to-day content management (categories/questions/options) happens directly in the
            Directus admin — this route is only an optional extra layer.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <SignedOut>
        <div className="flex justify-center py-12">
          <SignIn routing="hash" />
        </div>
      </SignedOut>
      <SignedIn>
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Admin</h1>
            <UserButton />
          </div>
          <AdminHome />
        </div>
      </SignedIn>
    </>
  );
}
