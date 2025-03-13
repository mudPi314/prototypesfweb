import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import logo from './assets/prototype_wordmark.svg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faUpload, 
  faDownload, 
  faSpinner, 
  faArrowRight, 
  faCog, 
  faChevronDown, 
  faChevronUp 
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import apiConfig from './config';

function Deface() {
  // Define the CSS variables that would have been in App.css
  const styles = {
    // Typography
    fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
    fontSize: '16px',
    lineHeight: 1.5,
    fontWeight: 400,
    
    // Colors
    colorText: '#333333',
    colorBackground: '#ffffff',
    colorPrimary: '#5179f1',
    colorPrimaryHover: '#3557c4',
    colorSecondary: '#ff83fa',
    colorSecondaryHover: '#e45fe0',
    colorBorder: '#dddddd',
    colorLightBg: '#f5f5f5',
    colorErrorBg: '#f8d7da',
    colorErrorText: '#721c24',
    
    // Spacing
    spaceXs: '0.25rem',   /* 4px */
    spaceSm: '0.5rem',    /* 8px */
    spaceMd: '1rem',      /* 16px */
    spaceLg: '1.5rem',    /* 24px */
    spaceXl: '2rem',      /* 32px */
    spaceXxl: '3rem',     /* 48px */
    
    // Border radius
    radiusSm: '0.25rem',  /* 4px */
    radiusMd: '0.5rem',   /* 8px */
    radiusLg: '1rem',     /* 16px */
    radiusXl: '1.25rem',  /* 20px */
    
    // Font sizes
    textXs: '0.75rem',    /* 12px */
    textSm: '0.875rem',   /* 14px */
    textMd: '1rem',       /* 16px */
    textLg: '1.125rem',   /* 18px */
    textXl: '1.25rem',    /* 20px */
    text2xl: '1.5rem',    /* 24px */
    text3xl: '2rem',      /* 32px */
  };

  const [inputVideo, setInputVideo] = useState(null);
  const [outputVideo, setOutputVideo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Processing configuration options
  const [config, setConfig] = useState({
    fps: 60,
    maskType: 'solid', // 'blur', 'solid', 'mosaic' - default to black box
    keepAudio: true,
    resolution: '720p', // '480p', '720p', '1080p'
    threshold: 0.19, 
    maskScale: 1.3 
  });
  
  const inputVideoRef = useRef(null);
  const outputVideoRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setInputVideo(URL.createObjectURL(file));
      setOutputVideo(null);
      setError(null);
    } else {
      setError('Please select a valid video file');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const processVideo = async () => {
    if (!inputVideo) {
      setError('Please select a video to process');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    const formData = new FormData();
    const file = fileInputRef.current.files[0];
    formData.append('video', file);
    
    // Add configuration options to request
    formData.append('config', JSON.stringify(config));

    try {
      // Simulate progress during processing with randomized intervals
      // Create a more realistic randomized progress simulation
      let lastProgress = 0;
      let nextMilestone = 15;
      
      const randomizeProgress = () => {
        // Generate a random increment between 1-3%
        const increment = Math.random() * 2 + 1;
        
        // Apply the increment
        setProcessingProgress(prev => {
          const newProgress = Math.min(prev + increment, nextMilestone);
          lastProgress = newProgress;
          return newProgress;
        });
        
        // Check if we've reached our current milestone
        if (lastProgress >= nextMilestone) {
          // Set next milestone with some variability
          nextMilestone = Math.min(nextMilestone + Math.floor(Math.random() * 10) + 5, 92);
          
          // Longer pause at milestones - simulate "processing steps"
          return Math.floor(Math.random() * 1000) + 1000;
        }
        
        // Return a random delay between updates (slower than before)
        return Math.floor(Math.random() * 400) + 300;
      };
      
      // Initial progress update
      let progressTimer = setTimeout(function updateProgress() {
        const nextDelay = randomizeProgress();
        
        if (lastProgress < 90) {
          progressTimer = setTimeout(updateProgress, nextDelay);
        }
      }, 800);

      // Make API request to backend
      const response = await axios.post(`${apiConfig.apiBaseUrl}/api/deface`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Clear progress timer
      clearTimeout(progressTimer);
      setProcessingProgress(100);
      
      // Set the output video URL with full backend path
      setOutputVideo(`${apiConfig.apiBaseUrl}${response.data.processedVideoUrl}`);
    } catch (err) {
      const errorDetails = err.response?.data?.error || '';
      const commandDetails = err.response?.data?.command || '';
      setError('Error processing video: ' + (err.response?.data?.message || err.message) + 
               (errorDetails ? `\nDetails: ${errorDetails}` : '') +
               (commandDetails ? `\nCommand: ${commandDetails}` : ''));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    if (outputVideo) {
      try {
        // Show processing state while downloading
        setIsProcessing(true);
        
        // Fetch the video as a blob
        const response = await fetch(outputVideo);
        if (!response.ok) {
          throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
        }
        
        const videoBlob = await response.blob();
        
        // Create a blob URL and trigger download
        const blobUrl = URL.createObjectURL(videoBlob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'defaced-video.mp4';
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);
      } catch (error) {
        console.error("Error downloading video:", error);
        setError(`Error downloading video: ${error.message}`);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleConfigChange = (key, value) => {
    setConfig({ ...config, [key]: value });
  };

  useEffect(() => {
    // Auto-process video when file is selected
    if (inputVideo) {
      processVideo();
    }
  }, [inputVideo]);

  // Add resize listener to update the mobile state
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{
      width: '100%',
      maxWidth: '100%',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: styles.colorBackground,
      fontFamily: styles.fontFamily,
      fontSize: styles.fontSize,
      lineHeight: styles.lineHeight,
      boxSizing: 'border-box',
      overflowX: 'hidden',
      color: styles.colorText
    }}>
      {/* Header */}
      <header style={{
        borderBottom: `1px solid ${styles.colorBorder}`,
        paddingTop: styles.spaceLg,
        paddingBottom: styles.spaceLg,
        marginBottom: styles.spaceXl,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        backgroundColor: styles.colorBackground,
        position: 'relative',
        padding: `${styles.spaceLg} ${styles.spaceMd}`
      }}>
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: styles.spaceSm,
            padding: `${styles.spaceSm} ${styles.spaceMd}`,
            borderRadius: styles.radiusXl,
            border: `1px solid ${styles.colorBorder}`,
            fontSize: styles.textSm,
            fontWeight: 500,
            color: styles.colorText,
            textDecoration: 'none',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            backgroundColor: 'transparent',
            position: 'absolute',
            left: styles.spaceMd
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = styles.colorLightBg}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <FontAwesomeIcon icon={faHome} style={{ marginRight: styles.spaceXs }} />
          Back
        </Link>
        <h1 style={{ 
          fontSize: styles.text2xl, 
          fontWeight: '600', 
          margin: `${styles.spaceSm} 0` 
        }}>
          The Deface Program
        </h1>
      </header>

      {/* Main content */}
      <main style={{
        flex: 1,
        width: '100%',
        maxWidth: '100%',
        backgroundColor: styles.colorBackground,
        color: styles.colorText,
        boxSizing: 'border-box',
        margin: '0 auto',
        marginBottom: isMobile ? '16px' : '32px',
        display: 'flex',
        flexDirection: 'column', 
        maxWidth: '1200px',
        gap: isMobile ? '16px' : '24px',
        paddingLeft: '22px',
        paddingRight: '22px',
        paddingBottom: isMobile ? '16px' : '32px',
        ...(isMobile && { height: 'calc(100vh - 120px)', overflowY: 'auto' })
      }}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '32px' : '0',
          alignItems: 'center',
          width: '100%',
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          {/* Arrow - positioned behind the videos */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '0',
            right: '0',
            display: isMobile ? 'none' : 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transform: 'translateY(-50%)',
            zIndex: 0,
            width: '100%',
            height: '20px'
          }}>
            <svg 
              width="100%" 
              height="20" 
              viewBox="0 0 100 20" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M5 10 H95" 
                stroke="#cccccc" 
                strokeWidth="1.5"
              />
              <path 
                d="M48 4 L55 10 L48 16" 
                stroke="#cccccc" 
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
          </div>

          {/* Input video section */}
          <div style={{
            flex: isMobile ? '1' : '1 1 calc(50% - 20px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: isMobile ? '100%' : 'calc(50% - 20px)',
            zIndex: 1,
            background: styles.colorBackground
          }}>
            <div style={{ 
              width: '100%',
              height: 'auto',
              aspectRatio: isMobile ? '16/7' : '16/9',
              backgroundColor: styles.colorBackground,
              border: `1px solid ${styles.colorBorder}`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden'
            }}>
              {inputVideo ? (
                <video 
                  ref={inputVideoRef}
                  src={inputVideo} 
                  controls 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain',
                    maxHeight: 'none'
                  }}
                />
              ) : (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999999',
                  height: '100%',
                  width: '100%',
                  padding: '20px'
                }}>
                  <p style={{ margin: undefined }}>No video selected</p>
                </div>
              )}
            </div>
            
            <button
              onClick={handleUploadClick}
              disabled={isProcessing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                fontSize: isMobile ? '14px' : '16px',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                backgroundColor: styles.colorPrimary,
                color: 'white',
                marginTop: '16px',
                width: isMobile ? '160px' : '200px'
              }}
            >
              <FontAwesomeIcon icon={faUpload} />
              Upload Video
            </button>
            
            <input 
              type="file" 
              accept="video/*" 
              ref={fileInputRef}
              onChange={handleFileSelect} 
              style={{ display: 'none' }} 
            />
          </div>

          {/* Output video section */}
          <div style={{ 
            flex: isMobile ? '1' : '1 1 calc(50% - 20px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: isMobile ? '100%' : 'calc(50% - 20px)',
            zIndex: 1,
            background: styles.colorBackground
          }}>
            <div style={{ 
              width: '100%',
              height: 'auto',
              aspectRatio: isMobile ? '16/7' : '16/9',
              backgroundColor: styles.colorBackground,
              border: `1px solid ${styles.colorBorder}`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden'
            }}>
              {isProcessing ? (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999999',
                  padding: '20px',
                  backgroundColor: styles.colorBackground,
                  width: '100%',
                  height: '100%'
                }}>
                  <FontAwesomeIcon 
                    icon={faSpinner} 
                    spin 
                    size="3x" 
                    style={{ marginBottom: '16px' }} 
                  />
                  <p style={{ margin: undefined, fontSize: undefined }}>
                    Processing... {processingProgress.toFixed(1)}%
                  </p>
                  <div style={{
                    width: '90%',
                    height: '6px',
                    backgroundColor: '#eeeeee',
                    marginTop: '10px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${processingProgress}%`,
                      height: '100%',
                      backgroundColor: styles.colorPrimary,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              ) : outputVideo ? (
                <video 
                  ref={outputVideoRef}
                  src={outputVideo} 
                  controls 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain',
                    maxHeight: 'none'
                  }}
                />
              ) : (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999999',
                  backgroundColor: styles.colorBackground,
                  height: '100%',
                  width: '100%',
                  padding: '20px'
                }}>
                  <p style={{ margin: undefined }}>Waiting to process</p>
                </div>
              )}
            </div>

            <button
              onClick={handleExport}
              disabled={!outputVideo || isProcessing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid #dddddd',
                fontSize: isMobile ? '14px' : '16px',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                backgroundColor: !outputVideo || isProcessing ? styles.colorBackground : styles.colorSecondary,
                color: !outputVideo || isProcessing ? styles.colorText : 'white',
                marginTop: '16px',
                width: isMobile ? '160px' : '200px',
                opacity: !outputVideo || isProcessing ? '0.7' : '1',
                pointerEvents: !outputVideo || isProcessing ? 'none' : 'auto'
              }}
            >
              <FontAwesomeIcon icon={isProcessing ? faSpinner : faDownload} spin={isProcessing} />
              {isProcessing ? 'Downloading...' : 'Export Video'}
            </button>
          </div>
        </div>

        {/* Configuration panel */}
        <div style={{ 
          border: `1px solid ${styles.colorBorder}`,
          backgroundColor: styles.colorBackground,
          width: '100%',
          boxSizing: 'border-box',
          marginTop: '16px',
          ...(isMobile && { flex: '0 0 auto' })
        }}>
          <div
            onClick={() => setShowConfig(!showConfig)}
            style={{
              padding: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              backgroundColor: styles.colorLightBg,
              color: styles.colorText,
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FontAwesomeIcon icon={faCog} />
              <h4 style={{ 
                margin: 0, 
                fontSize: '16px'
              }}>
                Processing Configuration
              </h4>
            </div>
            <FontAwesomeIcon icon={showConfig ? faChevronUp : faChevronDown} />
          </div>

          {showConfig && (
            <div style={{
              padding: isMobile ? '16px' : '24px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                gap: isMobile ? '16px' : '24px',
              }}>
                {/* FPS Setting */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 500,
                    color: styles.colorText,
                    fontSize: '16px'
                  }}>
                    Frame Rate (FPS)
                  </label>
                  <select
                    value={config.fps}
                    onChange={(e) => handleConfigChange('fps', Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      border: `1px solid ${styles.colorBorder}`,
                      backgroundColor: styles.colorBackground,
                      color: styles.colorText,
                      fontSize: '16px'
                    }}
                    disabled={isProcessing}
                  >
                    <option value={60}>60 FPS</option>
                    <option value={30}>30 FPS</option>
                    <option value={24}>24 FPS</option>
                  </select>
                </div>

                {/* Mask Type */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 500,
                    color: styles.colorText,
                    fontSize: '16px'
                  }}>
                    Anonymization Method
                  </label>
                  <select
                    value={config.maskType}
                    onChange={(e) => handleConfigChange('maskType', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      border: `1px solid ${styles.colorBorder}`,
                      backgroundColor: styles.colorBackground,
                      color: styles.colorText,
                      fontSize: '16px'
                    }}
                    disabled={isProcessing}
                  >
                    <option value="solid">Black Box</option>
                    <option value="blur">Blur</option>
                    <option value="mosaic">Mosaic</option>
                  </select>
                </div>

                {/* Audio Setting */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 500,
                    color: styles.colorText,
                    fontSize: '16px'
                  }}>
                    Audio
                  </label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={config.keepAudio}
                        onChange={() => handleConfigChange('keepAudio', true)}
                        disabled={isProcessing}
                        style={{ marginRight: '8px' }}
                      />
                      Keep
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={!config.keepAudio}
                        onChange={() => handleConfigChange('keepAudio', false)}
                        disabled={isProcessing}
                        style={{ marginRight: '8px' }}
                      />
                      Remove
                    </label>
                  </div>
                </div>

                {/* Resolution Setting */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 500,
                    color: styles.colorText,
                    fontSize: '16px'
                  }}>
                    Resolution
                  </label>
                  <select
                    value={config.resolution}
                    onChange={(e) => handleConfigChange('resolution', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      border: `1px solid ${styles.colorBorder}`,
                      backgroundColor: styles.colorBackground,
                      color: styles.colorText,
                      fontSize: '16px'
                    }}
                    disabled={isProcessing}
                  >
                    <option value="480p">480p</option>
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                  </select>
                </div>
                
                {/* Detection Threshold Setting */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 500,
                    color: styles.colorText,
                    fontSize: '16px'
                  }}>
                    Detection Threshold: {config.threshold}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px', color: styles.colorText, fontSize: '12px' }}>0.5</span>
                    <input
                      type="range"
                      min="0.05"
                      max="0.5"
                      step="0.025"
                      value={config.threshold}
                      onChange={(e) => handleConfigChange('threshold', parseFloat(e.target.value))}
                      style={{
                        flex: 1,
                        accentColor: styles.colorPrimary
                      }}
                      disabled={isProcessing}
                    />
                    <span style={{ marginLeft: '8px', color: styles.colorText, fontSize: '12px' }}>0.05</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    Lower values detect more faces but may have false positives
                  </div>
                </div>
                
                {/* Mask Scale Setting */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 500,
                    color: styles.colorText,
                    fontSize: '16px'
                  }}>
                    Mask Size: {config.maskScale}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px', color: styles.colorText, fontSize: '12px' }}>1.0</span>
                    <input
                      type="range"
                      min="1.0"
                      max="2.0"
                      step="0.1"
                      value={config.maskScale}
                      onChange={(e) => handleConfigChange('maskScale', parseFloat(e.target.value))}
                      style={{
                        flex: 1,
                        accentColor: styles.colorPrimary
                      }}
                      disabled={isProcessing}
                    />
                    <span style={{ marginLeft: '8px', color: styles.colorText, fontSize: '12px' }}>2.0</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    Controls how much area around the face is obscured
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Error message */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '16px 24px',
          backgroundColor: styles.colorErrorBg,
          color: styles.colorErrorText,
          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          zIndex: 1000,
          maxWidth: '80%',
          whiteSpace: 'pre-wrap',
          textAlign: 'left',
          maxHeight: '80vh',
          overflowY: 'auto',
          fontSize: '16px',
          fontWeight: 500
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default Deface;