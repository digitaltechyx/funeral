'use server';

import { addDependent, deleteDependent, updateDependent } from '@/lib/firestore-service';
import { revalidatePath } from 'next/cache';

export async function addDependentAction(memberId: string, formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const relationship = formData.get('relationship') as string;

    if (!name || !relationship) {
      throw new Error('Name and relationship are required');
    }

    const dependentId = await addDependent(memberId, { name, relationship });
    
    revalidatePath('/dashboard/dependents');
    return { success: true, dependentId };
  } catch (error) {
    console.error('Error adding dependent:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to add dependent' };
  }
}

export async function deleteDependentAction(dependentId: string) {
  try {
    await deleteDependent(dependentId);
    
    revalidatePath('/dashboard/dependents');
    return { success: true };
  } catch (error) {
    console.error('Error deleting dependent:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete dependent' };
  }
}

export async function updateDependentAction(dependentId: string, formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const relationship = formData.get('relationship') as string;

    if (!name || !relationship) {
      throw new Error('Name and relationship are required');
    }

    await updateDependent(dependentId, { name, relationship });
    
    revalidatePath('/dashboard/dependents');
    return { success: true };
  } catch (error) {
    console.error('Error updating dependent:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update dependent' };
  }
}

