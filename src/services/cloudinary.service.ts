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