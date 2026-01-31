import React, { useMemo } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

export type OSMCoordinate = {
  latitude: number;
  longitude: number;
};

export type OSMMarker = OSMCoordinate & {
  title?: string;
  emoji?: string;
  emojiSize?: number;
};

export type OSMPolyline = {
  coordinates: OSMCoordinate[];
  color?: string;
  weight?: number;
};

type OSMMapProps = {
  center: OSMCoordinate;
  zoom?: number;
  markers?: OSMMarker[];
  polyline?: OSMPolyline;
  fitBounds?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: (coords: OSMCoordinate) => void;
};

export const OSMMap: React.FC<OSMMapProps> = ({
  center,
  zoom = 14,
  markers = [],
  polyline,
  fitBounds = false,
  style,
  onPress,
}) => {
  const html = useMemo(() => {
    const markersJson = JSON.stringify(markers);
    const lineJson = JSON.stringify(polyline?.coordinates || []);
    const lineColor = polyline?.color || '#0A84FF';
    const lineWeight = polyline?.weight || 4;

    return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    crossorigin=""
  />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    .emoji-marker { background: transparent; border: none; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script
    src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
    crossorigin=""
  ></script>
  <script>
    const map = L.map('map').setView([${center.latitude}, ${center.longitude}], ${zoom});
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: ''
    }).addTo(map);

    const markers = ${markersJson};
    markers.forEach((m) => {
      const hasEmoji = Boolean(m.emoji);
      const icon = hasEmoji
        ? L.divIcon({
            className: 'emoji-marker',
            html: '<div style="font-size:' + (m.emojiSize || 20) + 'px;">' + m.emoji + '</div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        : undefined;

      const marker = icon ? L.marker([m.latitude, m.longitude], { icon }) : L.marker([m.latitude, m.longitude]);
      if (m.title) {
        marker.bindPopup(m.title);
      }
      marker.addTo(map);
    });

    const lineCoords = ${lineJson};
    const lineLatLngs = Array.isArray(lineCoords)
      ? lineCoords.map((c) => [c.latitude, c.longitude])
      : [];
    let boundsPoints = [];
    if (lineLatLngs.length) {
      const polyline = L.polyline(lineLatLngs, { color: '${lineColor}', weight: ${lineWeight} }).addTo(map);
      boundsPoints = boundsPoints.concat(lineLatLngs);
    }

    if (${fitBounds ? 'true' : 'false'}) {
      markers.forEach((m) => boundsPoints.push([m.latitude, m.longitude]));
      if (boundsPoints.length > 1) {
        map.fitBounds(boundsPoints, { padding: [30, 30] });
      }
    }

    map.on('click', function(e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'press',
        latitude: e.latlng.lat,
        longitude: e.latlng.lng
      }));
    });
  </script>
</body>
</html>`;
  }, [center.latitude, center.longitude, zoom, markers, polyline, fitBounds]);

  return (
    <WebView
      key={`${center.latitude}-${center.longitude}-${zoom}-${fitBounds}`}
      originWhitelist={['*']}
      source={{ html }}
      style={style}
      javaScriptEnabled
      domStorageEnabled
      onMessage={(event) => {
        if (!onPress) return;
        try {
          const payload = JSON.parse(event.nativeEvent.data);
          if (payload?.type === 'press') {
            onPress({ latitude: payload.latitude, longitude: payload.longitude });
          }
        } catch {
          // ignore malformed messages
        }
      }}
    />
  );
};
