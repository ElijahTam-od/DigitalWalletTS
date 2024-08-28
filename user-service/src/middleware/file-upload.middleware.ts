import multer, { StorageEngine } from 'multer';
import path from 'path';
import fs from 'fs';

// Define the upload directory
const uploadDir = path.join(__dirname, '..', 'uploads');

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage: StorageEngine = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadDir);
	},
	filename: (req, file, cb) => {
		cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
	},
});

// Configure Multer
const upload = multer({
	storage: storage,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB file size limit
	},
	fileFilter: (req, file, cb) => {
		if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
			cb(null, true);
		} else {
			cb(new Error('Invalid file type. Only PDF and images are allowed.'));
		}
	},
});

export default upload;