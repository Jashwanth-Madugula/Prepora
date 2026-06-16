import cloudinary from "@/lib/cloudinary";

export async function uploadResumeBuffer(
  buffer: Buffer,
  fileName: string
) {
  return new Promise(
    (resolve, reject) => {

      const stream =
        cloudinary.uploader.upload_stream(
          {
            folder:
              "prepora/resumes",

            resource_type:
              "raw",

            public_id:
              fileName,
          },

          (error, result) => {

            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

      stream.end(buffer);
    }
  );
}



export async function deleteResumeFromCloudinary(
  publicId: string
) {
  return cloudinary.uploader.destroy(
    publicId,
    {
      resource_type: "raw",
    }
  );
}

/**
 * Uploads an audio recording buffer (standard WebM format) to Cloudinary.
 * Note: Cloudinary classifies audio files under the resource_type: "video".
 * Storing under a unique filename in folder "prepora/interviews/audio".
 *
 * FLOW INVOLVEMENT:
 * 1. React Frontend records speech blob via MediaRecorder.
 * 2. Frontend sends blob to POST /api/interviews/upload-audio.
 * 3. Upload endpoint converts file to buffer and passes to this service.
 * 4. Streaming upload pushes chunks to Cloudinary and returns details (secure_url).
 */
export async function uploadAudioBuffer(
  buffer: Buffer,
  fileName: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "prepora/interviews/audio",
        resource_type: "video", // Audio is handled as "video" resource type in Cloudinary
        public_id: fileName,
        format: "webm",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    stream.end(buffer);
  });
}

/**
 * Uploads a video recording buffer (standard WebM format) to Cloudinary.
 * Storing under folder "prepora/interviews/video".
 *
 * FLOW INVOLVEMENT:
 * 1. React Frontend records webcam stream via MediaRecorder.
 * 2. Frontend sends video blob to POST /api/interviews/upload-video.
 * 3. Upload endpoint converts file to buffer and passes to this service.
 * 4. Streaming upload pushes chunks to Cloudinary and returns details (secure_url).
 */
export async function uploadVideoBuffer(
  buffer: Buffer,
  fileName: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "prepora/interviews/video",
        resource_type: "video", // Video resource type
        public_id: fileName,
        format: "webm",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    stream.end(buffer);
  });
}