"use client";

import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from "@vis.gl/react-google-maps";
import { useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";

const HUB_POSITION = { lat: 51.0160639, lng: -3.1349833 };

export function FindUsMap() {
  const [infoOpen, setInfoOpen] = useState(true);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="h-[280px] md:h-[480px] rounded-3xl bg-muted flex flex-col items-center justify-center gap-3 border border-border">
        <MapPin className="h-8 w-8 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">
          Interactive map coming soon — add your Google Maps API key to enable it.
        </p>
        <a
          href="https://maps.app.goo.gl/BBxK3zLuSw2dXfpNA"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
        >
          View on Google Maps <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={HUB_POSITION}
        defaultZoom={17}
        mapId="DEMO_MAP_ID"
        className="h-[280px] md:h-[480px] w-full rounded-3xl overflow-hidden"
        gestureHandling="cooperative"
        fullscreenControl={true}
        streetViewControl={true}
        mapTypeControl={false}
        zoomControl={true}
        scaleControl={false}
      >
        <AdvancedMarker
          position={HUB_POSITION}
          onClick={() => setInfoOpen(true)}
          title="Bishops Hull Hub"
        >
          <Pin
            background="hsl(171 44% 38%)"
            borderColor="hsl(171 44% 25%)"
            glyphColor="white"
            scale={1.3}
          />
        </AdvancedMarker>

        {infoOpen && (
          <InfoWindow
            position={HUB_POSITION}
            onCloseClick={() => setInfoOpen(false)}
            pixelOffset={[0, -50]}
          >
            <div className="p-1 min-w-[180px]">
              <p className="font-semibold text-gray-900 text-sm">Bishops Hull Hub</p>
              <p className="text-xs text-gray-500 mt-0.5">Bishops Hull Playing Field</p>
              <p className="text-xs text-gray-500">Bishops Hull Hill</p>
              <p className="text-xs text-gray-500">Bishops Hull</p>
              <p className="text-xs text-gray-500">Taunton, TA1 5EB</p>
              <a
                href="https://maps.app.goo.gl/BBxK3zLuSw2dXfpNA"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline mt-2 inline-flex items-center gap-1"
              >
                Open in Google Maps <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
}
