const AWS = require('aws-sdk');
const fs = require('fs');

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});


const Base64_File_Upload_And_Save_Into_Database = async (base64_file, image_type, question) => {
    try {
        const base64Data = base64_file?.split(';base64,').pop();
        const mimeType = base64_file?.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)[1];
        const fileExtension = mimeType.split('/')[1];

        const filename = `file_${Date.now()}.${fileExtension}`;
        const buffer = Buffer.from(base64Data, 'base64');

        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: filename,
            Body: buffer,
            ContentEncoding: 'base64',
            ContentType: mimeType,
        };

        const result = await s3.upload(params).promise();
        return result?.Location;
    } catch (error) {
        return { error_image: image_type, error_text: error.message };
    }
};

const File_Upload_In_S3 = async (file) => {
    const filename = `file_${Date.now()}.${file.originalname}`;
    const fileContent = fs.readFileSync(file.path);

    const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: filename,
        Body: fileContent,
    };

    const result = await s3.upload(params).promise();
    return result.Location;
};

const uploadImageToS3 = async (fileName, fileContent, mimeType) => {
    const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `${fileName}`,
        Body: fileContent,
        ContentType: mimeType,
    };

    const result = await s3.upload(params).promise();
    return result.Location;
};

module.exports = { uploadImageToS3, Base64_File_Upload_And_Save_Into_Database, File_Upload_In_S3 };