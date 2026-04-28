from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import FileResponse
import tempfile, shutil, subprocess, logging, uuid, base64
import cv2
from ultralytics import YOLO

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

app = FastAPI()

log.info("Loading YOLO model...")
model = YOLO("server/yolov8n-face.pt")
log.info("YOLO model loaded")

sessions: dict[str, list[dict]] = {}

SAMPLE_RATE = 30
PROXIMITY = 120 


def center_distance(b1: tuple, b2: tuple) -> float:
    c1 = ((b1[0] + b1[2]) / 2, (b1[1] + b1[3]) / 2)
    c2 = ((b2[0] + b2[2]) / 2, (b2[1] + b2[3]) / 2)
    return ((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2) ** 0.5


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/faces")
async def detect_faces(video: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
        shutil.copyfileobj(video.file, tmp)
        tmp_path = tmp.name

    cap = cv2.VideoCapture(tmp_path)
    tracks: list[dict] = [] 
    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % SAMPLE_RATE == 0:
            results = model(frame, verbose=False)
            matched_track_ids = set()

            for box_obj in results[0].boxes:
                box = tuple(map(int, box_obj.xyxy[0]))

                best_track, best_dist = None, float("inf")
                for track in tracks:
                    if track["id"] in matched_track_ids:
                        continue
                    d = center_distance(box, track["last_box"])
                    if d < PROXIMITY and d < best_dist:
                        best_dist, best_track = d, track

                if best_track:
                    best_track["last_box"] = box
                    best_track["observations"].append((frame_idx, box))
                    matched_track_ids.add(best_track["id"])
                else:
                    x1, y1, x2, y2 = box
                    crop = frame[max(0, y1):min(frame.shape[0], y2), max(0, x1):min(frame.shape[1], x2)]
                    _, buf = cv2.imencode(".jpg", crop)
                    thumbnail = base64.b64encode(buf).decode("utf-8")
                    new_id = len(tracks)
                    tracks.append({
                        "id": new_id,
                        "last_box": box,
                        "thumbnail": thumbnail,
                        "observations": [(frame_idx, box)],
                    })
                    matched_track_ids.add(new_id)

        frame_idx += 1

    cap.release()
    log.info(f"Found {len(tracks)} people across {frame_idx} frames")

    session_id = str(uuid.uuid4())
    sessions[session_id] = tracks

    return {
        "session_id": session_id,
        "faces": [{"id": t["id"], "thumbnail": t["thumbnail"], "count": len(t["observations"])} for t in tracks],
    }


@app.post("/blur")
async def blur(
    video: UploadFile = File(...),
    session_id: str = Form(...),
    face_ids: str = Form(...),
):
    selected_ids = {int(i) for i in face_ids.split(",") if i.strip()}
    tracks = sessions.get(session_id, [])
    selected_tracks = [t for t in tracks if t["id"] in selected_ids]

    selected_by_frame: dict[int, list[tuple]] = {}
    for track in selected_tracks:
        for fidx, box in track["observations"]:
            selected_by_frame.setdefault(fidx, []).append(box)

    log.info(f"Blurring {len(selected_tracks)} people for session {session_id}")

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

    active_blur_boxes: list[tuple] = []

    for fidx, frame in enumerate(frames):
        results = model(frame, verbose=False)
        detected = [tuple(map(int, b.xyxy[0])) for b in results[0].boxes]

        if fidx % SAMPLE_RATE == 0 and fidx in selected_by_frame:
            new_active = []
            for sel_box in selected_by_frame[fidx]:
                best, best_d = None, float("inf")
                for det in detected:
                    d = center_distance(det, sel_box)
                    if d < PROXIMITY and d < best_d:
                        best_d, best = d, det
                if best:
                    new_active.append(best)
            active_blur_boxes = new_active
        else:
            new_active = []
            for ablur in active_blur_boxes:
                best, best_d = None, float("inf")
                for det in detected:
                    d = center_distance(det, ablur)
                    if d < PROXIMITY and d < best_d:
                        best_d, best = d, det
                if best:
                    new_active.append(best)
            active_blur_boxes = new_active

        for box in active_blur_boxes:
            x1, y1, x2, y2 = box
            region = frame[y1:y2, x1:x2]
            if region.size > 0:
                frame[y1:y2, x1:x2] = cv2.GaussianBlur(region, (99, 99), 30)

        if fidx % 30 == 0:
            log.info(f"Processing frame {fidx}/{len(frames)}")

    out_path = tmp_path.replace(".mp4", "_out.mp4")
    frame_h, frame_w = frames[0].shape[:2]
    out = cv2.VideoWriter(out_path, cv2.VideoWriter_fourcc(*"mp4v"), 30, (frame_w, frame_h))
    for frame in frames:
        out.write(frame)
    out.release()

    final_path = tmp_path.replace(".mp4", "_final.mp4")
    subprocess.run(["ffmpeg", "-y", "-i", out_path, "-vcodec", "libx264", "-pix_fmt", "yuv420p", final_path])
    log.info(f"Done — output: {final_path}")

    return FileResponse(final_path, media_type="video/mp4", filename="blurred.mp4")
