import imageCompression from 'browser-image-compression';
import { supabase } from './supabase';
import { db } from '@/db/database';

/**
 * Compress an image file to optimize for upload
 * Target: max 1920px width, 85% JPEG quality
 */
export async function compressImage(file: File): Promise<Blob> {
  const options = {
    maxWidthOrHeight: 1920,
    initialQuality: 0.85,
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('Failed to compress image');
  }
}

/**
 * Generate a unique filename for photo upload
 * Format: {userId}/{matchId}_{timestamp}.jpg
 */
export function generatePhotoFilename(userId: string, matchId: number | string): string {
  const timestamp = Date.now();
  return `${userId}/${matchId}_${timestamp}.jpg`;
}

/**
 * Upload a photo to Supabase Storage
 * Returns the public URL if successful, or queues for later if offline
 */
export async function uploadMatchPhoto(
  userId: string,
  matchId: number | string,
  file: File
): Promise<string | null> {
  try {
    // Compress the image
    const compressedBlob = await compressImage(file);

    // Generate filename
    const filename = generatePhotoFilename(userId, matchId);

    // Check if online
    if (!navigator.onLine) {
      // Queue for later upload
      await queuePhotoUpload(matchId, compressedBlob, filename);
      return null; // Will upload when online
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('match-photos')
      .upload(filename, compressedBlob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      // Queue for retry
      await queuePhotoUpload(matchId, compressedBlob, filename);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('match-photos')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Failed to upload photo:', error);
    return null;
  }
}

/**
 * Queue a photo upload for later processing (when offline)
 */
async function queuePhotoUpload(
  matchId: number | string,
  blob: Blob,
  filename: string
): Promise<void> {
  try {
    // Convert blob to base64 for storage
    const base64 = await blobToBase64(blob);

    await db.photo_upload_queue.add({
      matchId: typeof matchId === 'string' ? matchId : matchId.toString(),
      blob: base64,
      filename,
      createdAt: new Date(),
      retryCount: 0,
    });
  } catch (error) {
    console.error('Failed to queue photo upload:', error);
  }
}

/**
 * Process the photo upload queue (call when app comes online)
 */
export async function processPhotoUploadQueue(): Promise<void> {
  try {
    const queuedUploads = await db.photo_upload_queue.toArray();

    for (const upload of queuedUploads) {
      try {
        // Convert base64 back to blob
        const blob = await base64ToBlob(upload.blob);

        // Attempt upload
        const { data, error } = await supabase.storage
          .from('match-photos')
          .upload(upload.filename, blob, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (error) {
          console.error('Queue upload error:', error);
          // Increment retry count
          if (upload.retryCount < 5) {
            await db.photo_upload_queue.update(upload.id!, {
              retryCount: upload.retryCount + 1,
            });
          } else {
            // Remove after 5 failed attempts
            await db.photo_upload_queue.delete(upload.id!);
          }
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('match-photos')
          .getPublicUrl(data.path);

        // Update match with photo URL
        if (urlData.publicUrl) {
          // Try to find match in local DB
          const localMatch = await db.matches.get(parseInt(upload.matchId));
          if (localMatch) {
            await db.matches.update(localMatch.id!, {
              photo_url: urlData.publicUrl,
            });
          }

          // Also update in Supabase if user is authenticated
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('matches')
              .update({ photo_url: urlData.publicUrl })
              .eq('user_id', user.id)
              .eq('id', upload.matchId);
          }
        }

        // Remove from queue
        await db.photo_upload_queue.delete(upload.id!);
      } catch (error) {
        console.error('Failed to process queued upload:', error);
      }
    }
  } catch (error) {
    console.error('Failed to process upload queue:', error);
  }
}

/**
 * Delete a photo from Supabase Storage
 */
export async function deleteMatchPhoto(photoUrl: string): Promise<void> {
  try {
    // Extract filename from URL
    // Format: https://{project}.supabase.co/storage/v1/object/public/match-photos/{userId}/{matchId}_{timestamp}.jpg
    const urlParts = photoUrl.split('/match-photos/');
    if (urlParts.length < 2) return;

    const filename = urlParts[1];

    const { error } = await supabase.storage
      .from('match-photos')
      .remove([filename]);

    if (error) {
      console.error('Failed to delete photo:', error);
    }
  } catch (error) {
    console.error('Failed to delete photo:', error);
  }
}

// Helper functions

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string): Promise<Blob> {
  return new Promise((resolve) => {
    // Add data URL prefix if not present
    const dataUrl = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;

    fetch(dataUrl)
      .then((res) => res.blob())
      .then(resolve);
  });
}
