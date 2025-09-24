import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { debugAuthState } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const ProductionDebugger: React.FC = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  // Check if debug mode is enabled via URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const debugMode = urlParams.get('debug');
    if (debugMode === 'auth') {
      setShowDebug(true);
    }
  }, []);

  const checkAuthState = async () => {
    const authState = await debugAuthState();
    setDebugInfo({
      authState,
      envVars: {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      },
      localStorage: {
        artspace_user: localStorage.getItem('artspace_user') ? 'Present' : 'Missing',
        artspace_auth_token: localStorage.getItem('artspace-auth-token') ? 'Present' : 'Missing',
      },
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  };

  useEffect(() => {
    if (showDebug) {
      checkAuthState();
    }
  }, [showDebug, user]);

  if (!showDebug) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-96 overflow-auto z-50 bg-white border-2 border-red-500">
      <CardHeader className="pb-2 bg-red-50">
        <CardTitle className="text-sm flex justify-between items-center">
          🔧 Production Auth Debugger
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowDebug(false)}
          >
            ×
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div>
          <strong>Auth State:</strong>
          <Badge variant={isAuthenticated ? "default" : "secondary"} className="ml-2">
            {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
          </Badge>
        </div>
        
        <div>
          <strong>Loading:</strong> {loading ? '⏳ Yes' : '✅ No'}
        </div>
        
        {user && (
          <div>
            <strong>User:</strong> {user.displayName} ({user.id})
          </div>
        )}
        
        {debugInfo && (
          <>
            <div>
              <strong>Environment Variables:</strong>
              <div className="ml-2">
                <div>URL: {debugInfo.envVars.VITE_SUPABASE_URL}</div>
                <div>Key: {debugInfo.envVars.VITE_SUPABASE_ANON_KEY}</div>
              </div>
            </div>
            
            <div>
              <strong>LocalStorage:</strong>
              <div className="ml-2">
                <div>User: {debugInfo.localStorage.artspace_user}</div>
                <div>Token: {debugInfo.localStorage.artspace_auth_token}</div>
              </div>
            </div>
            
            <div>
              <strong>Supabase Session:</strong>
              <div className="ml-2">
                <div>Has Session: {debugInfo.authState.session ? '✅ Yes' : '❌ No'}</div>
                <div>Error: {debugInfo.authState.error ? '❌ Yes' : '✅ No'}</div>
                {debugInfo.authState.error && (
                  <div className="text-red-500 text-xs">{debugInfo.authState.error.message}</div>
                )}
              </div>
            </div>
            
            <div>
              <strong>Timestamp:</strong> {debugInfo.timestamp}
            </div>
          </>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={checkAuthState}
          className="w-full"
        >
          🔄 Refresh Debug Info
        </Button>
        
        <div className="text-xs text-gray-500 mt-2">
          To enable: Add ?debug=auth to URL
        </div>
      </CardContent>
    </Card>
  );
};
