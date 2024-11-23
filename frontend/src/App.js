import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [timeTaken, setTimeTaken] = useState(0);

  const handleFileChange = (e) => {
    setVideoFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      alert('Please upload a video file.');
      return;
    }

    setLoading(true);
    setSummary('');
    setTimeTaken(0);

    const formData = new FormData();
    formData.append('video', videoFile);

    const apibase = process.env.REACT_APP_BACKEND_URL;
    try {
      const response = await axios.post(
        `https://ai-video-backend.onrender.com/api/process-video`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setSummary(response.data.summary);
      setTimeTaken(response.data.timeTaken);
    } catch (error) {
      console.error('Error:', error.message);
      alert('Something went wrong! Check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-6xl w-full mt-10">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Video Summarizer
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-700 border border-gray-300 rounded-md shadow-sm"
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Upload and Summarize'}
          </button>
        </form>
        {summary && (
          <div className="mt-6 overflow-auto">
            <h2 className="text-lg font-semibold">Summary:</h2>
            <p className="text-sm text-gray-500 mt-2 mb-3">
              Time Taken: {timeTaken} seconds
            </p>
            <p className="text-gray-800 bg-gray-100 p-4 rounded-md">
              {summary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
