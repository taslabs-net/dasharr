import { GithubInfo } from 'fumadocs-ui/components/github-info';
import pkg from '../../../../package.json';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-6 py-8 max-w-2xl">
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold">About Dasharr</h1>
          <p className="text-lg text-muted-foreground">
            Version {pkg.version}
          </p>
        </div>
        
        
        <div className="flex justify-center pt-6">
          <GithubInfo 
            owner="taslabs-net" 
            repo="dasharr" 
            className="text-sm"
          />
        </div>
        
        <div className="text-center pt-4">
          <a 
            href="https://github.com/taslabs-net/dasharr/issues" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Issues?
          </a>
        </div>
      </div>
    </div>
  );
}