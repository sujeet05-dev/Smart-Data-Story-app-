/**
 * DashboardOverview Component
 * ---------------------------
 * A clean, professional, and easy-to-understand overview of the dataset.
 */

import React from 'react';
import {
  Database, Columns, CheckCircle2, ShieldCheck, FileSpreadsheet, Activity
} from 'lucide-react';

export default function DashboardOverview({ data }) {
  const { data_overview, preprocessing_report, domain, report_title } = data;

  const totalMissing = Object.values(data_overview.missing_values || {}).reduce((a, b) => a + b, 0);
  const totalRows = data_overview.rows || 0;
  const totalCols = data_overview.columns || 0;
  
  // Calculate data health percentage roughly based on missing values
  const totalCells = totalRows * totalCols;
  const healthScore = totalCells > 0 ? Math.max(0, 100 - ((totalMissing / totalCells) * 100)).toFixed(1) : 100;

  const colTypes = data_overview.column_types || {};
  const numericalCount = colTypes.numerical?.length || 0;
  const categoricalCount = colTypes.categorical?.length || 0;
  const datetimeCount = colTypes.datetime?.length || 0;
  const textCount = colTypes.text?.length || 0;

  return (
    <div className="space-y-10 w-full animate-fadeInUp">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-8 bg-gradient-to-r from-[#222431] to-[#2A2B3A] p-10 rounded-[28px] shadow-xl border border-white/5">
        <div className="text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-bold uppercase tracking-wider mb-5">
            <Activity className="w-4 h-4" />
            {domain}
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-3 tracking-tight">{report_title}</h2>
          <p className="text-base text-gray-400 font-medium leading-relaxed">
            Your dataset has been successfully processed, cleaned, and analyzed.
          </p>
        </div>
        
        {/* Health Score Badge */}
        <div className="flex flex-col items-center justify-center bg-[#1E202C] px-10 py-8 rounded-[24px] border border-white/5 shadow-inner shrink-0">
          <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 mb-2">
            {healthScore}%
          </div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Data Health</p>
        </div>
      </div>

      {/* 4 Core Metrics — Square Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#232533] rounded-[20px] border border-white/5 shadow-lg relative overflow-hidden group flex flex-col items-center justify-center text-center" style={{ aspectRatio: '1 / 1' }}>
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/10 rounded-full group-hover:scale-150 transition-transform duration-700" />
          <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-5 relative z-10">
            <Database className="w-7 h-7 text-blue-400" />
          </div>
          <p className="text-xs font-semibold text-gray-400 mb-2 relative z-10 uppercase tracking-wider">Total Records</p>
          <h3 className="text-3xl lg:text-4xl font-bold text-white mb-2 relative z-10">{totalRows.toLocaleString()}</h3>
          <p className="text-xs text-gray-500 font-medium relative z-10">Analyzed rows</p>
        </div>

        <div className="bg-[#232533] rounded-[20px] border border-white/5 shadow-lg relative overflow-hidden group flex flex-col items-center justify-center text-center" style={{ aspectRatio: '1 / 1' }}>
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-purple-500/10 rounded-full group-hover:scale-150 transition-transform duration-700" />
          <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-5 relative z-10">
            <Columns className="w-7 h-7 text-purple-400" />
          </div>
          <p className="text-xs font-semibold text-gray-400 mb-2 relative z-10 uppercase tracking-wider">Variables</p>
          <h3 className="text-3xl lg:text-4xl font-bold text-white mb-2 relative z-10">{totalCols.toLocaleString()}</h3>
          <p className="text-xs text-gray-500 font-medium relative z-10">Detected columns</p>
        </div>

        <div className="bg-[#232533] rounded-[20px] border border-white/5 shadow-lg relative overflow-hidden group flex flex-col items-center justify-center text-center" style={{ aspectRatio: '1 / 1' }}>
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-orange-500/10 rounded-full group-hover:scale-150 transition-transform duration-700" />
          <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center mb-5 relative z-10">
            <ShieldCheck className="w-7 h-7 text-orange-400" />
          </div>
          <p className="text-xs font-semibold text-gray-400 mb-2 relative z-10 uppercase tracking-wider">Missing Values</p>
          <h3 className="text-3xl lg:text-4xl font-bold text-white mb-2 relative z-10">{totalMissing.toLocaleString()}</h3>
          <p className="text-xs text-gray-500 font-medium relative z-10">Handled automatically</p>
        </div>

        <div className="bg-[#232533] rounded-[20px] border border-white/5 shadow-lg relative overflow-hidden group flex flex-col items-center justify-center text-center" style={{ aspectRatio: '1 / 1' }}>
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-green-500/10 rounded-full group-hover:scale-150 transition-transform duration-700" />
          <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center mb-5 relative z-10">
            <CheckCircle2 className="w-7 h-7 text-green-400" />
          </div>
          <p className="text-xs font-semibold text-gray-400 mb-2 relative z-10 uppercase tracking-wider">Cleaned Duplicates</p>
          <h3 className="text-3xl lg:text-4xl font-bold text-white mb-2 relative z-10">{(preprocessing_report.duplicates_removed || 0).toLocaleString()}</h3>
          <p className="text-xs text-gray-500 font-medium relative z-10">Removed for accuracy</p>
        </div>
      </div>

      {/* Bottom Section — Square Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Composition Bar */}
        <div className="bg-[#232533] rounded-[20px] p-8 border border-white/5 shadow-lg flex flex-col justify-center" style={{ aspectRatio: '1 / 1' }}>
          <h3 className="text-xl font-bold text-white mb-8 tracking-wide">Data Composition</h3>
          
          <div className="space-y-8 flex-1 flex flex-col justify-center">
            <div>
              <div className="flex justify-between text-base font-semibold mb-3">
                <span className="text-indigo-400">Numerical</span>
                <span className="text-white">{numericalCount.toLocaleString()} cols</span>
              </div>
              <div className="w-full bg-[#1E202C] rounded-full h-3">
                <div className="bg-indigo-500 h-3 rounded-full" style={{ width: `${(numericalCount/totalCols)*100}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-base font-semibold mb-3">
                <span className="text-purple-400">Categorical</span>
                <span className="text-white">{categoricalCount.toLocaleString()} cols</span>
              </div>
              <div className="w-full bg-[#1E202C] rounded-full h-3">
                <div className="bg-purple-500 h-3 rounded-full" style={{ width: `${(categoricalCount/totalCols)*100}%` }}></div>
              </div>
            </div>

            {(datetimeCount > 0 || textCount > 0) && (
              <div>
                <div className="flex justify-between text-base font-semibold mb-3">
                  <span className="text-emerald-400">Other (Date/Text)</span>
                  <span className="text-white">{(datetimeCount + textCount).toLocaleString()} cols</span>
                </div>
                <div className="w-full bg-[#1E202C] rounded-full h-3">
                  <div className="bg-emerald-500 h-3 rounded-full" style={{ width: `${((datetimeCount + textCount)/totalCols)*100}%` }}></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Data Preview Snapshot */}
        <div className="bg-[#232533] rounded-[20px] p-8 border border-white/5 shadow-lg overflow-hidden flex flex-col" style={{ aspectRatio: '1 / 1' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-3 tracking-wide">
              <FileSpreadsheet className="w-6 h-6 text-indigo-400" />
              Data Snapshot
            </h3>
            <span className="text-sm font-bold text-gray-400 bg-[#1E202C] px-4 py-2 rounded-full border border-white/5 tracking-wider uppercase">First 5 Rows</span>
          </div>
          
          <div className="overflow-x-auto overflow-y-auto rounded-[16px] border border-white/5 flex-1 bg-[#1A1C26]">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-[#1E202C] text-sm uppercase text-gray-400 font-semibold border-b border-white/5 sticky top-0">
                <tr>
                  {data_overview.column_names?.slice(0, 6).map(col => (
                    <th key={col} className="px-5 py-4 whitespace-nowrap tracking-wider">{col}</th>
                  ))}
                  {data_overview.column_names?.length > 6 && <th className="px-5 py-4">...</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data_overview.sample_data?.map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                    {data_overview.column_names?.slice(0, 6).map(col => (
                      <td key={col} className="px-5 py-4 whitespace-nowrap max-w-[130px] truncate font-medium text-[14px]">
                        {row[col] != null ? String(row[col]) : <span className="text-gray-600">—</span>}
                      </td>
                    ))}
                    {data_overview.column_names?.length > 6 && <td className="px-5 py-4 text-gray-500">...</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
