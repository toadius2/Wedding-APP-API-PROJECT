cd /usr/local/bin
if [ ! -d "ffmpeg" ]; then
sudo mkdir ffmpeg
cd ffmpeg
sudo wget https://s3.amazonaws.com/gradelo-app/server/install/ffmpeg.tar.xz
sudo tar xf ffmpeg.tar.xz
sudo mv ffmpeg-3.4.1-64bit-static ffmpeg
sudo ln -s /usr/local/bin/ffmpeg/ffmpeg/ffmpeg /usr/bin/ffmpeg
sudo ln -s /usr/local/bin/ffmpeg/ffmpeg/ffprobe /usr/bin/ffprobe
fi