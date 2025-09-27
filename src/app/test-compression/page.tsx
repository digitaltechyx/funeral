'use client';

import { useState } from 'react';
import { compressImage } from '@/lib/image-compression';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function TestCompressionPage() {
  const [result, setResult] = useState<{
    type: 'success' | 'error';
    message: string;
    originalSize?: number;
    compressedSize?: number;
    compressionRatio?: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setResult(null);

    try {
      console.log('Testing compression with file:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      const compressedFile = await compressImage(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      });

      const compressionRatio = ((file.size - compressedFile.size) / file.size * 100);
      
      setResult({
        type: 'success',
        message: 'Compression test completed successfully!',
        originalSize: file.size,
        compressedSize: compressedFile.size,
        compressionRatio: compressionRatio
      });

      console.log('Compression test result:', {
        originalSize: file.size,
        compressedSize: compressedFile.size,
        compressionRatio: compressionRatio.toFixed(2) + '%'
      });

    } catch (error) {
      console.error('Compression test failed:', error);
      setResult({
        type: 'error',
        message: `Compression test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Image Compression Test</CardTitle>
          <CardDescription>
            Test the image compression functionality by selecting an image file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="file-input" className="block text-sm font-medium mb-2">
              Select an image file to test compression:
            </label>
            <input
              id="file-input"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isLoading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {isLoading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Compressing image...</p>
            </div>
          )}

          {result && (
            <Alert variant={result.type === 'error' ? 'destructive' : 'default'}>
              {result.type === 'error' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <div className="space-y-2">
                  <p>{result.message}</p>
                  {result.originalSize && result.compressedSize && (
                    <div className="text-sm space-y-1">
                      <p><strong>Original size:</strong> {(result.originalSize / 1024).toFixed(2)} KB</p>
                      <p><strong>Compressed size:</strong> {(result.compressedSize / 1024).toFixed(2)} KB</p>
                      <p><strong>Compression ratio:</strong> {result.compressionRatio?.toFixed(2)}% reduction</p>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-gray-600 space-y-2">
            <h4 className="font-medium">Test Instructions:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Select an image file (JPG, PNG, etc.)</li>
              <li>The compression will attempt to reduce the file size to 0.5MB or less</li>
              <li>Check the console for detailed logs</li>
              <li>If compression fails, the original file will be used as fallback</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
