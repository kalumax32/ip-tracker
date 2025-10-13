let map;
let marker; // Store the current marker

// Ensure Leaflet is loaded and map container exists
function showMap(lat, lon) {
    if (typeof L === 'undefined') {
        alert('Leaflet library is not loaded.');
        return;
    }
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        alert('Map container not found in HTML.');
        return;
    }
    if (!map) {
        map = L.map('map').setView([lat, lon], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18
        }).addTo(map);
    }
    map.setView([lat, lon], 8);

    // Remove previous marker if it exists
    if (marker) {
        map.removeLayer(marker);
    }
    marker = L.marker([lat, lon]).addTo(map);
}

document.getElementById('trackBtn').addEventListener('click', async () => {
    const ip = document.getElementById('ipInput').value.trim();
    if (!ip) return alert("Please enter a valid IP address or domain.");

    const formData = new FormData();
    formData.append('ip', ip);

    const res = await fetch('/track_ip', {
        method: 'POST',
        body: formData
    });
    const data = await res.json();

    if (data.error) {
        document.getElementById('infoBox').innerHTML = `<p style="color:red;">${data.error}</p>`;
        return;
    }

    document.getElementById('infoBox').innerHTML = `
        <strong>IP:</strong> ${data.ip}<br>
        <strong>City:</strong> ${data.city}<br>
        <strong>Region:</strong> ${data.region}<br>
        <strong>Country:</strong> ${data.country_name}<br>
        <strong>ISP:</strong> ${data.org}<br>
        <strong>Latitude:</strong> ${data.latitude}<br>
        <strong>Longitude:</strong> ${data.longitude}<br>
        <strong>Timezone:</strong> ${data.timezone}<br>
    `;

    if (data.latitude && data.longitude) {
        showMap(data.latitude, data.longitude);
    }
});
