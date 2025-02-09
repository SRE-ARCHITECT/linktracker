
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from '@supabase/supabase-js';
import { Alert, AlertDescription } from "@/components/ui/alert";

const Index = () => {
  const [url, setUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Initialize Supabase client with better error handling
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

  const generateShortCode = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a URL",
        variant: "destructive"
      });
      return;
    }

    if (!validateUrl(url)) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive"
      });
      return;
    }

    if (!supabase) {
      toast({
        title: "Error",
        description: "Database connection not available. Please check your Supabase configuration.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const shortCode = generateShortCode();
      
      const { data, error } = await supabase
        .from('links')
        .insert([
          { 
            original_url: url,
            short_code: shortCode,
            click_count: 0
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const newShortUrl = `${window.location.origin}/${shortCode}`;
      setShortUrl(newShortUrl);
      toast({
        title: "Success!",
        description: "Your link has been shortened",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to shorten the URL. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
            LinkTracker
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Shorten your links, track your clicks
          </p>
        </div>

        {!supabase && (
          <Alert className="mb-6">
            <AlertDescription>
              Please configure your Supabase connection to use LinkTracker.
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 backdrop-blur-lg backdrop-filter">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Input
                type="url"
                placeholder="Enter your long URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-lg"
                disabled={!supabase}
              />
            </div>
            
            <Button
              type="submit"
              disabled={isLoading || !supabase}
              className="w-full"
            >
              {isLoading ? "Shortening..." : "Shorten URL"}
            </Button>
          </form>

          {shortUrl && (
            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Your shortened URL:</p>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={shortUrl}
                  className="flex-1"
                />
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                >
                  Copy
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
