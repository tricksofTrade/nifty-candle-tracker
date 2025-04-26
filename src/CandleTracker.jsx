import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";

// ✅ Helper to convert Excel serial date → JS date
function excelDateToJSDate(serial) {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  const fractional_day = serial - Math.floor(serial) + 0.0000001;
  const total_seconds = Math.floor(86400 * fractional_day);
  const seconds = total_seconds % 60;
  const minutes = Math.floor((total_seconds % 3600) / 60);
  const hours = Math.floor(total_seconds / 3600);
  date_info.setHours(hours);
  date_info.setMinutes(minutes);
  date_info.setSeconds(seconds);
  return date_info;
}

export default function CandleTracker() {
  const [candleData, setCandleData] = useState([]);
  const [inputTime, setInputTime] = useState("");
  const [targetCandle, setTargetCandle] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [status, setStatus] = useState("Waiting for Input");
  const [indexAfterTarget, setIndexAfterTarget] = useState(null);
  const [signal, setSignal] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets["5 min"];
      const json = XLSX.utils.sheet_to_json(sheet);

      console.log("EXCEL PREVIEW:", json.slice(0, 5)); // ✅ Log first 5 rows

      setCandleData(json);
      setStatus("Excel loaded! Ready to track.");
    };

    reader.readAsArrayBuffer(file);
  };

  const handleTrack = () => {
    const candle = candleData.find((c) => {
      const raw = c.date;
      if (!raw) return false;

      const parsedTime = excelDateToJSDate(raw);
      const formattedTime = parsedTime.toTimeString().slice(0, 5); // e.g., "10:00"

      return formattedTime === inputTime;
    });

    if (candle) {
      setTargetCandle(candle);
      setStatus("Tracking Candle: High=" + candle.high + " Low=" + candle.low);
      const targetIndex = candleData.indexOf(candle);
      setIndexAfterTarget(targetIndex + 1);
      setSignal(null);
    } else {
      setStatus("Candle not found!");
    }
  };

  useEffect(() => {
    let interval;
    if (indexAfterTarget !== null && targetCandle) {
      interval = setInterval(() => {
        if (indexAfterTarget < candleData.length) {
          const liveCandle = candleData[indexAfterTarget];
          setCurrentPrice(liveCandle.close);
          if (!signal) {
            if (liveCandle.close >= targetCandle.high) {
              setSignal("🔥 BUY Signal Triggered");
              setStatus("BUY at " + (liveCandle.time || "next candle"));
              clearInterval(interval);
            } else if (liveCandle.close <= targetCandle.low) {
              setSignal("🔻 SELL Signal Triggered");
              setStatus("SELL at " + (liveCandle.time || "next candle"));
              clearInterval(interval);
            }
          }
          setIndexAfterTarget((prev) => prev + 1);
        } else {
          clearInterval(interval);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [indexAfterTarget, targetCandle, signal, candleData]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-white">NIFTY 5-min Candle Tracker</h1>

      <input
        type="file"
        accept=".xlsx"
        onChange={handleFileUpload}
        className="p-2 mb-4 bg-white text-black rounded"
      />

      <div className="mb-4">
        <input
          type="text"
          placeholder="Enter Time (e.g., 10:00)"
          className="border p-2 mr-2 text-black"
          value={inputTime}
          onChange={(e) => setInputTime(e.target.value)}
        />
        <button
          onClick={handleTrack}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Track
        </button>
      </div>

      <div className="mb-2 text-white">Status: {status}</div>
      {currentPrice && (
        <div className="mb-2 text-yellow-300 font-bold">
          Live Price: {currentPrice}
        </div>
      )}
      {signal && (
        <div className="text-green-400 font-bold text-xl">{signal}</div>
      )}
    </div>
  );
}
