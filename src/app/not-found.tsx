import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function NotFound() {
  const t = await getTranslations('Error');
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
          <h2 className="text-2xl font-semibold">{t('notFound')}</h2>
          <p className="text-muted-foreground max-w-md">
            {t('tryAgain')}
          </p>
        </div>
        
        <Button asChild>
          <Link href="/">
            {t('goHome')}
          </Link>
        </Button>
      </div>
    </div>
  );
}
