import { MessageCircle } from 'lucide-react';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: { title: 'text-2xl', bubble: 'w-8 h-8 -right-1 -top-1' },
  md: { title: 'text-3xl', bubble: 'w-10 h-10 -right-2 -top-2' },
  lg: { title: 'text-4xl', bubble: 'w-12 h-12 -right-2 -top-2' },
};

export function AppLogo({ size = 'lg' }: AppLogoProps) {
  const classes = sizeClasses[size];

  return (
    <div className="relative inline-flex items-center justify-center">
      <MessageCircle
        className={`absolute ${classes.bubble} text-accent-red/20 fill-accent-red/10`}
        aria-hidden
      />
      <h1 className={`relative font-bold tracking-tight text-primary ${classes.title}`}>
        Mot-à-Mot
      </h1>
    </div>
  );
}
