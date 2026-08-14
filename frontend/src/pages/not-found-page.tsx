import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function NotFoundPage() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-muted-foreground text-center mb-6">
          The page you are looking for does not exist.
        </p>
        <Link to="/">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
