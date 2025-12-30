import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import toast from 'react-hot-toast';

const QrCodeScanner = () => {
  const [scannedResult, setScannedResult] = useState(null);

  const handleScan = (result) => {
    if (result) {
      setScannedResult(result[0].rawValue); 
      if (typeof result === 'string'){
        const data = JSON.parse(result);
        return data;
      }
    }
  };

  const handleError = (error) => {
    console.log("Error ", error.message);
    toast.error("Scan failed, Please Scan Again")
  };

  return (
    <div>
        <div  className='w-[100px] h-[100px] rounded-5xl'>
          <Scanner classNames='w-full border-2 border-[#7c63d8] rounded-full'
            onScan={handleScan}
            onError={handleError}
            constraints={{ audio: false, video: { facingMode: 'environment' } }}
            scanDelay={500} 
          />
        </div>
    </div>
  );
};

export default QrCodeScanner;
