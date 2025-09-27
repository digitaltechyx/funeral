'use server';

import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { revalidatePath } from 'next/cache';

export async function uploadWordDocument(file: File, reportId: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    console.log('Uploading Word document for report:', reportId);
    
    // Create a reference to the file in Firebase Storage
    const fileName = `word-reports/${reportId}/${file.name}`;
    const storageRef = ref(storage, fileName);
    
    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Upload the file
    const uploadResult = await uploadBytes(storageRef, uint8Array);
    console.log('Word document uploaded successfully:', uploadResult.metadata.fullPath);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    console.log('Word document download URL:', downloadURL);
    
    return {
      success: true,
      url: downloadURL
    };
  } catch (error) {
    console.error('Error uploading Word document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload Word document'
    };
  }
}

export async function deleteWordDocument(fileUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Deleting Word document:', fileUrl);
    
    // Extract the file path from the URL
    const url = new URL(fileUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
    
    if (!pathMatch) {
      throw new Error('Invalid file URL');
    }
    
    const filePath = decodeURIComponent(pathMatch[1]);
    const storageRef = ref(storage, filePath);
    
    // Delete the file
    await storage.deleteObject(storageRef);
    console.log('Word document deleted successfully');
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting Word document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete Word document'
    };
  }
}
