export const getUser = () => {
    try {
        const userStr = localStorage.getItem("user");
        if (!userStr) return null;

        const user = JSON.parse(userStr);

        // Validate user object has required fields
        if (user && user._id && user.email) {
            return user;
        }

        return null;
    } catch (error) {
        console.error("Error parsing user from localStorage:", error);
        return null;
    }
};

export const isLoggedIn = () => {
    return getUser() !== null;
};

export const logout = () => {
    localStorage.removeItem("user");
    // Also clear JWT cookie if needed
    document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
};

export const setUser = (userData) => {
    try {
        localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
        console.error("Error saving user to localStorage:", error);
    }
};
