// 29/09/2026
export function formatDate(ts) {
    return new Date(ts).toLocaleDateString("en-GB");
}

// 6:42 PM
export function formatTime(ts) {
    return new Date(ts).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}