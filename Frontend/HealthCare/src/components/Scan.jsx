// import React, { useState, useRef } from "react";
// import axios from "axios";
// import {
//   UploadCloud,
//   Camera,
//   Activity,
//   Loader2,
//   FileText,
//   RotateCcw,
// } from "lucide-react";
// import styles from "./Scan.module.css";

// const Scan = () => {
//   const [file, setFile] = useState(null);
//   const [preview, setPreview] = useState(null);
//   const [result, setResult] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [isCameraOpen, setIsCameraOpen] = useState(false);
//   const [stream, setStream] = useState(null);

//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const fileInputRef = useRef(null);

//   // === Select File from Gallery ===
//   const handleFileChange = (e) => {
//     const selected = e.target.files[0];
//     if (selected) {
//       setFile(selected);
//       const reader = new FileReader();
//       reader.onload = () => setPreview(reader.result);
//       reader.readAsDataURL(selected);
//       setResult(null);
//     }
//   };

// // === Start Camera ===
// const openCamera = async () => {
//   try {
//     const mediaStream = await navigator.mediaDevices.getUserMedia({
//       video: { facingMode: "environment" },
//     });
//     setStream(mediaStream);
//     setIsCameraOpen(true);

//     if (videoRef.current) {
//       videoRef.current.srcObject = mediaStream;

//       // ✅ explicitly call play() for desktop browsers
//        try {
//         await videoRef.current.play();
//        } catch (err) {
//          console.warn("Autoplay might be blocked, click to continue.");
//           alert("Click anywhere inside the window to allow camera playback.");
//         }
//       };
//     } catch (err) {
//     alert("Camera access denied: " + err.message);
//   }
// };


//   // === Capture from Camera ===
//   const capturePhoto = () => {
//     const video = videoRef.current;
//     const canvas = canvasRef.current;
//     if (!canvas || !video) return;

//     canvas.width = video.videoWidth;
//     canvas.height = video.videoHeight;
//     const ctx = canvas.getContext("2d");
//     ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

//     canvas.toBlob((blob) => {
//       const capturedFile = new File([blob], "camera-capture.jpg", {
//         type: "image/jpeg",
//       });
//       setFile(capturedFile);
//       setPreview(URL.createObjectURL(blob));
//       closeCamera();
//     });
//   };

//   // === Stop Camera ===
//   const closeCamera = () => {
//     if (stream) {
//       stream.getTracks().forEach((t) => t.stop());
//       setStream(null);
//     }
//     setIsCameraOpen(false);
//   };

//   // === Submit for Analysis ===
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!file) return alert("Please upload or capture an image first!");
//     setLoading(true);
//     const formData = new FormData();
//     formData.append("image", file);

//     try {
//       const res = await axios.post("http://localhost:5000/api/analyze", formData);
//       setResult(res.data);
//     } catch (err) {
//       alert("Error: " + err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // === Reset State ===
//   const resetAll = () => {
//     setFile(null);
//     setPreview(null);
//     setResult(null);
//     closeCamera();
//   };

//   return (
//     <div className={styles.container}>
//       <div className={styles.glassCard}>
//         <h1 className={styles.title}>
//           <Activity className={styles.icon} size={32} />
//           AI Surface Analyzer
//         </h1>
//         <p className={styles.subtitle}>
//           Upload or capture an image for instant medical-grade analysis
//         </p>

//         {!result && !isCameraOpen && (
//           <form className={styles.form} onSubmit={handleSubmit}>
//             <div className={styles.options}>
//               <button
//                 type="button"
//                 className={styles.optionButton}
//                 onClick={() => fileInputRef.current.click()}
//               >
//                 <UploadCloud size={28} />
//                 Upload Image
//               </button>

//               <button
//                 type="button"
//                 className={styles.optionButton}
//                 onClick={openCamera}
//               >
//                 <Camera size={28} />
//                 Open Camera
//               </button>
//             </div>

//             <input
//               ref={fileInputRef}
//               type="file"
//               accept="image/*"
//               onChange={handleFileChange}
//               className={styles.hiddenInput}
//             />

//             {preview && (
//               <div className={styles.previewContainer}>
//                 <img src={preview} alt="Preview" className={styles.previewImage} />
//               </div>
//             )}

//             <button type="submit" className={styles.analyzeBtn} disabled={loading}>
//               {loading ? (
//                 <>
//                   <Loader2 className={styles.spin} /> Analyzing...
//                 </>
//               ) : (
//                 "Analyze Surface"
//               )}
//             </button>
//           </form>
//         )}

