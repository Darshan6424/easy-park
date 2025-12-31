import { useEffect, useRef } from "react";
import generateQr from "../../lib/qrCodeGenerator";

const QRComponent = ({ value }) => {
  let data = value;
  if(typeof data !== 'string'){
    data = JSON.stringify(value);
  }
  const qrRef = useRef(null);

  useEffect(() => {
    if (!qrRef.current) return; 
    const qrCode = generateQr(data);
    qrRef.current.innerHTML = "";
    qrCode.append(qrRef.current);

    return () => {
      if (qrRef.current) {
        qrRef.current.innerHTML = "";
      }
    };
  }, [value]);

  return <div ref={qrRef} />;
};

export default QRComponent;
