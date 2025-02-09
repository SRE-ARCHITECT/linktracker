
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from '@supabase/supabase-js';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link2, Copy, AlertCircle } from "lucide-react";

const Index = () => {
  const [url, setUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL || '',
    import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  );

  const generateShortCode = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 6 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
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
    
    if (!url.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma URL",
        variant: "destructive"
      });
      return;
    }

    if (!validateUrl(url)) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma URL válida",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const shortCode = generateShortCode();
      
      const { error } = await supabase
        .from('links')
        .insert([
          { 
            original_url: url,
            short_code: shortCode,
            click_count: 0
          }
        ]);

      if (error) throw error;

      const newShortUrl = `${window.location.origin}/${shortCode}`;
      setShortUrl(newShortUrl);
      
      toast({
        title: "Sucesso!",
        description: "Seu link foi encurtado",
      });
      
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: "Falha ao encurtar a URL. Tente novamente.",
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
        title: "Copiado!",
        description: "Link copiado para a área de transferência",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Falha ao copiar o link",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center gap-2">
            <Link2 className="w-10 h-10" />
            LinkTracker
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Encurte seus links, acompanhe seus cliques
          </p>
        </div>

        {!import.meta.env.VITE_SUPABASE_URL && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Configure sua conexão com o Supabase para usar o LinkTracker.
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 backdrop-blur-lg backdrop-filter border border-purple-100 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                type="url"
                placeholder="Cole sua URL longa aqui..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-lg transition-all duration-200 focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
            >
              {isLoading ? "Encurtando..." : "Encurtar URL"}
            </Button>
          </form>

          {shortUrl && (
            <div className="mt-8 p-6 bg-purple-50 dark:bg-gray-700 rounded-xl border border-purple-100 dark:border-gray-600">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Sua URL encurtada:</p>
              <div className="flex items-center gap-3">
                <Input
                  readOnly
                  value={shortUrl}
                  className="flex-1 bg-white dark:bg-gray-800"
                />
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="flex items-center gap-2 hover:bg-purple-50 dark:hover:bg-gray-700"
                >
                  <Copy className="w-4 h-4" />
                  Copiar
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