//         {isCameraOpen && (
//           <div className={styles.cameraSection}>
//             <video
//               ref={videoRef}
//               autoPlay
//               playsInline
//               className={styles.video}
//             ></video>
//             <div className={styles.cameraControls}>
//               <button className={styles.captureBtn} onClick={capturePhoto}>
//                 📸 Capture
//               </button>
//               <button className={styles.cancelBtn} onClick={closeCamera}>
//                 Cancel
//               </button>
//             </div>
//             <canvas ref={canvasRef} className={styles.hiddenCanvas} />
//           </div>
//         )}

//         {result && (
//           <div className={styles.resultBox}>
//             <div className={styles.resultHeader}>
//               <FileText size={20} />
//               <h2>Analysis Report</h2>
//             </div>

//             <div className={styles.resultDetails}>
//               <div className={styles.resultLine}>
//                 <strong>Detected:</strong>{" "}
//                 <span>
//                   {result.label} ({result.confidence}%)
//                 </span>
//               </div>
//               <div className={styles.resultLine}>
//                 <strong>Caption:</strong> {result.caption}
//               </div>
//               {/* <div className={styles.resultLine}>
//                 <strong>Neutralized:</strong> {result.neutralized}
//               </div> */}

//               <div className={styles.reportBlock}>
//                 <pre>{result.report}</pre>
//               </div>
//             </div>

//             <button className={styles.resetBtn} onClick={resetAll}>
//               <RotateCcw size={18} /> New Analysis
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Scan;
import React, { useState, useRef } from "react";
import axios from "axios";
import {
  UploadCloud,
  Camera,
  Activity,
  Loader2,
  FileText,
  RotateCcw,
} from "lucide-react";
import styles from "./Scan.module.css";

const Scan = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // === Select File from Gallery ===
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(selected);
      setResult(null);
    }
  };

  // === Start Camera ===
  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(mediaStream);
      setIsCameraOpen(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        try {
          await videoRef.current.play();
        } catch (err) {
          console.warn("Autoplay blocked — click video to play manually.");
          alert("Click the video to start the camera.");
        }
      }
    } catch (err) {
      alert("Camera access denied: " + err.message);
    }
  };

  // === Capture from Camera ===
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !video) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const capturedFile = new File([blob], "camera-capture.jpg", {
        type: "image/jpeg",
      });
      setFile(capturedFile);
      setPreview(URL.createObjectURL(blob));
      closeCamera();
    });
  };

  // === Stop Camera ===
  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  // === Submit for AI Analysis ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please upload or capture an image first!");
    setLoading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await axios.post("http://localhost:5000/api/ai/analyze", formData,{
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data.analysis);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // === Reset State ===
  const resetAll = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    closeCamera();
  };

  return (
    <div className={styles.container}>
      <div className={styles.glassCard}>
        <h1 className={styles.title}>
          <Activity className={styles.icon} size={32} />
          AI Surface Analyzer
        </h1>
        <p className={styles.subtitle}>
          Upload or capture an image for instant medical-grade analysis
        </p>

        {!result && !isCameraOpen && (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.options}>
              <button
                type="button"
                className={styles.optionButton}
                onClick={() => fileInputRef.current.click()}
              >
                <UploadCloud size={28} />
                Upload Image
              </button>

              <button
                type="button"
                className={styles.optionButton}
                onClick={openCamera}
              >
                <Camera size={28} />
                Open Camera
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className={styles.hiddenInput}
            />

            {preview && (
              <div className={styles.previewContainer}>
                <img src={preview} alt="Preview" className={styles.previewImage} />
              </div>
            )}

            <button type="submit" className={styles.analyzeBtn} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className={styles.spin} /> Analyzing...
                </>
              ) : (
                "Analyze Surface"
              )}
            </button>
          </form>
        )}

        {isCameraOpen && (
          <div className={styles.cameraSection}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              onClick={() => videoRef.current && videoRef.current.play()}
              className={styles.video}
            />
            <div className={styles.cameraControls}>
              <button className={styles.captureBtn} onClick={capturePhoto}>
                📸 Capture
              </button>
              <button className={styles.cancelBtn} onClick={closeCamera}>
                Cancel
              </button>
            </div>
            <canvas ref={canvasRef} className={styles.hiddenCanvas} />
          </div>
        )}

        {result && (
          <div className={styles.resultBox}>
            <div className={styles.resultHeader}>
              <FileText size={20} />
              <h2>Analysis Report</h2>
            </div>

            <div className={styles.resultDetails}>
              <div className={styles.resultLine}>
                <strong>Detected:</strong>{" "}
                <span>
                  {result.label} ({result.confidence?.toFixed(2)}%)
                </span>
              </div>
              <div className={styles.resultLine}>
                <strong>Caption:</strong> {result.caption}
              </div>

              <div className={styles.reportBlock}>
                <pre>{result.report}</pre>
              </div>
            </div>

            <button className={styles.resetBtn} onClick={resetAll}>
              <RotateCcw size={18} /> New Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scan;
