import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, Flashlight, RefreshCw, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { translations } from '../utils/i18n';

/**
 * Play a quick scanner beep using Web Audio API
 */
function playScannerBeep() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (_) {}
}

export default function BarcodeScannerModal({ isOpen, onClose, onScan, lang }) {
  const t = translations[lang];
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [currentCameraIdx, setCurrentCameraIdx] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    let html5QrCode = null;

    const startScanner = async () => {
      try {
        setErrorMsg('');
        setScannedResult(null);

        // Ensure Html5Qrcode is available
        if (!window.Html5Qrcode) {
          // Dynamic fallback loader
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error(t.cameraError));
            document.head.appendChild(script);
          });
        }

        if (!window.Html5Qrcode) {
          throw new Error(t.cameraError);
        }

        const scannerId = 'barcode-reader-box';
        html5QrCode = new window.Html5Qrcode(scannerId);
        scannerRef.current = html5QrCode;

        // Query available cameras
        try {
          const devices = await window.Html5Qrcode.getCameras();
          if (isMounted && devices && devices.length > 0) {
            setCameras(devices);
          }
        } catch (_) {}

        // Start scanning with environment/back camera preferred
        const cameraConfig = { facingMode: 'environment' };
        const scanConfig = {
          fps: 15,
          qrbox: (viewWidth, viewHeight) => {
            const width = Math.min(Math.floor(viewWidth * 0.85), 320);
            const height = Math.min(Math.floor(viewHeight * 0.55), 200);
            return { width, height };
          },
        };

        await html5QrCode.start(
          cameraConfig,
          scanConfig,
          (decodedText) => {
            if (!isMounted) return;
            handleDetectedCode(decodedText);
          },
          () => {
            // Frame parse error ignored while scanning
          }
        );

        if (isMounted) {
          setIsScanning(true);
          // Check torch capability
          try {
            const capabilities = html5QrCode.getRunningTrackCapabilities();
            if (capabilities && 'torch' in capabilities) {
              setHasTorch(true);
            }
          } catch (_) {}
        }
      } catch (err) {
        if (isMounted) {
          console.error('[Scanner Error]', err);
          setErrorMsg(err.message || t.cameraError);
          setIsScanning(false);
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (html5QrCode) {
        try {
          if (html5QrCode.isScanning) {
            html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
          } else {
            html5QrCode.clear();
          }
        } catch (_) {}
      }
    };
  }, [isOpen]);

  const handleDetectedCode = (code) => {
    if (!code || scannedResult) return;
    const cleanCode = code.trim();
    setScannedResult(cleanCode);
    playScannerBeep();
    if (navigator.vibrate) {
      try { navigator.vibrate([60, 40, 60]); } catch (_) {}
    }

    // Stop scanner promptly
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch(() => {});
    }

    // Deliver result after a brief micro-delay for visual feedback
    setTimeout(() => {
      onScan(cleanCode);
      onClose();
    }, 450);
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextTorch = !isTorchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setIsTorchOn(nextTorch);
    } catch (_) {}
  };

  const switchCamera = async () => {
    if (!scannerRef.current || cameras.length < 2) return;
    try {
      const nextIdx = (currentCameraIdx + 1) % cameras.length;
      setCurrentCameraIdx(nextIdx);
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      await scannerRef.current.start(
        cameras[nextIdx].id,
        { fps: 15, qrbox: { width: 280, height: 160 } },
        handleDetectedCode,
        () => {}
      );
    } catch (err) {
      console.warn('Camera switch error', err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !scannerRef.current) return;
    try {
      setErrorMsg('');
      const decodedText = await scannerRef.current.scanFile(file, true);
      if (decodedText) {
        handleDetectedCode(decodedText);
      }
    } catch (err) {
      setErrorMsg(lang === 'ar' ? 'لم يتم العثور على باركود صالح في الصورة.' : 'No valid barcode found in the image.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="scanner-modal-backdrop" onClick={onClose}>
      <div className="scanner-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="scanner-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={20} color="#6366f1" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
              {t.scanBarcodeBtn}
            </h3>
          </div>
          <button
            type="button"
            className="scanner-close-btn"
            onClick={onClose}
            aria-label={t.cameraClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Instructions */}
        <p className="scanner-instructions">
          {t.cameraInstruction}
        </p>

        {/* Video Viewport Container */}
        <div className="scanner-viewport-wrapper">
          <div id="barcode-reader-box" className="scanner-viewport"></div>

          {/* Scanning Reticle & Laser */}
          {isScanning && !scannedResult && (
            <div className="scanner-reticle">
              <div className="reticle-corner top-left"></div>
              <div className="reticle-corner top-right"></div>
              <div className="reticle-corner bottom-left"></div>
              <div className="reticle-corner bottom-right"></div>
              <div className="reticle-laser"></div>
            </div>
          )}

          {/* Scanned Success Overlay */}
          {scannedResult && (
            <div className="scanner-success-overlay">
              <CheckCircle2 size={48} color="#10b981" />
              <span style={{ fontWeight: 700, fontSize: '16px', marginTop: '8px' }}>
                {t.barcodeScanned}
              </span>
              <span className="badge badge-success" style={{ marginTop: '6px', fontSize: '14px' }}>
                {scannedResult}
              </span>
            </div>
          )}
        </div>

        {/* Error Notice */}
        {errorMsg && (
          <div className="scanner-error-box">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Toolbar Controls */}
        <div className="scanner-toolbar">
          {hasTorch && (
            <button
              type="button"
              className={`scanner-tool-btn ${isTorchOn ? 'active' : ''}`}
              onClick={toggleTorch}
              title={t.cameraTorch}
            >
              <Flashlight size={18} />
              <span>{t.cameraTorch}</span>
            </button>
          )}

          {cameras.length > 1 && (
            <button
              type="button"
              className="scanner-tool-btn"
              onClick={switchCamera}
              title={t.cameraSwitch}
            >
              <RefreshCw size={18} />
              <span>{t.cameraSwitch}</span>
            </button>
          )}

          {/* Upload photo as fallback */}
          <button
            type="button"
            className="scanner-tool-btn"
            onClick={() => fileInputRef.current?.click()}
            title={t.cameraUploadPhoto}
          >
            <Upload size={18} />
            <span>{t.cameraUploadPhoto}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </div>

        {/* Footer cancel button */}
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onClose}
            style={{ width: '100%', padding: '10px' }}
          >
            {t.cameraClose}
          </button>
        </div>
      </div>
    </div>
  );
}
