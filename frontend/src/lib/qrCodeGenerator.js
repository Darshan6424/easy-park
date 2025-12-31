import QRCodeStyling from 'qr-code-styling';

const generateQr = (data) => {
    const qrCode = new QRCodeStyling({
        width: 100,
        height: 100,
        type: "svg",
        data: data,
        image: "",//put svg img of website's logo
        dotsOptions: {
            color: "black",
            type: "rounded"
        },
        backgroundOptions: {
            color: "white",
        },
        imageOptions: {
            crossOrigin: "anonymous",
            margin: 20
        }
    });
    return qrCode;
}

export default generateQr;