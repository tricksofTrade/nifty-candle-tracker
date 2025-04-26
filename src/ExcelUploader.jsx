import React from "react";
import * as XLSX from "xlsx";

export default function ExcelUploader({ onDataLoaded }) {
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets["5 min"];
      const json = XLSX.utils.sheet_to_json(sheet);
      onDataLoaded(json); // Send data to parent
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="mb-6">
      <label className="block mb-2 font-semibold text-white">Upload NIFTY 5-min Excel File</label>
      <input
        type="file"
        accept=".xlsx"
        onChange={handleFileUpload}
        className="p-2 bg-white rounded text-black"
      />
    </div>
  );
}
