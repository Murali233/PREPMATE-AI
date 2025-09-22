import { API_PATHS } from './apiPaths'; 
import axios from 'axios';

const uploadImage = async (imageFile) => {
    const formData = new FormData();
    // Append image file to form data
    formData.append('image', imageFile);

    try {
        const response = await axios.post(
            API_PATHS.AUTH.UPLOAD_IMAGE, 
            formData, 
            { 
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json'
                },
                withCredentials: true
            }
        );
        return response.data; // Return response data 
    } catch (error) { 
        console.error('Error uploading the image:', error);
        throw error; // Rethrow error for handling
    }
};

export default uploadImage;