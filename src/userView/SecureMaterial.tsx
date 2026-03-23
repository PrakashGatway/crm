// src/components/SecurePdfViewer.jsx
import React, { useEffect, useState } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { toolbarPlugin, ToolbarSlot } from '@react-pdf-viewer/toolbar';
import { thumbnailPlugin } from '@react-pdf-viewer/thumbnail';

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/toolbar/lib/styles/index.css';

const SecurePdfViewer = ({
  pdfUrl = 'https://ontheline.trincoll.edu/images/bookdown/sample-local-pdf.pdf', // ✅ CORS-friendly
  userEmail = 'XOZ0N@example.com',
  documentId = '1',
}) => {
  const [isClient, setIsClient] = useState(false);
  const thumbnailPluginInstance = thumbnailPlugin();


  useEffect(() => {
    setIsClient(true);
  }, []);

  // ✅ Use toolbarPlugin for full control
  const toolbarPluginInstance = toolbarPlugin();
  const { Toolbar } = toolbarPluginInstance;

  if (!isClient) {
    return <div className="p-6 text-center">Loading viewer...</div>;
  }

  return (
    <div className="relative w-full max-w-6xl max-w-6xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      {/* 💧 Watermark */}
      <div className="absolute inset-0 pointer-events-none z-50 opacity-50">
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 text-6xl font-bold text-gray-300 whitespace-nowrap rotate-12">
          {userEmail}
        </div>
        <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 text-5xl font-bold text-gray-300 whitespace-nowrap -rotate-12">
          Gateway Abroad Education
        </div>
      </div>

      {/* Viewer */}
      <div className="relative z-20 flex flex-col" style={{ height: '90vh' }}>
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <div
            className="rpv-core__viewer"
            style={{
              // border: '1px solid rgba(0, 0, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            <div
              style={{
                alignItems: 'center',
                backgroundColor: '#eeeeee',
                // borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                display: 'flex',
                padding: '4px',
              }}
            >
              <Toolbar>
                {(props: ToolbarSlot) => {
                  const {
                    CurrentPageInput,
                    // Download,
                    EnterFullScreen,
                    GoToNextPage,
                    GoToPreviousPage,
                    NumberOfPages,
                    // Print,
                    // ShowSearchPopover,
                    // Zoom,
                    ZoomIn,
                    ZoomOut,
                    // SwitchTheme
                  } = props;
                  return (
                    <>
                      {/* <div style={{ padding: '0px 2px' }}>
                        <ShowSearchPopover />
                      </div> */}
                      <div style={{ padding: '0px 2px' }}>
                        <ZoomOut />
                      </div>
                      {/* <div style={{ padding: '0px 2px' }}>
                        <Zoom />
                      </div> */}
                      <div style={{ padding: '0px 2px' }}>
                        <ZoomIn />
                      </div>
                      <div style={{ padding: '0px 2px', marginLeft: 'auto' }}>
                        <GoToPreviousPage />
                      </div>
                      <div style={{ padding: '0px 2px', width: '4rem' }}>
                        <CurrentPageInput />
                      </div>
                      <div style={{ padding: '0px 2px' }}>
                        _ / <NumberOfPages />
                      </div>
                      <div style={{ padding: '0px 2px' }}>
                        <GoToNextPage />
                      </div>
                      {/* <div style={{ padding: '0px 2px'}}>
                        <SwitchTheme />
                      </div> */}
                      <div style={{ padding: '0px 2px', marginLeft: 'auto' }}>
                        <EnterFullScreen />
                      </div>
                      {/* <div style={{ padding: '0px 2px' }}>
                        <Download />
                      </div> */}
                      {/* <div style={{ padding: '0px 2px' }}>
                        <Print />
                      </div> */}
                    </>
                  );
                }}
              </Toolbar>
            </div>
            <Viewer
              fileUrl={pdfUrl.trim()} // ✅ Remove accidental spaces
              plugins={[toolbarPluginInstance]}
            />
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
          </div>
        </Worker>
      </div>
    </div>
  );
};

export default SecurePdfViewer;