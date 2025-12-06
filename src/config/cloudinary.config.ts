import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream'; // Keep this import
import { BadRequestException } from '../common/utils/catch-errors';

// Configure Cloudinary with extended timeouts
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    upload_timeout: 600000, // 10 minutes
});

// REPAIRED FUNCTION SIGNATURE AND LOGIC
export async function uploadAndGetUrl(
    fileData: Readable | Buffer, // Now accepts both types
    filename: string,
    folder: string,
    existingPath?: string
): Promise<string | null> {
    try {
        // Convert Buffer to Readable Stream if necessary
        const stream = Buffer.isBuffer(fileData) ? Readable.from(fileData) : fileData;

        const fileExt = filename.split('.').pop()?.toLowerCase() || '';
        const resourceType = getResourceType(fileExt);

        let publicId: string;

        if (existingPath) {
            publicId = existingPath;
        } else {
            const uniqueFilename = `${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 8)}`.replace(/\s+/g, '-');
            publicId = `${folder}/${uniqueFilename}`;
        }

        const uploadOptions: any = {
            public_id: publicId,
            resource_type: resourceType,
            folder: folder,
            overwrite: !!existingPath,
            invalidate: !!existingPath,
            timeout: 600000,
        };

        // Enhanced options for video uploads
        if (resourceType === 'video') {
            uploadOptions.chunk_size = 6000000; // 6MB chunks
            uploadOptions.eager_async = true;
            uploadOptions.use_filename = true;
            uploadOptions.unique_filename = false;
        }

        console.log(`Uploading file: ${filename}`);
        // Use the converted stream
        const result = await uploadLargeStream(stream, uploadOptions);

        if (existingPath) {
            return null;
        }

        console.log(`Upload successful: ${result.secure_url}`);
        return result.secure_url;
    } catch (error: any) {
        console.error('Upload error:', error);
        throw new BadRequestException(`Upload failed: ${error.message}`);
    }
}

export async function deleteFile(
    folder: string,
    path: string
): Promise<void> {
    try {
        const publicId = path.startsWith(folder) ? path : `${folder}/${path}`;
        const fileExt = path.split('.').pop()?.toLowerCase() || '';
        const resourceType = getResourceType(fileExt);

        await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
            invalidate: true,
        });

        console.log(`File deleted: ${publicId}`);
    } catch (error: any) {
        console.error('Delete error:', error);
        throw new BadRequestException(`Delete failed: ${error.message}`);
    }
}

// Large file upload with chunking
function uploadLargeStream(stream: Readable, options: any): Promise<any> {
    return new Promise((resolve, reject) => {
        // 1. SELECT THE RIGHT UPLOAD METHOD
        // Use upload_chunked_stream for videos or large raw files to prevent timeouts.
        // Use standard upload_stream for images (faster/simpler).
        const uploader = (options.resource_type === 'video' || options.resource_type === 'raw')
            ? cloudinary.uploader.upload_chunked_stream
            : cloudinary.uploader.upload_stream;

        // 2. CREATE THE STREAM
        const uploadStream = uploader(
            options,
            (error: any, result: any) => {
                if (error) {
                    // Log the specific error for debugging
                    console.error('Cloudinary Stream Error:', error);
                    reject(new BadRequestException(`Upload failed: ${error.message}`));
                } else {
                    resolve(result);
                }
            }
        );

        // 3. HANDLE STREAM EVENTS
        uploadStream.on('error', (error: any) => {
            console.error('Upload stream error:', error);
            reject(new BadRequestException(`Stream error: ${error.message}`));
        });

        stream.on('error', (error: any) => {
            console.error('Read stream error:', error);
            reject(new BadRequestException(`Read error: ${error.message}`));
        });

        // 4. PIPE DATA
        stream.pipe(uploadStream);
    });
}

function getResourceType(fileExt: string): 'image' | 'video' | 'raw' | 'auto' {
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
    const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'mpeg'];

    if (imageExts.includes(fileExt)) {
        return 'image';
    } else if (videoExts.includes(fileExt)) {
        return 'video';
    } else {
        return 'raw';
    }
}

// Helper to extract public_id from Cloudinary URL
export function extractPublicIdFromUrl(url: string): string | null {
    try {
        const urlParts = url.split('/');
        const uploadIndex = urlParts.indexOf('upload');

        if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
            const pathAfterVersion = urlParts.slice(uploadIndex + 2).join('/');
            return pathAfterVersion.split('.')[0];
        }
        return null;
    } catch (error) {
        console.error('Error extracting public_id:', error);
        return null;
    }
}