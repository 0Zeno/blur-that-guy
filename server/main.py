from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse
import tempfile, shutil, subprocess, logging
import cv2
from ultralytics import YOLO

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

app = FastAPI()

log.info("Loading YOLO model...")
model = YOLO("server/yolov8n-face.pt")
log.info("YOLO model loaded")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/blur")
async def blur(video: UploadFile = File(...)):
    log.info(f"Received file: {video.filename}")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
        shutil.copyfileobj(video.file, tmp)
        tmp_path = tmp.name

    cap = cv2.VideoCapture(tmp_path)
    frames = []
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frames.append(frame)
    cap.release()
    log.info(f"Extracted {len(frames)} frames")

    total_faces = 0
    for i, frame in enumerate(frames):
        results = model(frame, verbose=False)
        for box in results[0].boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
            total_faces += 1
        if i % 30 == 0:
            log.info(f"Processing frame {i}/{len(frames)}")
    log.info(f"Detection done — {total_faces} face boxes drawn")

    out_path = tmp_path.replace(".mp4", "_out.mp4")
    frame_h, frame_w = frames[0].shape[:2]
    out = cv2.VideoWriter(out_path, cv2.VideoWriter_fourcc(*"mp4v"), 30, (frame_w, frame_h))
    for frame in frames:
        out.write(frame)
    out.release()
    log.info("Frames written to intermediate video")

    final_path = tmp_path.replace(".mp4", "_final.mp4")
    subprocess.run([
        "ffmpeg", "-y", "-i", out_path,
        "-vcodec", "libx264", "-pix_fmt", "yuv420p",
        final_path
    ])
    log.info(f"Done — output: {final_path}")

    return FileResponse(final_path, media_type="video/mp4", filename="blurred.mp4")

