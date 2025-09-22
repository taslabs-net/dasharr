import Link from 'next/link';

export function AboutLink() {
  return (
    <Link 
      href="/admin/about"
      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      About
    </Link>
  );
}