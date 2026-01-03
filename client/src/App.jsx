import Radar from "radar-sdk-js";
import "radar-sdk-js/dist/radar.css";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

const App = () => {
  // States
  const [locationInfo, setLocationInfo] = useState({});
  const [locationWatchID, setLocationWatchID] = useState();
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  // References
  const mapRef = useRef();
  const markerRef = useRef({});
  const socketRef = useRef();

  // Functions
  const handleEnableLocation = () => {
    console.log("Enabling Location");

    const watchID = window.navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log({ latitude, longitude });
        setLocationInfo({ userID: socketRef.current.id, latitude, longitude });
        setIsLocationEnabled(true);
        // Emit current location
      },
      (error) => {
        console.log(error.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      }
    );

    setLocationWatchID(watchID);

    if (socketRef.current.disconnected) {
      socketInitialization();
    }
  };

  const handleDisableLocation = () => {
    console.log("Disabling Location");
    navigator.geolocation.clearWatch(locationWatchID);
    setIsLocationEnabled(false);
    setLocationInfo({});
    mapRef.current.remove();
    markerRef.current = {};
    socketRef.current.disconnect();
  };

  const handleTestBtn = () => {
    console.log(markerRef.current);
  };

  const socketInitialization = () => {
    socketRef.current = io("https://192.168.0.215:5000");

    socketRef.current.on("connected", (data) => {
      console.log(data);
    });

    socketRef.current.on("others-location", (data) => {
      Object.keys(data).map((key) => {
        // Don't create a marker for the current user.
        if (key === socketRef.current.id) return;

        const { userID, latitude, longitude } = data[key];

        const color = data.userID === socketRef.current.id ? "red" : "blue";

        const newMarker = Radar.ui
          .marker({
            color: color,
            width: 40,
            height: 80,
            popup: {
              text: userID,
            },
          })
          .setLngLat([longitude, latitude])
          .addTo(mapRef.current);

        markerRef.current[userID] = newMarker;
      });
    });

    socketRef.current.on("receive-location", (data) => {
      const { userID, latitude, longitude } = data;
      console.log("Received Location:", { longitude, latitude });
      if (mapRef.current) {
        // Check if userID already exists
        if (Object.keys(markerRef.current).find((item) => item === userID)) {
          markerRef.current[userID].setLngLat([longitude, latitude]);
        } else {
          const color = data.userID === socketRef.current.id ? "red" : "blue";
          const newMarker = Radar.ui
            .marker({
              color: color,
              width: 40,
              height: 80,
              popup: {
                text: userID,
              },
            })
            .setLngLat([longitude, latitude])
            .addTo(mapRef.current);

          markerRef.current[userID] = newMarker;
        }
      }
    });

    socketRef.current.on("remove-marker", (id) => {
      if (markerRef.current[id]) {
        markerRef.current[id].remove();
        delete markerRef.current[id];
      }
    });

    // When socket gets disconnected
    socketRef.current.on("disconnect", () => {
      console.log("Socket Disconnected");
      delete markerRef[socketRef.current.id];
    });
  };

  // useEffects
  useEffect(() => {
    Radar.initialize("prj_test_pk_38e6576bdd61ed57be05f3c0796eaa017b9864a5");
  }, []);

  useEffect(() => {
    if (isLocationEnabled) {
      mapRef.current = Radar.ui.map({
        container: "map",
        style: "radar-default-v1",
        center: [locationInfo.longitude, locationInfo.latitude],
        zoom: 16,
      });

      if (!markerRef.current["bupMarker"]) {
        Radar.ui
          .marker({
            url: "https://upload.wikimedia.org/wikipedia/en/9/95/Bangladesh_University_of_Professionals_%28BUP%29_Logo.svg",
            width: "48px",
            height: "48px",
            popup: {
              text: "Bangladesh University of Professionals",
            },
          })
          .setLngLat([90.35763600418083, 23.83990460043535])
          .addTo(mapRef.current);
      }
    }
    return () => {
      // map.current.remove();
    };
  }, [isLocationEnabled]);

  useEffect(() => {
    if (isLocationEnabled) {
      socketRef.current.emit("send-location", {
        userID: socketRef.current.id,
        latitude: locationInfo.latitude,
        longitude: locationInfo.longitude,
      });
    }

    return () => {
      // markerRef.current.remove();
    };
  }, [locationInfo]);

  // Initial Socket Connection
  useEffect(() => {
    socketInitialization();
    return () => {
      socketRef.current.off("connected");
      socketRef.current.off("others-location");
      socketRef.current.off("receive-location");
      socketRef.current.off("remove-marker");
      socketRef.current.off("disconnect");
      socketRef.current.disconnect();
    };
  }, []);

  return (
    <div className="bg-auto flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-center my-10">
        Welcome to Real Time Location Tracker App
      </h1>

      <button
        onClick={() => {
          isLocationEnabled ? handleDisableLocation() : handleEnableLocation();
        }}
        className="bg-blue-600 text-blue-50 py-2 px-5 rounded cursor-pointer active:bg-blue-700 hover:bg-blue-500 transition-all ease-in-out"
      >
        {isLocationEnabled ? "Disable" : "Enable"} Location
      </button>

      {isLocationEnabled && (
        <div className="flex flex-md-row flex-col w-full px-md-20 px-5 gap-10">
          <div className="flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-center mt-10 mb-5">
              Location Information
            </h2>
            <table>
              <thead>
                <tr>
                  <th>Latidude</th>
                  <th>Longitude</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{locationInfo?.latitude}</td>
                  <td>{locationInfo?.longitude}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <button
            onClick={() => handleTestBtn()}
            className="max-w-20 self-center bg-red-600 text-red-50 py-2 px-5 rounded cursor-pointer active:bg-red-700 hover:bg-red-500 transition-all ease-in-out"
          >
            Test
          </button>
          <div className="w-full flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-center mb-5">
              Live Location
            </h2>
            <div
              id="map"
              style={{
                width: "100%",
                height: "500px",
                border: "1px solid black",
              }}
              className="mb-10"
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
