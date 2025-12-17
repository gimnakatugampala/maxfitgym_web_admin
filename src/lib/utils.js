export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getYouTubeId(url) {
  const match = url.match(/[?&]v=([^&#]+)/) || url.match(/youtu\.be\/([^&#]+)/);
  return match ? match[1] : null;
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
