import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AdminHome() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Signed in</CardTitle>
        <CardDescription>
          Clerk authentication is working. Actual content management (categories, questions,
          options, editions) is done in the Directus admin UI — this route is intentionally a thin
          protected shell, per the LocalRater architecture.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <a
          className="text-sm text-primary underline underline-offset-4"
          href={import.meta.env.VITE_DIRECTUS_URL}
          target="_blank"
          rel="noreferrer"
        >
          Open Directus admin →
        </a>
      </CardContent>
    </Card>
  );
}
