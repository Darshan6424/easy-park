// frontend/src/config/config.js
const APP_CONFIG = {
    name: {
        english: "ParkMeIn",
        nepali: "पार्कमीइन",
    },
    email: "support@parkmein.com",
    phone: "+977 9822222222",
    address: "Lalitpur, Nepal",
    social: {
        twitter: "https://twitter.com/parkmein",
        facebook: "https://facebook.com/parkmein",
        instagram: "https://instagram.com/parkmein",
    },
    colors: {
        primary: "#DC143C",
        primaryDark: "#B01030",
        secondary: "#2C3E50",
    },
    api: {
        baseURL: import.meta.env.VITE_API_BASE_URL,
    },
};

export default APP_CONFIG;
