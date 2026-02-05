'use client';

import { useState } from 'react';
import { Upload, Download, FileText, Loader2, AlertCircle } from 'lucide-react';
import { detectAndFixEncoding } from '@/utils/encoding';
import * as XLSX from 'xlsx';

export default function EncodingFixer() {
    const [file, setFile] = useState<File | null>(null);
    const [csvContent, setCsvContent] = useState<string>('');
    const [previewRows, setPreviewRows] = useState<string[][]>([]);
    const [encoding, setEncoding] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setLoading(true);
        setError('');
        setFile(selectedFile);

        try {
            const result = await detectAndFixEncoding(selectedFile);
            setCsvContent(result.content);
            setEncoding(result.detectedEncoding);

            // Parse for preview using XLSX with raw: true to avoid date conversion (e.g. "1,2,4" -> date)
            const workbook = XLSX.read(result.content, { type: 'string', raw: true });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            // Get all rows as arrays
            const rows = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1, raw: true });

            setPreviewRows(rows.slice(0, 5) as string[][]);
        } catch (err) {
            console.error(err);
            setError('Failed to process file. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!csvContent) return;

        // Create a Blob with UTF-8 encoding (add BOM for Excel Windows compatibility)
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `fixed_${file?.name || 'file.csv'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-primary" />
                    ជួសជុសហ្វាល់ CSV ដែលអានភាសាខ្មែរមិនដាច់
                </h2>
                <p className="text-slate-500 mt-2">
                    សូមបង្ហោះហ្វាល់ CSV អ្នកដើម្បីជួសជុលហ្វាល់
                </p>
            </div>

            {!file && (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-primary transition-colors bg-slate-50">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="csv-upload"
                    />
                    <label
                        htmlFor="csv-upload"
                        className="cursor-pointer flex flex-col items-center justify-center gap-4"
                    >
                        <div className="p-4 bg-white rounded-full shadow-sm">
                            <Upload className="w-8 h-8 text-primary" />
                        </div>
                        <div className="text-slate-600 font-medium">
                            ចុចដើម្បីធ្វើការបង្ហោះ ឬអូសហ្វាល់របស់អ្នកចូល
                        </div>
                        <div className="text-sm text-slate-400">
                            ឧបករណ៏ស្គាល់ចំពោះតែ ហ្វាល់ .csv តែប៉ុណ្តោះ
                        </div>
                    </label>
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {file && !loading && !error && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div>
                            <p className="text-sm text-slate-500 font-medium">កូដដែលបានរកឃើញ (Encoding)</p>
                            <p className="text-lg font-bold text-slate-800">{encoding.toUpperCase()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-500 font-medium">ឈ្មោះហ្វាល់</p>
                            <p className="text-slate-800">{file.name}</p>
                        </div>
                        <button
                            onClick={() => {
                                setFile(null);
                                setPreviewRows([]);
                                setCsvContent('');
                            }}
                            className="text-sm text-red-500 hover:text-red-600 underline"
                        >
                            ចាប់ផ្តើមឡើងវិញ
                        </button>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-3">មើលគំរូ (៥ ជួរដំបូង)</h3>
                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-700 font-medium">
                                    {(previewRows.length > 0) && (() => {
                                        // Helper for Khmer numerals
                                        const toKhmerNumeral = (num: number) => {
                                            const khmerNums = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
                                            return num.toString().split('').map(d => khmerNums[parseInt(d)]).join('');
                                        };

                                        // Auto-detect structure for headers
                                        const sampleRow = previewRows[0];
                                        const col1 = sampleRow[1];

                                        // Robust check: Is it numeric OR does it match the "Points" header?
                                        const isPointsColumn =
                                            (!isNaN(Number(col1)) && col1 !== undefined && col1 !== '') ||
                                            ['Points', 'ពិន្ទុ'].includes((col1 || '').toString().trim());

                                        const baseHeaders = isPointsColumn
                                            ? ['ប្រភេទសំណួរ', 'ពិន្ទុ', 'សំណួរ', 'ចម្លើយ']
                                            : ['ប្រភេទសំណួរ', 'ពិន្ទុ', 'សំណួរ', 'ចម្លើយ'];

                                        const choiceCount = Math.max(0, sampleRow.length - baseHeaders.length);
                                        const choiceHeaders = Array.from({ length: choiceCount }, (_, i) => `ជម្រើសទី${toKhmerNumeral(i + 1)}`);

                                        const allHeaders = [...baseHeaders, ...choiceHeaders];

                                        return (
                                            <tr>
                                                {allHeaders.map((header, i) => (
                                                    <th key={i} className="px-4 py-3 border-b border-slate-200 whitespace-nowrap bg-indigo-50/50">
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        );
                                    })()}
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {previewRows.map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50">
                                            {row.map((cell, j) => (
                                                <td key={j} className="px-4 py-3 text-slate-600 max-w-[200px] truncate border-r border-slate-100 last:border-0">
                                                    {cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {previewRows.length === 0 && (
                                <div className="p-4 text-center text-slate-500">មិនមានទិន្នន័យ</div>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            * ចំណាំ៖ សូមពិនិត្យមើលថា តួអក្សរខ្មែរ (ឧទាហរណ៍៖ ខ្មែរ) ត្រឹមត្រូវដែរឬទេ។
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleDownload}
                            className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                            <Download className="w-5 h-5" />
                            ទាញយកហ្វាល់ CSV ដែលបានជួសជុល
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
