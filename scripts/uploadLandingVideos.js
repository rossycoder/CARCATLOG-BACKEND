const cloudinary = require('cloudinary').v2;
const path = require('path');

cloudinary.config({
  cloud_name: 'dexgkptpg',
  api_key: '628432189849288',
  api_secret: 'nnK2Z8muNYrC31t53M1aN8_MjH0'
});

const videos = [
  {
    file: path.join(__dirname, '../../public/videos/landingvideo.mp4'),
    public_id: 'carcatalog/landingvideo'
  },
  {
    file: path.join(__dirname, '../../public/videos/reel.mp4'),
    public_id: 'carcatalog/reel'
  }
];

async function uploadVideos() {
  for (const video of videos) {
    console.log(`Uploading ${video.public_id}...`);
    try {
      const result = await cloudinary.uploader.upload(video.file, {
        resource_type: 'video',
        public_id: video.public_id,
        overwrite: true,
        chunk_size: 6000000
      });
      console.log(`✅ Done: ${result.secure_url}`);
    } catch (err) {
      console.error(`❌ Failed ${video.public_id}:`, err.message);
    }
  }
}

uploadVideos();
