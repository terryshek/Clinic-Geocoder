import React, { useState } from 'react';
import { ClinicData } from '../types';

interface ClinicTableProps {
  data: ClinicData[];
  className?: string;
}

export const ClinicTable: React.FC<ClinicTableProps> = ({ data, className }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleData = data.slice(startIndex, startIndex + pageSize);

  const RowItem = ({ item }: { item: ClinicData }) => {
    const hasCoords = !!item.LatLng;
    const address = item.Address[0]?.Address || 'No Address';
    const coords = item.LatLng || 'Pending...';

    return (
      <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors text-sm">
        <td className="p-3 font-medium text-slate-700 w-16">{item.RowNo}</td>
        <td className="p-3 text-slate-600 font-medium">{item.PHFName}</td>
        <td className="p-3 text-slate-500 max-w-xs truncate" title={address}>
            {address}
        </td>
        <td className="p-3 whitespace-nowrap">
            {hasCoords ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                    {coords}
                </span>
            ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    Missing
                </span>
            )}
        </td>
        <td className="p-3 text-slate-500 text-center">
            <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.PHFName + ' ' + address)}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline"
            >
                Map
            </a>
        </td>
      </tr>
    );
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
      <div className="flex-grow overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse relative">
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">No.</th>
              <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Clinic Name</th>
              <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Address</th>
              <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Coordinates</th>
              <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {visibleData.map((item) => (
              <RowItem key={item.PHFNo} item={item} />
            ))}
            {visibleData.length === 0 && (
                <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                        No data available.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Footer */}
      <div className="border-t border-slate-200 bg-slate-50 p-3 flex items-center justify-between">
         <span className="text-sm text-slate-600">
            Showing {Math.min(startIndex + 1, data.length)} to {Math.min(startIndex + pageSize, data.length)} of {data.length} records
         </span>
         <div className="flex gap-2">
            <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Previous
            </button>
            <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Next
            </button>
         </div>
      </div>
    </div>
  );
};