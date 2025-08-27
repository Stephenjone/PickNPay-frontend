import React, { useState } from 'react';

const UploadImage = () => {
  const [image, setImage] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState('');

  const handleFileChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!image) return alert("Select an image first");

    const formData = new FormData();
    formData.append('image', image);

    const res = await fetch('http://localhost:5000/api/upload', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    setUploadedUrl(`http://localhost:5000${data.imageUrl}`);
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      {uploadedUrl && (
        <div>
          <p>Uploaded Image:</p>
          <img src={uploadedUrl} alt="Uploaded" width="200" />
        </div>
      )}
    </div>
  );
};

export default UploadImage;
