import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthProvider {
  name: string;
  displayName: string;
  icon: string;
  available: boolean;
}

interface AuthProvidersProps {
  providers?: AuthProvider[];
}

export function AuthProviders({ providers }: AuthProvidersProps) {
  // Default providers if none specified
  const defaultProviders: AuthProvider[] = [
    {
      name: 'replit',
      displayName: 'Replit',
      icon: '🔧',
      available: true
    },
    {
      name: 'google',
      displayName: 'Google',
      icon: '🔍',
      available: false
    },
    {
      name: 'github',
      displayName: 'GitHub',
      icon: '🐙',
      available: false
    }
  ];

  const availableProviders = providers || defaultProviders.filter(p => p.available);

  if (availableProviders.length === 0) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Authentication Unavailable</CardTitle>
          <CardDescription>
            No authentication providers are configured. Please contact the administrator.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-md mx-auto">
      {availableProviders.length === 1 ? (
        // Single provider - direct login
        <Button 
          onClick={() => window.location.href = '/api/login'} 
          className="w-full"
          data-testid="button-login"
        >
          {availableProviders[0].icon} Login with {availableProviders[0].displayName}
        </Button>
      ) : (
        // Multiple providers - show options
        <Card>
          <CardHeader>
            <CardTitle>Choose Login Method</CardTitle>
            <CardDescription>
              Select your preferred way to sign in
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {availableProviders.map((provider) => (
              <Button
                key={provider.name}
                variant="outline"
                onClick={() => window.location.href = `/api/login?provider=${provider.name}`}
                className="w-full justify-start"
                data-testid={`button-login-${provider.name}`}
              >
                <span className="mr-2">{provider.icon}</span>
                Continue with {provider.displayName}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}